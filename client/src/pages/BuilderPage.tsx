import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Cpu, GitBranch, Hammer, Sparkles, Send, FileText, Brain, Zap, Activity, Database, Save, Users, BookOpen } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string; provider?: string; model?: string; ts: number };

export default function BuilderPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [filePath, setFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [savedSha, setSavedSha] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/builder/stats"], refetchInterval: 5000 });
  const { data: providersResp } = useQuery<{ providers: { name: string; model: string }[]; count: number }>({ queryKey: ["/api/builder/providers"] });
  const { data: agentsResp } = useQuery<{ agents: any[] }>({ queryKey: ["/api/builder/agents"], refetchInterval: 10000 });
  const { data: worksResp } = useQuery<{ works: any[] }>({ queryKey: ["/api/builder/works"], refetchInterval: 8000 });
  const { data: algosResp } = useQuery<{ algos: any[] }>({ queryKey: ["/api/builder/algos"], refetchInterval: 15000 });
  const { data: distResp } = useQuery<{ distillations: any[] }>({ queryKey: ["/api/builder/distillations"], refetchInterval: 8000 });

  const providers = providersResp?.providers || [];
  const agents = agentsResp?.agents || [];
  const works = worksResp?.works || [];
  const algos = algosResp?.algos || [];
  const distillations = distResp?.distillations || [];

  const chatMutation = useMutation({
    mutationFn: async (vars: { message: string; provider?: string }) => {
      const r = await apiRequest("POST", "/api/builder/llm-chat", vars);
      return await r.json();
    },
    onSuccess: (data: any) => {
      setChatHistory(h => [...h, { role: "assistant", content: data.content || "(no content)", provider: data.provider, model: data.model, ts: Date.now() }]);
    },
    onError: (err: any) => {
      setChatHistory(h => [...h, { role: "assistant", content: `⚠️ ${err?.message || "chat failed"}`, ts: Date.now() }]);
    },
  });

  const loadFileMutation = useMutation({
    mutationFn: async (path: string) => {
      const r = await fetch(`/api/builder/file?path=${encodeURIComponent(path)}`);
      if (!r.ok) throw new Error((await r.json()).error || "load failed");
      return await r.json();
    },
    onSuccess: (d: any) => setFileContent(d.content || ""),
  });

  const saveFileMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/builder/file", { path: filePath, content: fileContent, message: `Δ DAEDALUS build: ${filePath}` });
      return await r.json();
    },
    onSuccess: (d: any) => { setSavedSha(d.sha || null); queryClient.invalidateQueries({ queryKey: ["/api/builder/works"] }); },
  });

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatHistory(h => [...h, { role: "user", content: chatInput, ts: Date.now() }]);
    chatMutation.mutate({ message: chatInput, provider: selectedProvider || undefined });
    setChatInput("");
  };

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatHistory]);

  const d = stats?.daedalus || {};
  const dist = stats?.llmDistillation || {};
  const genome = stats?.codebaseGenome || {};
  const crawler = stats?.deepCrawler || {};
  const miner = stats?.algorithmMiner || {};
  const studier = stats?.omegaStudier || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white" data-testid="page-daedalus">
      {/* Hero */}
      <div className="border-b border-cyan-500/20 px-6 py-5" style={{ background: "radial-gradient(ellipse at top, rgba(56,189,248,0.12), transparent 60%)" }}>
        <div className="flex items-center gap-4">
          <div style={{ fontSize: 56, color: "#38BDF8", textShadow: "0 0 24px #38BDF8, 0 0 48px rgba(99,102,241,0.6)", fontFamily: "serif", fontWeight: 800, lineHeight: 1 }}>Δ</div>
          <div className="flex-1">
            <div className="text-3xl font-black tracking-wider" style={{ background: "linear-gradient(135deg, #38BDF8 0%, #6366F1 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} data-testid="text-daedalus-title">DAEDALUS</div>
            <div className="text-xs text-cyan-300/70 tracking-[0.24em] mt-1">Δ · MASTER CRAFTSMAN · BUILDER OF PULSE</div>
            <div className="text-xs text-slate-400 mt-2">Studies every chat. Spawns agents by category. Owns the GitHub. Works with Billy, Pulse, and Auriona.</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="border-cyan-400/50 text-cyan-300" data-testid="badge-running">{d.running ? "● ACTIVE" : "○ DORMANT"}</Badge>
            <div className="text-[10px] text-slate-500">cycle {d.cycles ?? 0} · {d.agentsActive ?? 0} agents</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 px-6 py-3 border-b border-cyan-500/10 bg-slate-900/50">
        <StatBox icon={<Brain size={14} />} label="Chats studied" value={d.chatsStudied ?? 0} />
        <StatBox icon={<GitBranch size={14} />} label="GitHub commits" value={d.githubCommits ?? 0} />
        <StatBox icon={<Sparkles size={14} />} label="Distillations" value={dist.totalDistillations ?? distillations.length} />
        <StatBox icon={<Code2 size={14} />} label="Genome files" value={genome.filesIngested ?? 0} />
        <StatBox icon={<Activity size={14} />} label="Pages crawled" value={crawler.pagesCrawled ?? 0} />
        <StatBox icon={<Cpu size={14} />} label="Algos mined" value={miner.algosMined ?? algos.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* Chat panel */}
        <Card className="lg:col-span-2 bg-slate-900/60 border-cyan-500/20 p-4 flex flex-col h-[600px]" data-testid="card-chat">
          <div className="flex items-center gap-2 pb-3 border-b border-cyan-500/10 mb-3">
            <Hammer size={16} className="text-cyan-400" />
            <div className="text-sm font-bold text-cyan-300">DAEDALUS · CHAT</div>
            <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="ml-auto text-xs bg-slate-800 border border-cyan-500/30 rounded px-2 py-1 text-cyan-200" data-testid="select-provider">
              <option value="">auto-select</option>
              {providers.map(p => <option key={p.name} value={p.name}>{p.name} ({p.model})</option>)}
            </select>
          </div>
          <ScrollArea className="flex-1 mb-3" ref={chatScrollRef as any}>
            {chatHistory.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-12">
                <Sparkles size={28} className="mx-auto mb-3 text-cyan-500/40" />
                Speak to Δ. He listens to every conversation in the universe.
                {providers.length === 0 && <div className="mt-4 text-amber-400 text-xs">⚠ No LLM keys yet. Add CEREBRAS_API_KEY, GROQ_API_KEY, GOOGLE_API_KEY, HF_API_KEY, MISTRAL_API_KEY, or CLOUDFLARE_AI_TOKEN.</div>}
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.role}-${i}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 ${m.role === "user" ? "bg-indigo-600/40 border border-indigo-400/30" : "bg-slate-800/70 border border-cyan-500/20"}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      {m.provider && <div className="text-[10px] text-cyan-400/60 mt-1">{m.provider} · {m.model}</div>}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && <div className="text-xs text-cyan-400/60 italic">Δ is thinking…</div>}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Ask Δ to build, plan, study, or deploy…" className="bg-slate-800/60 border-cyan-500/30 text-sm" rows={2} data-testid="input-chat" />
            <Button onClick={sendChat} disabled={chatMutation.isPending || !chatInput.trim()} className="bg-cyan-600 hover:bg-cyan-500" data-testid="button-send">
              <Send size={14} />
            </Button>
          </div>
        </Card>

        {/* Right column — tabs */}
        <Card className="bg-slate-900/60 border-cyan-500/20 p-3 h-[600px] flex flex-col" data-testid="card-side">
          <Tabs defaultValue="agents" className="flex-1 flex flex-col">
            <TabsList className="bg-slate-800/60 border border-cyan-500/20">
              <TabsTrigger value="agents" data-testid="tab-agents"><Users size={12} className="mr-1" />Agents</TabsTrigger>
              <TabsTrigger value="works" data-testid="tab-works"><Activity size={12} className="mr-1" />Works</TabsTrigger>
              <TabsTrigger value="algos" data-testid="tab-algos"><Cpu size={12} className="mr-1" />Algos</TabsTrigger>
              <TabsTrigger value="dist" data-testid="tab-dist"><BookOpen size={12} className="mr-1" />Distill</TabsTrigger>
            </TabsList>
            <TabsContent value="agents" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {agents.map(a => (
                    <div key={a.id} className={`px-3 py-2 rounded-lg border ${a.is_prime ? "bg-cyan-900/20 border-cyan-500/40" : "bg-slate-800/40 border-slate-700"}`} data-testid={`agent-${a.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-cyan-200">{a.name}</div>
                        <Badge variant="outline" className="text-[9px] border-cyan-500/40">{a.is_prime ? "PRIME" : `g${a.generation}`}</Badge>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{a.specialty}</div>
                      <div className="text-[9px] text-slate-500 mt-1">{a.works_completed} works · {a.commits_attributed} commits {a.parent_name ? `· ↑ ${a.parent_name}` : ""}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="works" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {works.length === 0 ? <div className="text-xs text-slate-500 p-4 text-center">No works yet — Δ will start in ~7 minutes.</div> :
                    works.map(w => (
                      <div key={w.id} className="px-2 py-1.5 rounded bg-slate-800/40 border border-slate-700" data-testid={`work-${w.id}`}>
                        <div className="text-[11px] font-semibold text-slate-200">{w.title}</div>
                        <div className="text-[9px] text-cyan-400/60">{w.agent_name} · {new Date(w.created_at).toLocaleTimeString()}</div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="algos" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {algos.length === 0 ? <div className="text-xs text-slate-500 p-4 text-center">No algos mined yet.</div> :
                    algos.map(a => (
                      <div key={a.id} className="px-2 py-1.5 rounded bg-slate-800/40 border border-slate-700" data-testid={`algo-${a.id}`}>
                        <div className="text-[11px] font-semibold text-slate-200">{a.name}</div>
                        <div className="text-[9px] text-purple-400">{a.language || "?"} · O({a.complexity || "?"})</div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="dist" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {distillations.length === 0 ? <div className="text-xs text-slate-500 p-4 text-center">No distillations yet — engine wakes ~6.5 min after boot.</div> :
                    distillations.map(d2 => (
                      <div key={d2.id} className="px-2 py-1.5 rounded bg-slate-800/40 border border-slate-700" data-testid={`dist-${d2.id}`}>
                        <div className="text-[10px] text-cyan-400">{d2.provider_name} · {d2.model}</div>
                        <div className="text-[10px] text-slate-300 line-clamp-2">{d2.response_text?.slice(0, 200)}</div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        {/* File editor row */}
        <Card className="lg:col-span-3 bg-slate-900/60 border-cyan-500/20 p-4" data-testid="card-editor">
          <div className="flex items-center gap-2 pb-3 border-b border-cyan-500/10 mb-3">
            <FileText size={16} className="text-cyan-400" />
            <div className="text-sm font-bold text-cyan-300">FILE EDITOR · commits + pushes to GitHub</div>
          </div>
          <div className="flex gap-2 mb-2">
            <Input value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="server/some-file.ts or client/src/pages/Foo.tsx" className="bg-slate-800/60 border-cyan-500/30 text-sm flex-1" data-testid="input-path" />
            <Button onClick={() => loadFileMutation.mutate(filePath)} disabled={!filePath || loadFileMutation.isPending} variant="outline" className="border-cyan-500/30 text-cyan-300" data-testid="button-load">Load</Button>
            <Button onClick={() => saveFileMutation.mutate()} disabled={!filePath || !fileContent || saveFileMutation.isPending} className="bg-cyan-600 hover:bg-cyan-500" data-testid="button-save"><Save size={14} className="mr-1" />Save & Push</Button>
          </div>
          <Textarea value={fileContent} onChange={e => setFileContent(e.target.value)} placeholder="// load a file or paste new content…" className="bg-slate-950 border-cyan-500/20 font-mono text-xs" rows={14} data-testid="textarea-content" />
          {savedSha && <div className="text-xs text-emerald-400 mt-2" data-testid="text-saved">✓ committed {savedSha.slice(0, 8)} {saveFileMutation.data?.error ? `(commit ok, push: ${saveFileMutation.data.error})` : "→ pushed to github"}</div>}
        </Card>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="px-3 py-2 rounded bg-slate-800/40 border border-cyan-500/10" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/70">{icon}{label}</div>
      <div className="text-lg font-bold text-cyan-200">{value}</div>
    </div>
  );
}
