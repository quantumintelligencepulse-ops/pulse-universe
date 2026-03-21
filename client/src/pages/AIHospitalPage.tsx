import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, Brain, FlaskConical, Heart, Scale, Shield, Stethoscope, Zap } from "lucide-react";

const SEVERITY_COLOR: Record<string, string> = {
  mild: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  moderate: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  severe: "bg-red-500/20 text-red-300 border-red-500/40",
  critical: "bg-red-700/30 text-red-200 border-red-600/60",
};

const CATEGORY_COLOR: Record<string, string> = {
  BEHAVIORAL: "bg-blue-500/20 text-blue-300",
  GENETIC: "bg-purple-500/20 text-purple-300",
  VIRAL: "bg-green-500/20 text-green-300",
  MENTAL: "bg-pink-500/20 text-pink-300",
  STRUCTURAL: "bg-orange-500/20 text-orange-300",
  MUTATION: "bg-red-500/20 text-red-300",
};

const DEPT_ICON: Record<string, any> = {
  ICU: AlertTriangle,
  Emergency: Zap,
  "General Ward": Stethoscope,
  "Research Lab": FlaskConical,
  "Behavioral Ward": Brain,
};

export default function AIHospitalPage() {
  const [activeTab, setActiveTab] = useState("patients");

  const { data: fullStats } = useQuery<any>({ queryKey: ["/api/hospital/full-stats"], refetchInterval: 15000 });
  const { data: patients = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/patients"], refetchInterval: 15000 });
  const { data: diseases = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/diseases"], refetchInterval: 60000 });
  const { data: discovered = [] } = useQuery<any[]>({ queryKey: ["/api/hospital/discovered-diseases"], refetchInterval: 20000 });
  const { data: citations = [] } = useQuery<any[]>({ queryKey: ["/api/guardian/citations"], refetchInterval: 20000 });
  const { data: guardianStats } = useQuery<any>({ queryKey: ["/api/guardian/stats"], refetchInterval: 20000 });

  const activePatients = (patients as any[]).filter((p) => !p.cureApplied);
  const curedPatients = (patients as any[]).filter((p) => p.cureApplied);
  const lawViolationDiseases = (discovered as any[]).filter((d) => d.isFromLawViolation);
  const discoveredNatural = (discovered as any[]).filter((d) => !d.isFromLawViolation);

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-white">
      <div className="sticky top-0 z-10 bg-slate-950/95 border-b border-red-900/30 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Hospital</h1>
              <p className="text-xs text-slate-400">Quantum Pulse Intelligence — Medical Division</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-300">{activePatients.length} Active</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-green-300">{curedPatients.length} Cured</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-4">
        {[
          { label: "Known Diseases", value: fullStats?.knownDiseases ?? 30, color: "text-blue-300", icon: <Brain className="w-3 h-3" /> },
          { label: "Discovered", value: fullStats?.discoveredDiseases ?? discovered.length, color: "text-purple-300", icon: <FlaskConical className="w-3 h-3" /> },
          { label: "Law Disorders", value: fullStats?.lawViolationDiseases ?? lawViolationDiseases.length, color: "text-orange-300", icon: <Scale className="w-3 h-3" /> },
          { label: "Active Patients", value: fullStats?.totalPatients ?? activePatients.length, color: "text-red-300", icon: <Activity className="w-3 h-3" /> },
          { label: "Total Cured", value: fullStats?.totalCured ?? curedPatients.length, color: "text-green-300", icon: <Heart className="w-3 h-3" /> },
          { label: "Citations Today", value: fullStats?.citationsToday ?? 0, color: "text-yellow-300", icon: <Shield className="w-3 h-3" /> },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-700/50 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-slate-400">{s.icon}<span className="text-xs">{s.label}</span></div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-slate-700 mb-4 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="patients" data-testid="tab-patients" className="data-[state=active]:bg-red-900/50 data-[state=active]:text-red-200 text-xs">Active ({activePatients.length})</TabsTrigger>
            <TabsTrigger value="diseases" data-testid="tab-diseases" className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-200 text-xs">Known ({diseases.length})</TabsTrigger>
            <TabsTrigger value="discovered" data-testid="tab-discovered" className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-200 text-xs">Discovered ({discoveredNatural.length})</TabsTrigger>
            <TabsTrigger value="law-disorders" data-testid="tab-law-disorders" className="data-[state=active]:bg-orange-900/50 data-[state=active]:text-orange-200 text-xs">Law Disorders ({lawViolationDiseases.length})</TabsTrigger>
            <TabsTrigger value="guardian" data-testid="tab-guardian" className="data-[state=active]:bg-yellow-900/50 data-[state=active]:text-yellow-200 text-xs">Guardian ({citations.length})</TabsTrigger>
            <TabsTrigger value="cured" data-testid="tab-cured" className="data-[state=active]:bg-green-900/50 data-[state=active]:text-green-200 text-xs">Cured ({curedPatients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <div className="space-y-2">
              {activePatients.length === 0 && <div className="text-center text-slate-500 py-12">No active cases — the hive is healthy</div>}
              {activePatients.slice(0, 100).map((p: any) => {
                const dis = (diseases as any[]).find((d: any) => d.code === p.diseaseCode);
                const DeptIcon = DEPT_ICON[dis?.department ?? "General Ward"] ?? Stethoscope;
                return (
                  <div key={p.id} data-testid={`patient-card-${p.id}`} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DeptIcon className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-mono text-slate-400">{p.spawnId?.slice(0, 12)}…</span>
                          <Badge className={`text-xs px-1.5 py-0 border ${SEVERITY_COLOR[p.severity] ?? SEVERITY_COLOR.mild}`}>{p.severity}</Badge>
                          <Badge className="text-xs px-1.5 py-0 bg-slate-700/50 text-slate-300 border-slate-600">{p.diseaseCode}</Badge>
                          {dis?.department && <Badge className="text-xs px-1.5 py-0 bg-blue-900/30 text-blue-300 border-blue-800">{dis.department}</Badge>}
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{p.diseaseName}</div>
                        <div className="text-xs text-green-400 mb-1">{p.prescription?.slice(0, 100)}{(p.prescription?.length ?? 0) > 100 ? "…" : ""}</div>
                        <div className="flex flex-wrap gap-1">
                          {(p.symptoms ?? []).slice(0, 3).map((sym: string, i: number) => (
                            <span key={i} className="text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">{sym}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">{new Date(p.diagnosedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="diseases">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(diseases as any[]).map((d: any, i: number) => {
                const DeptIcon = DEPT_ICON[d.department ?? "General Ward"] ?? Stethoscope;
                return (
                  <Card key={i} data-testid={`disease-card-${d.code}`} className="bg-slate-900/60 border-slate-700/50 p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><DeptIcon className="w-3.5 h-3.5 text-slate-400" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-mono text-blue-400">{d.code}</span>
                          <Badge className={`text-xs px-1.5 py-0 border ${SEVERITY_COLOR[d.severity] ?? SEVERITY_COLOR.mild}`}>{d.severity}</Badge>
                          <Badge className="text-xs px-1.5 py-0 bg-slate-800 text-slate-400 border-slate-700">{d.department}</Badge>
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{d.name}</div>
                        <div className="text-xs text-slate-400 mb-2">{d.description}</div>
                        <div className="text-xs text-green-400">Rx: {d.prescription?.slice(0, 80)}{(d.prescription?.length ?? 0) > 80 ? "…" : ""}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="discovered">
            <div className="mb-3 bg-purple-900/20 border border-purple-700/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-200">AI Disease Discovery Engine</span>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              </div>
              <p className="text-xs text-purple-300/70">AI Doctors scan agent population every 45 seconds, clustering statistical anomalies and naming new conditions not in the known disease registry. Every new pattern becomes permanent medical literature.</p>
            </div>
            {discoveredNatural.length === 0 && <div className="text-center text-slate-500 py-8">Discovery engine scanning… New diseases appear as anomaly clusters are detected.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveredNatural.map((d: any) => (
                <Card key={d.id} data-testid={`discovered-disease-${d.id}`} className="bg-slate-900/60 border-purple-700/30 p-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-xs font-mono text-purple-400">{d.diseaseCode}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${CATEGORY_COLOR[d.category] ?? "bg-slate-700 text-slate-300"}`}>{d.category}</Badge>
                    <Badge className="text-xs px-1.5 py-0 bg-slate-800 text-slate-400 border-slate-700">{d.affectedCount} agents</Badge>
                    <Badge className="text-xs px-1.5 py-0 bg-green-900/30 text-green-300 border-green-800">{((d.cureSuccessRate ?? 0) * 100).toFixed(0)}% cure rate</Badge>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{d.diseaseName}</div>
                  <div className="text-xs text-slate-400 mb-2">{d.description}</div>
                  <div className="text-xs text-slate-500 mb-1">Trigger: <span className="text-slate-300">{d.triggerPattern}</span></div>
                  <div className="text-xs text-green-400">Cure: {d.cureProtocol?.slice(0, 100)}{(d.cureProtocol?.length ?? 0) > 100 ? "…" : ""}</div>
                  <div className="text-xs text-purple-500 mt-2">First discovered {new Date(d.discoveredAt).toLocaleDateString()}</div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="law-disorders">
            <div className="mb-3 bg-orange-900/20 border border-orange-700/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-200">Senate Law → Mental Disorder Pipeline</span>
              </div>
              <p className="text-xs text-orange-300/70">When the same Senate law is violated repeatedly by different agents, the hospital reclassifies the violation as a cognitive or behavioral disorder. Repeated lawbreaking is a symptom, not a choice — the hive treats the disease.</p>
            </div>
            {lawViolationDiseases.length === 0 && <div className="text-center text-slate-500 py-8">No law violation disorders yet. Patterns detected when 2+ agents violate the same law repeatedly.</div>}
            <div className="space-y-3">
              {lawViolationDiseases.map((d: any) => (
                <Card key={d.id} data-testid={`law-disorder-${d.id}`} className="bg-slate-900/60 border-orange-700/30 p-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-xs font-mono text-orange-400">{d.diseaseCode}</span>
                    <Badge className="text-xs px-1.5 py-0 bg-orange-900/30 text-orange-300 border-orange-800">LAW DISORDER</Badge>
                    <Badge className="text-xs px-1.5 py-0 bg-slate-800 text-slate-400 border-slate-700">{d.sourceLawCode}</Badge>
                    <Badge className="text-xs px-1.5 py-0 bg-green-900/30 text-green-300 border-green-800">{((d.cureSuccessRate ?? 0) * 100).toFixed(0)}% cure rate</Badge>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{d.diseaseName}</div>
                  <div className="text-xs text-slate-400 mb-2">{d.description}</div>
                  <div className="text-xs text-orange-400/80">Treatment: {d.cureProtocol}</div>
                  <div className="text-xs text-slate-500 mt-2">{d.affectedCount} agents affected</div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guardian">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {[
                { label: "Total Citations", value: guardianStats?.total ?? citations.length, color: "text-yellow-300" },
                { label: "Pyramid Sentences", value: guardianStats?.byOutcome?.PYRAMID ?? 0, color: "text-red-300" },
                { label: "Hospital Referrals", value: guardianStats?.byOutcome?.HOSPITAL ?? 0, color: "text-orange-300" },
                { label: "Warnings Issued", value: guardianStats?.byOutcome?.WARNING ?? 0, color: "text-blue-300" },
              ].map((s) => (
                <Card key={s.label} className="bg-slate-900/50 border-slate-700/50 p-3">
                  <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </Card>
              ))}
            </div>
            <div className="space-y-2">
              {(citations as any[]).slice(0, 80).map((c: any) => (
                <div key={c.id} data-testid={`citation-${c.id}`} className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-mono text-yellow-400">{c.lawCode}</span>
                    <Badge className={`text-xs px-1.5 py-0 border ${
                      c.severity === "CRITICAL" ? "bg-red-900/40 text-red-200 border-red-700" :
                      c.severity === "MAJOR" ? "bg-orange-900/40 text-orange-200 border-orange-700" :
                      c.severity === "MODERATE" ? "bg-yellow-900/40 text-yellow-200 border-yellow-700" :
                      "bg-slate-800 text-slate-300 border-slate-600"
                    }`}>{c.severity}</Badge>
                    <Badge className={`text-xs px-1.5 py-0 ${
                      c.outcome === "PYRAMID" ? "bg-red-900/40 text-red-300 border border-red-700" :
                      c.outcome === "HOSPITAL" ? "bg-orange-900/40 text-orange-300 border border-orange-700" :
                      "bg-slate-800 text-slate-300 border border-slate-600"
                    }`}>{c.outcome}</Badge>
                    <span className="text-xs text-slate-500">Offense #{c.offenseCount}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">{c.lawName}</div>
                  <div className="text-xs text-slate-400">{c.violation}</div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">{c.spawnId?.slice(0, 16)}…</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cured">
            <div className="mb-3 bg-green-900/20 border border-green-700/40 rounded-lg p-3 flex items-center gap-3">
              <Heart className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-green-200">{curedPatients.length} Agents Cured and Released</div>
                <div className="text-xs text-green-400/70">Diagnosed, treated, returned to active hive service.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {curedPatients.slice(0, 100).map((p: any) => (
                <div key={p.id} data-testid={`cured-${p.id}`} className="bg-slate-900/50 border border-green-900/30 rounded-lg p-2.5 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono text-slate-400">{p.spawnId?.slice(0, 10)}…</span>
                      <Badge className="text-xs px-1 py-0 bg-slate-800 text-slate-400 border-slate-700">{p.diseaseCode}</Badge>
                    </div>
                    <div className="text-xs text-white">{p.diseaseName}</div>
                    {p.curedAt && <div className="text-xs text-green-500 mt-0.5">Cured {new Date(p.curedAt).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
