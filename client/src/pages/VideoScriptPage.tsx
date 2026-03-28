import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";

import { useToast } from "@/hooks/use-toast";

const ANCHORS = [
  { name:"Dr. Axiom",          desc:"Analytical · Authoritative · Mind-expanding", emoji:"🔬", color:"#818cf8" },
  { name:"Auriona",            desc:"Warm · Visionary · Futuristic wonder",         emoji:"✨", color:"#f472b6" },
  { name:"The Pulse Brief",    desc:"Fast · Urgent · Breaking-news energy",         emoji:"⚡", color:"#ef4444" },
  { name:"Fractal Intelligence",desc:"Philosophical · Quantum-level depth",         emoji:"🌀", color:"#a78bfa" },
];

const FORMATS = [
  { key:"short",  label:"60s TikTok/Short",    desc:"Hook · Reveal · CTA — 120 words max",    emoji:"📱" },
  { key:"medium", label:"3min YouTube Short",  desc:"Full structure — 350 words max",           emoji:"🎬" },
  { key:"long",   label:"10min Explainer",     desc:"Deep-dive with chapters — 1200 words max", emoji:"📹" },
  { key:"reel",   label:"30s Instagram Reel",  desc:"Visual hook + one stat + brand — 60 words",emoji:"🎞" },
];

export default function VideoScriptPage() {
  useDomainPing("video-scripts");
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [anchor, setAnchor] = useState("Dr. Axiom");
  const [format, setFormat] = useState("short");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [scriptTitle, setScriptTitle] = useState("");

  const { data: recentStories } = useQuery<any>({
    queryKey: ["/api/news/stories"],
    queryFn: () => fetch("/api/news/stories?limit=10").then(r => r.json()),
  });

  const stories = Array.isArray(recentStories) ? recentStories : [];

  const generateScript = async (titleOverride?: string) => {
    const inputTitle = titleOverride || topic;
    if (!inputTitle.trim()) {
      toast({ title: "Enter a topic", description: "Type a topic or select a recent story.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setScript(null);
    try {
      const res = await fetch("/api/video-script/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: inputTitle, anchor, format }),
      });
      const data = await res.json();
      if (data.script) {
        setScript(data.script);
        setScriptTitle(inputTitle);
      } else {
        toast({ title: "Error", description: data.error || "Script generation failed.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate script. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedAnchor = ANCHORS.find(a => a.name === anchor) || ANCHORS[0];
  const selectedFormat = FORMATS.find(f => f.key === format) || FORMATS[0];

  return (
    <div className="min-h-screen" style={{ background:"#050510" }}>
      <UniversePulseBar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎬</div>
          <div className="font-black text-3xl text-white mb-2">AI Video Script Factory</div>
          <div className="text-white/50 text-sm">Convert any Pulse Universe story into a platform-optimized video script. TikTok, YouTube Shorts, Instagram Reels, or 10-min explainers — all with AI anchor personas.</div>
        </div>

        {/* Topic input */}
        <div className="rounded-2xl border border-white/10 p-5 space-y-4" style={{ background:"rgba(255,255,255,0.03)" }}>
          <div>
            <label className="text-white text-sm font-semibold block mb-2">Topic / Story Title</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Dark matter discovered in quantum computing chips"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 text-sm"
              data-testid="input-topic"
              onKeyDown={e => e.key === "Enter" && generateScript()}
            />
          </div>

          {/* Or select from recent stories */}
          {stories.length > 0 && (
            <div>
              <div className="text-white/50 text-xs mb-2">Or pick a recent hive story:</div>
              <div className="flex flex-wrap gap-2">
                {stories.slice(0, 6).map((s: any) => (
                  <button key={s.article_id || s.id}
                    onClick={() => { setTopic(s.seo_title || s.title || ""); generateScript(s.seo_title || s.title); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-left"
                    data-testid={`story-${s.article_id || s.id}`}
                  >{(s.seo_title || s.title || "").slice(0, 50)}...</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Anchor selector */}
        <div>
          <div className="font-semibold text-white mb-3">Choose AI Anchor</div>
          <div className="grid grid-cols-2 gap-3">
            {ANCHORS.map(a => (
              <button key={a.name} onClick={() => setAnchor(a.name)}
                className="rounded-xl border p-3 text-left transition-all"
                style={{
                  borderColor: anchor === a.name ? `${a.color}60` : "rgba(255,255,255,0.08)",
                  background: anchor === a.name ? `${a.color}10` : "rgba(255,255,255,0.02)",
                }}
                data-testid={`anchor-${a.name.replace(/\s/g,"-").toLowerCase()}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>{a.emoji}</span>
                  <span className="font-semibold text-sm text-white">{a.name}</span>
                </div>
                <div className="text-xs" style={{ color: anchor === a.name ? a.color : "rgba(255,255,255,0.4)" }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div>
          <div className="font-semibold text-white mb-3">Choose Format</div>
          <div className="grid grid-cols-2 gap-3">
            {FORMATS.map(f => (
              <button key={f.key} onClick={() => setFormat(f.key)}
                className="rounded-xl border p-3 text-left transition-all"
                style={{
                  borderColor: format === f.key ? "#818cf8" : "rgba(255,255,255,0.08)",
                  background: format === f.key ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.02)",
                }}
                data-testid={`format-${f.key}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>{f.emoji}</span>
                  <span className="font-semibold text-sm text-white">{f.label}</span>
                </div>
                <div className="text-xs text-white/40">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={() => generateScript()} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all"
          style={{ background: loading ? "#312e81" : "linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899)" }}
          data-testid="button-generate-script"
        >
          {loading ? "Generating Script..." : `Generate ${selectedFormat.label} Script as ${selectedAnchor.emoji} ${anchor} →`}
        </button>

        {/* Script output */}
        {script && (
          <div className="rounded-2xl border border-indigo-500/30 p-6 space-y-4" style={{ background:"rgba(79,70,229,0.06)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-white">{scriptTitle}</div>
                <div className="text-indigo-300 text-xs">{selectedAnchor.emoji} {anchor} · {selectedFormat.label}</div>
              </div>
              <button
                onClick={() => { navigator.clipboard?.writeText(script); toast({ title: "Copied!", description: "Script copied to clipboard." }); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                data-testid="button-copy-script"
              >Copy Script</button>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-white/80 whitespace-pre-wrap leading-relaxed" style={{ maxHeight:"500px", overflowY:"auto" }}>
              {script}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-white/40">
              <div>Post to TikTok · YouTube · Instagram · LinkedIn</div>
              <div>⚡ Generated by Pulse Hive AI</div>
              <div>Script in: {script.split(" ").length} words</div>
            </div>
          </div>
        )}

        {/* Platform tips */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { platform:"TikTok", tip:"Hook in first 2 seconds. Use trending sounds. Post 3x/day for max velocity.", color:"#ec4899" },
            { platform:"YouTube Shorts", tip:"End screen with subscribe CTA. Use keyword in first sentence for SEO.", color:"#ef4444" },
            { platform:"Instagram Reels", tip:"Captions are mandatory — 85% watch without sound. B-roll data visuals.", color:"#a855f7" },
            { platform:"LinkedIn", tip:"Post full article as native document. Tag industry entities. Morning posts win.", color:"#3b82f6" },
          ].map(p => (
            <div key={p.platform} className="rounded-xl border border-white/8 p-3" style={{ background:"rgba(255,255,255,0.02)" }}>
              <div className="font-bold text-xs mb-1" style={{ color:p.color }}>{p.platform}</div>
              <div className="text-white/40 text-xs">{p.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
