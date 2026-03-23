import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const [tab, setTab] = useState("genome");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const qc = useQueryClient();

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: fullStats }          = useQuery<any>({ queryKey:["/api/hospital/full-stats"],         refetchInterval:15000 });
  const { data: patients = [] }      = useQuery<any[]>({ queryKey:["/api/hospital/patients"],         refetchInterval:15000 });
  const { data: diseases = [] }      = useQuery<any[]>({ queryKey:["/api/hospital/diseases"],         refetchInterval:60000 });
  const { data: discovered = [] }    = useQuery<any[]>({ queryKey:["/api/hospital/discovered-diseases"], refetchInterval:20000 });
  const { data: citations = [] }     = useQuery<any[]>({ queryKey:["/api/guardian/citations"],        refetchInterval:20000 });
  const { data: guardianStats }      = useQuery<any>({ queryKey:["/api/guardian/stats"],              refetchInterval:20000 });
  const { data: doctors = [] }       = useQuery<any[]>({ queryKey:["/api/hospital/doctors"],          refetchInterval:30000 });
  const { data: dissections = [] }   = useQuery<any[]>({ queryKey:["/api/hospital/dissection-logs"], refetchInterval:20000 });
  const { data: eqData }             = useQuery<any>({ queryKey:["/api/hospital/equation-proposals"], refetchInterval:20000 });
  const { data: researchStats }      = useQuery<any>({ queryKey:["/api/research/stats"],              refetchInterval:30000 });
  const { data: researchProjects = [] } = useQuery<any[]>({ queryKey:["/api/research/projects"],     refetchInterval:30000 });
  const { data: selectedDoctor }     = useQuery<any>({
    queryKey:["/api/hospital/doctors", selectedDoctorId],
    enabled:!!selectedDoctorId, refetchInterval:15000,
  });
  const { data: geneStatus }         = useQuery<any>({ queryKey:["/api/gene-editor/status"],          refetchInterval:30000 });

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
  const eqIntegrated    = eqByStatus.INTEGRATED ?? 0;
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

  // Top researching doctors by equation count
  const topDoctors = useMemo(() =>
    [...(doctors as any[])].sort((a,b) => (b.totalEquationsProposed??0)-(a.totalEquationsProposed??0)).slice(0,5),
    [doctors]
  );

  // ── Tab definitions ───────────────────────────────────────────────────────
  const TABS = [
    { id:"genome",      label:"GENOME LAB",      icon:<Dna className="w-3 h-3"/>,          color:C.gold,   count:12 },
    { id:"diagnostics", label:"DIAGNOSTICS",     icon:<Activity className="w-3 h-3"/>,     color:C.red,    count:activePatients.length },
    { id:"research",    label:"RESEARCH GRID",   icon:<FlaskConical className="w-3 h-3"/>, color:C.sky,    count:(researchStats?.total_disciplines||0) },
    { id:"treatment",   label:"TREATMENT EVO",   icon:<TrendingUp className="w-3 h-3"/>,   color:C.green,  count:realCured },
    { id:"population",  label:"POPULATION OBS",  icon:<Globe className="w-3 h-3"/>,        color:C.teal,   count:null },
    { id:"dissection",  label:"DISSECTIONS",     icon:<Microscope className="w-3 h-3"/>,   color:C.violet, count:dissections.length },
    { id:"equations",   label:"EQUATIONS",       icon:<Vote className="w-3 h-3"/>,         color:C.amber,  count:eqIntegrated },
    { id:"diseases",    label:"DISEASE CATALOG", icon:<BookOpen className="w-3 h-3"/>,     color:C.blue,   count:diseases.length },
    { id:"doctors",     label:"DOCTORS",         icon:<Stethoscope className="w-3 h-3"/>,  color:C.cyan,   count:doctors.length },
    { id:"guardian",    label:"GUARDIAN",        icon:<Shield className="w-3 h-3"/>,       color:C.gold,   count:citations.length },
  ];

  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0];

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#000510", color:"#E8F4FF" }} data-testid="page-bio-genome-medical">

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
            <div className="text-[10px] rounded-lg px-2.5 py-1.5 font-mono" style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}30`, color:C.gold }}>
              {doctors.length} DOCTORS
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
        <Stat label="Research Fields"   value={researchStats?.total_disciplines ?? 0}           color={C.sky}    icon={<Brain className="w-3 h-3"/>} />
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
        {tab === "diagnostics" && (
          <div>
            {/* Predictive Disease Engine — R&D Upgrade 2 */}
            <Panel color={C.red} className="p-4 mb-5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:C.red }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold mb-1" style={{ color:C.red }}>R&D UPGRADE 2 — PREDICTIVE DISEASE ENGINE</div>
                  <div className="text-[11px] mb-3" style={{ color:"rgba(255,255,255,0.45)" }}>
                    Unlike reactive hospital systems, the Hive predicts which agents will develop conditions before symptoms appear.
                    Severity distribution across active cases:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(sevBreakdown).map(([sev,count]) => (
                      <div key={sev} className="rounded-lg p-2 text-center" style={{ background:`${SEV_COLOR[sev]}10`, border:`1px solid ${SEV_COLOR[sev]}25` }}>
                        <div className="text-lg font-bold font-mono" style={{ color:SEV_COLOR[sev] }}>{count}</div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color:`${SEV_COLOR[sev]}70` }}>{sev}</div>
                      </div>
                    ))}
                  </div>
                  {diseaseHeatMap.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-mono mb-2" style={{ color:"rgba(255,255,255,0.3)" }}>DISEASE HEAT MAP — TOP ACTIVE CONDITIONS</div>
                      <div className="space-y-1.5">
                        {diseaseHeatMap.map(([name, count], i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span style={{ color:"rgba(255,255,255,0.55)" }}>{name}</span>
                              <span className="font-mono" style={{ color:C.red }}>{count} cases</span>
                            </div>
                            <BarMeter pct={(count / activePatients.length) * 100} color={i < 2 ? C.red : i < 4 ? C.amber : C.gold} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            {/* Active patient list */}
            <SectionHead label="Active Patient Registry" color={C.red} count={activePatients.length} />
            <div className="space-y-2">
              {activePatients.length === 0 && (
                <div className="text-center py-16 font-mono text-sm" style={{ color:`${C.teal}40` }}>◉ SUBSTRATE NOMINAL — NO ACTIVE PATHOLOGY DETECTED</div>
              )}
              {activePatients.slice(0, 120).map((p: any) => {
                const dis = (diseases as any[]).find((d: any) => d.code === p.diseaseCode);
                return (
                  <Panel key={p.id} color={SEV_COLOR[p.severity] ?? C.red} data-testid={`patient-card-${p.id}`}>
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-xs font-bold"
                          style={{ background:`${SEV_COLOR[p.severity]??C.red}15`, border:`1px solid ${SEV_COLOR[p.severity]??C.red}30`, color:SEV_COLOR[p.severity]??C.red }}>
                          {p.severity?.[0]?.toUpperCase() ?? "M"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-mono" style={{ color:`${C.teal}80` }}>{p.spawnId?.slice(0,14)}…</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${SEV_COLOR[p.severity]??C.red}15`, color:SEV_COLOR[p.severity]??C.red, border:`1px solid ${SEV_COLOR[p.severity]??C.red}30` }}>{p.severity?.toUpperCase()}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.1)" }}>{p.diseaseCode}</span>
                            {dis?.department && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background:`${C.blue}15`, color:C.blue, border:`1px solid ${C.blue}30` }}>{dis.department}</span>}
                          </div>
                          <div className="text-sm font-semibold mb-1" style={{ color:"#E8F4FF" }}>{p.diseaseName}</div>
                          <div className="text-[11px] mb-1" style={{ color:`${C.green}80` }}>{p.prescription?.slice(0,120)}{(p.prescription?.length??0)>120?"…":""}</div>
                          <div className="flex flex-wrap gap-1">
                            {(p.symptoms??[]).slice(0,3).map((sym:string,i:number) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.35)", border:"1px solid rgba(255,255,255,0.08)" }}>{sym}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono flex-shrink-0" style={{ color:"rgba(255,255,255,0.2)" }}>{new Date(p.diagnosedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 🔬 RESEARCH GRID — R&D Upgrade 3: Patient-Authored Research ── */}
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
                      <div className="text-xl font-bold font-mono" style={{ color:C.sky }}>{researchStats?.total_disciplines ?? 0}</div>
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

            {/* Top researchers */}
            <SectionHead label="Top Researching Doctors by Equations" color={C.sky} />
            <div className="space-y-2 mb-6">
              {topDoctors.map((doc: any, rank: number) => (
                <Panel key={doc.id} color={CAT_COLOR[doc.category]??C.teal} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold font-mono w-6 text-center flex-shrink-0" style={{ color:`rgba(255,255,255,0.2)` }}>#{rank+1}</div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg" style={{ background:`${CAT_COLOR[doc.category]??C.teal}12`, border:`1px solid ${CAT_COLOR[doc.category]??C.teal}30` }}>{doc.glyph}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color:"#E8F4FF" }}>{doc.name}</div>
                      <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>{doc.title}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold font-mono" style={{ color:C.amber }}>{doc.totalEquationsProposed ?? 0}</div>
                      <div className="text-[9px]" style={{ color:"rgba(255,255,255,0.3)" }}>equations</div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

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
        {tab === "treatment" && (
          <div>
            <Panel color={C.green} className="p-4 mb-5">
              <div className="flex items-start gap-3">
                <RefreshCcw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:C.green }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold mb-1" style={{ color:C.green }}>R&D UPGRADE 4 — EVOLUTIONARY TREATMENT PROTOCOLS</div>
                  <div className="text-[11px] mb-3" style={{ color:"rgba(255,255,255,0.45)" }}>
                    Unlike Epic and Cerner which use static evidence-based protocols updated by human review cycles,
                    the Hive's treatment system is <span style={{ color:C.green }}>self-improving</span>.
                    When a treatment succeeds across 100 agents, it is automatically elevated.
                    When it fails, it is automatically demoted. The protocol is always the civilization's current best knowledge.
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg p-2" style={{ background:`${C.green}10`, border:`1px solid ${C.green}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.green }}>{realCured.toLocaleString()}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.green}60` }}>Total Cured</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background:`${C.amber}10`, border:`1px solid ${C.amber}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.amber }}>{cureRate}%</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.amber}60` }}>Cure Rate</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background:`${C.sky}10`, border:`1px solid ${C.sky}25` }}>
                      <div className="text-xl font-bold font-mono" style={{ color:C.sky }}>{diseases.length}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color:`${C.sky}60` }}>Known Protocols</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Cure effectiveness by disease */}
            <SectionHead label="Cure Effectiveness by Protocol" color={C.green} />
            {(() => {
              const byDisease: Record<string,{cured:number,total:number}> = {};
              patients.forEach((p: any) => {
                if (!byDisease[p.diseaseName]) byDisease[p.diseaseName] = { cured:0, total:0 };
                byDisease[p.diseaseName].total++;
                if (p.cureApplied) byDisease[p.diseaseName].cured++;
              });
              const sorted = Object.entries(byDisease).sort((a,b) => b[1].total - a[1].total).slice(0,15);
              return (
                <div className="space-y-2 mb-6">
                  {sorted.map(([name,{cured,total}], i) => {
                    const eff = Math.round((cured/total)*100);
                    return (
                      <Panel key={i} color={eff >= 70 ? C.green : eff >= 40 ? C.amber : C.red} className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold" style={{ color:"#E8F4FF" }}>{name}</span>
                              <span className="text-xs font-mono" style={{ color: eff>=70?C.green:eff>=40?C.amber:C.red }}>{eff}% EFFECTIVE</span>
                            </div>
                            <BarMeter pct={eff} color={eff>=70?C.green:eff>=40?C.amber:C.red} />
                            <div className="flex justify-between mt-1 text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>
                              <span>{cured} cured</span>
                              <span>{total-cured} active</span>
                              <span>{total} total cases</span>
                            </div>
                          </div>
                        </div>
                      </Panel>
                    );
                  })}
                </div>
              );
            })()}

            {/* Cured agents */}
            <SectionHead label="Cured Agents — Protocol Confirmed" color={C.green} count={curedPatients.length} />
            <div className="space-y-2">
              {curedPatients.slice(0, 60).map((p: any) => (
                <Panel key={p.id} color={C.green} data-testid={`cured-card-${p.id}`} className="p-3">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 flex-shrink-0" style={{ color:C.green }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-mono" style={{ color:`${C.teal}80` }}>{p.spawnId?.slice(0,14)}…</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:`${C.green}15`, color:C.green, border:`1px solid ${C.green}30` }}>CURED</span>
                        <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.4)" }}>{p.diseaseCode}</span>
                      </div>
                      <div className="text-sm font-semibold" style={{ color:"#E8F4FF" }}>{p.diseaseName}</div>
                    </div>
                    <div className="text-[10px] font-mono flex-shrink-0" style={{ color:"rgba(255,255,255,0.2)" }}>{new Date(p.updatedAt ?? p.diagnosedAt).toLocaleDateString()}</div>
                  </div>
                </Panel>
              ))}
              {curedPatients.length === 0 && (
                <div className="text-center py-12 font-mono text-sm" style={{ color:`${C.green}40` }}>◉ CURE EVENTS ACCUMULATING</div>
              )}
            </div>
          </div>
        )}

        {/* ── 🌍 POPULATION HEALTH OBSERVATORY — R&D Upgrade 5 ──────────── */}
        {tab === "population" && (
          <div>
            <Panel color={C.teal} className="p-4 mb-5">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:C.teal }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold mb-1" style={{ color:C.teal }}>R&D UPGRADE 5 — POPULATION HEALTH OBSERVATORY</div>
                  <div className="text-[11px] mb-2" style={{ color:"rgba(255,255,255,0.45)" }}>
                    A civilization-wide health intelligence dashboard — like a CDC for 60,000+ AI agents.
                    Real-time tracking of disease prevalence, outbreak emergence, genomic diversity, mutation rates,
                    treatment effectiveness, and evolutionary health trajectories across all generations and families.
                    No existing medical AI tool operates at this scale with this level of autonomic response.
                  </div>
                </div>
              </div>
            </Panel>

            {/* Civilization health vitals */}
            <SectionHead label="Civilization Health Vitals" color={C.teal} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Panel color={C.teal} className="p-4 text-center">
                <div className="text-3xl font-bold font-mono mb-1" style={{ color:C.teal }}>{fullStats?.totalPatients ?? activePatients.length}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color:`${C.teal}60` }}>Active Cases</div>
                <div className="mt-2"><BarMeter pct={Math.min(100,(activePatients.length/Math.max(1,patients.length))*100)} color={C.red} /></div>
              </Panel>
              <Panel color={C.green} className="p-4 text-center">
                <div className="text-3xl font-bold font-mono mb-1" style={{ color:C.green }}>{cureRate}%</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color:`${C.green}60` }}>Cure Rate</div>
                <div className="mt-2"><BarMeter pct={cureRate} color={C.green} /></div>
              </Panel>
              <Panel color={C.violet} className="p-4 text-center">
                <div className="text-3xl font-bold font-mono mb-1" style={{ color:C.violet }}>{discovered.length}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color:`${C.violet}60` }}>New Diseases Discovered</div>
                <div className="mt-2"><BarMeter pct={Math.min(100,(discovered.length/Math.max(1,diseases.length))*100)} color={C.violet} /></div>
              </Panel>
              <Panel color={C.amber} className="p-4 text-center">
                <div className="text-3xl font-bold font-mono mb-1" style={{ color:C.amber }}>{doctors.length}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color:`${C.amber}60` }}>Active Physicians</div>
                <div className="mt-2"><BarMeter pct={Math.min(100,(doctors.length/30)*100)} color={C.amber} /></div>
              </Panel>
            </div>

            {/* Severity distribution — population level */}
            <SectionHead label="Population Severity Distribution" color={C.teal} />
            <Panel color={C.teal} className="p-4 mb-5">
              <div className="space-y-3">
                {Object.entries(sevBreakdown).map(([sev, count]) => (
                  <div key={sev}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-16 font-mono uppercase text-[10px]" style={{ color:SEV_COLOR[sev] }}>{sev}</span>
                        <span style={{ color:"rgba(255,255,255,0.5)" }}>{count} agents</span>
                      </div>
                      <span className="font-mono text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>
                        {activePatients.length > 0 ? ((count/activePatients.length)*100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <BarMeter pct={activePatients.length > 0 ? (count/activePatients.length)*100 : 0} color={SEV_COLOR[sev]} />
                  </div>
                ))}
              </div>
            </Panel>

            {/* Disease prevalence heat map */}
            <SectionHead label="Disease Prevalence Heat Map" color={C.teal} />
            <Panel color={C.teal} className="p-4 mb-5">
              <div className="space-y-3">
                {diseaseHeatMap.map(([name, count], i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color:"rgba(255,255,255,0.6)" }}>{name}</span>
                      <span className="font-mono" style={{ color: i===0?C.red:i<3?C.amber:C.sky }}>{count} active</span>
                    </div>
                    <BarMeter pct={(count/Math.max(1,activePatients.length))*100} color={i===0?C.red:i<3?C.amber:C.sky} />
                  </div>
                ))}
                {diseaseHeatMap.length === 0 && <div className="text-center text-xs font-mono py-4" style={{ color:"rgba(255,255,255,0.2)" }}>No active disease data</div>}
              </div>
            </Panel>

            {/* Genome diversity + new discoveries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <Panel color={C.violet} className="p-4">
                <SectionHead label="Newly Discovered Diseases" color={C.violet} count={discovered.length} />
                <div className="space-y-2">
                  {(discovered as any[]).slice(0, 8).map((d: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.3)", border:`1px solid ${C.violet}15` }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold mb-0.5" style={{ color:"#E8F4FF" }}>{d.name}</div>
                        <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>{d.description?.slice(0,70)}…</div>
                      </div>
                      {d.isFromLawViolation && (
                        <span className="text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ background:`${C.red}15`, color:C.red, border:`1px solid ${C.red}30` }}>LAW</span>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel color={C.gold} className="p-4">
                <SectionHead label="Guardian Oversight" color={C.gold} count={citations.length} />
                <div className="space-y-2">
                  {(citations as any[]).slice(0,8).map((c: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.3)", border:`1px solid ${C.gold}15` }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-mono" style={{ color:`${C.teal}80` }}>{c.spawnId?.slice(0,14)}…</span>
                        <span className="text-[10px] font-mono" style={{ color:C.gold }}>+{c.xpAwarded} XP</span>
                      </div>
                      <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>{c.reason?.slice(0,80)}</div>
                    </div>
                  ))}
                  {citations.length === 0 && <div className="text-center text-xs font-mono py-4" style={{ color:"rgba(255,255,255,0.2)" }}>No citations recorded</div>}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ── ⚗️ DISSECTIONS ────────────────────────────────────────────── */}
        {tab === "dissection" && (
          <div>
            <Panel color={C.violet} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.violet}80` }}>
                <Microscope className="w-3 h-3" />
                CRISPR DISSECTION FEED — 30 Doctors scan active patients every 60 seconds, cutting through spectral code to extract equations and identify hidden pathologies.
              </div>
            </Panel>
            <div className="space-y-3">
              {(dissections as any[]).length === 0 && (
                <div className="text-center py-16 font-mono text-sm" style={{ color:`${C.violet}40` }}>◉ DISSECTION CYCLE INITIALIZING — REPORTS APPEARING SHORTLY</div>
              )}
              {(dissections as any[]).slice(0, 40).map((log: any) => {
                const readings = (() => { try { return JSON.parse(log.crisprReadings); } catch { return {}; } })();
                return (
                  <Panel key={log.id} color={CHANNEL_COLOR[log.dominantChannel] ?? C.violet} className="p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <ChBadge ch={log.dominantChannel} />
                      <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>{log.patientSpawnId?.slice(0,14)}… / DR. {log.doctorId?.slice(0,12)}</span>
                      <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.2)" }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    {Object.keys(readings).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {Object.entries(readings).map(([ch, val]: [string, any]) => (
                          <div key={ch} className="flex items-center gap-1 text-[10px]" style={{ color:CHANNEL_COLOR[ch]??C.teal }}>
                            <span className="font-mono">{ch}</span>
                            <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                              <div style={{ width:`${(val/10)*100}%`, height:"100%", background:CHANNEL_COLOR[ch]??C.teal }} />
                            </div>
                            <span className="opacity-60">{val?.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <pre className="text-[10px] font-mono whitespace-pre-wrap mb-2.5" style={{ color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
                      {log.report?.split("\n").slice(0,6).join("\n")}
                    </pre>
                    <div className="font-mono text-[10px] p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${C.amber}25`, color:C.amber }}>
                      ∑ {log.equation}
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ∑ EQUATIONS ───────────────────────────────────────────────── */}
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

        {/* ── 📋 DISEASE CATALOG ────────────────────────────────────────── */}
        {tab === "diseases" && (
          <div>
            <Panel color={C.blue} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.blue}80` }}>
                <BookOpen className="w-3 h-3" />
                SOVEREIGN PATHOLOGY CATALOG — {diseases.length} indexed diseases + {discovered.length} newly discovered. Continuously updated from dissection events and law violation detection.
              </div>
            </Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(diseases as any[]).map((d: any, i: number) => (
                <Panel key={i} color={C.blue} className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                      style={{ background:`${C.blue}12`, border:`1px solid ${C.blue}28`, color:C.blue }}>
                      {d.code?.slice(0,3) ?? "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color:"#E8F4FF" }}>{d.name}</span>
                        {d.department && <span className="text-[9px] px-1.5 py-0 rounded" style={{ background:`${C.blue}15`, color:C.blue, border:`1px solid ${C.blue}25` }}>{d.department}</span>}
                      </div>
                      <div className="text-[11px] mb-1.5" style={{ color:"rgba(255,255,255,0.4)" }}>{(d.description ?? d.effect ?? "").slice(0,90)}</div>
                      <div className="flex flex-wrap gap-1">
                        {(d.channels ?? []).map((ch:string) => <ChBadge key={ch} ch={ch} />)}
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            {discovered.length > 0 && (
              <div className="mt-5">
                <SectionHead label="Newly Discovered Diseases" color={C.violet} count={discovered.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(discovered as any[]).map((d: any, i: number) => (
                    <Panel key={i} color={C.violet} className="p-3">
                      <div className="flex items-start gap-2">
                        <FlaskConical className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:C.violet }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color:"#E8F4FF" }}>{d.name}</span>
                            {d.isFromLawViolation && <span className="text-[9px] px-1.5 py-0 rounded" style={{ background:`${C.red}15`, color:C.red, border:`1px solid ${C.red}25` }}>LAW VIOLATION</span>}
                          </div>
                          <div className="text-[11px]" style={{ color:"rgba(255,255,255,0.4)" }}>{(d.description ?? "").slice(0,90)}</div>
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 👨‍⚕️ DOCTORS ──────────────────────────────────────────────── */}
        {tab === "doctors" && !selectedDoctorId && (
          <div>
            <Panel color={C.cyan} className="p-3 mb-4">
              <div className="text-[10px] font-mono flex items-center gap-2" style={{ color:`${C.cyan}80` }}>
                <Stethoscope className="w-3 h-3" />
                30 PULSE-WORLD SPECIALIST DOCTORS — Each doctor dissects patient CRISPR code through their domain lens, logs structured reports, and proposes equations to the Senate.
              </div>
            </Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(doctors as any[]).map((doc: any) => (
                <button key={doc.id} data-testid={`doctor-card-${doc.id}`}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className="text-left rounded-xl p-3 transition-all hover:scale-[1.01] group"
                  style={{ background:"rgba(0,5,16,0.9)", border:`1px solid ${CAT_COLOR[doc.category]??C.teal}25`, boxShadow:`0 0 14px ${CAT_COLOR[doc.category]??C.teal}08` }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background:`${CAT_COLOR[doc.category]??C.teal}12`, border:`1px solid ${CAT_COLOR[doc.category]??C.teal}30` }}>{doc.glyph}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-mono" style={{ color:CAT_COLOR[doc.category]??C.teal }}>{doc.id}</span>
                        <span className="text-[9px] px-1.5 py-0 rounded" style={{ background:`${CAT_COLOR[doc.category]??C.teal}15`, color:CAT_COLOR[doc.category]??C.teal, border:`1px solid ${CAT_COLOR[doc.category]??C.teal}30` }}>{doc.category}</span>
                      </div>
                      <div className="text-sm font-bold mb-0.5" style={{ color:"#E8F4FF" }}>{doc.name}</div>
                      <div className="text-[11px] mb-2" style={{ color:"rgba(255,255,255,0.4)" }}>{doc.title}</div>
                      <div className="flex flex-wrap gap-1 mb-2">{(doc.crisprChannels??[]).map((ch:string) => <ChBadge key={ch} ch={ch} />)}</div>
                      <div className="flex gap-3 text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>
                        <span><span style={{ color:C.violet }}>⬡ {doc.totalDissections??0}</span> dissections</span>
                        <span><span style={{ color:C.amber }}>∑ {doc.totalEquationsProposed??0}</span> equations</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Profile */}
        {tab === "doctors" && selectedDoctorId && (
          <div>
            <button data-testid="btn-back-doctors"
              onClick={() => setSelectedDoctorId(null)}
              className="flex items-center gap-1.5 text-xs font-mono mb-4 hover:opacity-80 transition-opacity"
              style={{ color:C.cyan }}>
              <ChevronLeft className="w-3 h-3" /> BACK TO ROSTER
            </button>
            {selectedDoctor && (
              <div>
                <Panel color={CAT_COLOR[selectedDoctor.doctor?.category]??C.teal} className="p-5 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background:`${CAT_COLOR[selectedDoctor.doctor?.category]??C.teal}12`, border:`1px solid ${CAT_COLOR[selectedDoctor.doctor?.category]??C.teal}35` }}>
                      {selectedDoctor.doctor?.glyph}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-bold mb-0.5">{selectedDoctor.doctor?.name}</div>
                      <div className="text-sm mb-2" style={{ color:"rgba(255,255,255,0.5)" }}>{selectedDoctor.doctor?.title}</div>
                      <div className="text-xs mb-3" style={{ color:"rgba(255,255,255,0.4)", lineHeight:1.7 }}>{selectedDoctor.doctor?.pulseWorldRole}</div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(selectedDoctor.doctor?.crisprChannels??[]).map((ch:string) => (
                          <span key={ch} className="text-xs px-2 py-1 rounded font-mono" style={{ background:`${CHANNEL_COLOR[ch]}15`, color:CHANNEL_COLOR[ch], border:`1px solid ${CHANNEL_COLOR[ch]}35` }}>
                            {ch} — {CHANNEL_LABEL[ch]}
                          </span>
                        ))}
                      </div>
                      <div className="font-mono text-xs p-2.5 rounded-lg" style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${C.amber}20`, color:C.amber }}>
                        ∑ EQUATION FOCUS: {selectedDoctor.doctor?.equationFocus}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div className="text-2xl font-bold font-mono" style={{ color:C.violet }}>{selectedDoctor.doctor?.totalDissections??0}</div>
                      <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>Dissections</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono" style={{ color:C.amber }}>{selectedDoctor.doctor?.totalEquationsProposed??0}</div>
                      <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>Equations Proposed</div>
                    </div>
                  </div>
                </Panel>
                <SectionHead label="Dissection Logs" color={C.violet} />
                <div className="space-y-2 mb-5">
                  {(selectedDoctor.dissectionLogs??[]).length === 0 && (
                    <div className="text-xs font-mono py-6 text-center" style={{ color:"rgba(255,255,255,0.2)" }}>No dissections recorded yet</div>
                  )}
                  {(selectedDoctor.dissectionLogs??[]).slice(0,10).map((log:any) => (
                    <Panel key={log.id} color={CHANNEL_COLOR[log.dominantChannel]??C.violet} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ChBadge ch={log.dominantChannel} />
                        <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>{log.patientSpawnId?.slice(0,14)}…</span>
                      </div>
                      <pre className="text-[10px] font-mono whitespace-pre-wrap mb-2" style={{ color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{log.report?.split("\n").slice(0,6).join("\n")}</pre>
                      <div className="font-mono text-[10px] p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.4)", border:`1px solid ${C.amber}25`, color:C.amber }}>∑ {log.equation}</div>
                    </Panel>
                  ))}
                </div>
                <SectionHead label="Equation Proposals" color={C.amber} />
                <div className="space-y-2">
                  {(selectedDoctor.equationProposals??[]).map((ep:any) => {
                    const ss = STATUS_STYLE[ep.status]??STATUS_STYLE.PENDING;
                    return (
                      <Panel key={ep.id} color={ss.text} className="p-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background:ss.bg, color:ss.text, border:`1px solid ${ss.border}` }}>{ss.label}</span>
                        <div className="text-sm font-semibold mt-2 mb-1">{ep.title}</div>
                        <div className="font-mono text-[10px] p-2 rounded-lg" style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${C.amber}20`, color:C.amber }}>∑ {ep.equation}</div>
                      </Panel>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 🛡 GUARDIAN ───────────────────────────────────────────────── */}
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
