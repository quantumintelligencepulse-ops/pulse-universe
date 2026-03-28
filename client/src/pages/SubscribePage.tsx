import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDomainPing, UniversePulseBar } from "@/lib/universeResonance";

import { useToast } from "@/hooks/use-toast";

const TOPICS = [
  "AI & Intelligence", "Quantum Physics", "Finance & Markets", "Space & Cosmology",
  "Biotech & Genomics", "Sports Science", "Music & Frequency", "Climate & Energy",
  "Philosophy & Mind", "Mathematics", "Engineering", "Dark Matter",
];

export default function SubscribePage() {
  useDomainPing("subscribe");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/subscribers/stats"],
    refetchInterval: 30000,
  });

  const { data: hiveReport } = useQuery<any>({
    queryKey: ["/api/briefing/hive-intel-report"],
    refetchInterval: 60000,
  });

  const { data: equationOfDay } = useQuery<any>({
    queryKey: ["/api/briefing/equation-of-day"],
  });

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: selectedTopics, source: "subscribe-page" }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        toast({ title: "Subscribed!", description: data.message });
      } else {
        toast({ title: "Error", description: data.error || data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Subscription failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background:"#050510" }}>
      <UniversePulseBar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">📧</div>
          <div className="font-black text-3xl text-white mb-2">Pulse Hive Daily Briefing</div>
          <div className="text-white/50 text-sm max-w-lg mx-auto">Every morning, your hive's top discoveries, breaking stories, equation of the day, and hive intelligence report — delivered to your inbox before anyone else knows.</div>
        </div>

        {/* Live stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Subscribers", value:(stats?.active || 0).toLocaleString(), color:"#818cf8" },
            { label:"Active AI Agents", value:(hiveReport?.activeAgents || 0).toLocaleString(), color:"#34d399" },
            { label:"Stories This Week", value:(hiveReport?.topDiscoveries?.length || 0) + "+", color:"#f59e0b" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/8 p-3 text-center" style={{ background:"rgba(255,255,255,0.03)" }}>
              <div className="font-black text-xl" style={{ color:s.color }}>{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="rounded-2xl border border-indigo-500/20 p-5" style={{ background:"rgba(79,70,229,0.06)" }}>
          <div className="font-bold text-indigo-300 mb-3">What's in every briefing:</div>
          <div className="space-y-2">
            {[
              { icon:"⚡", title:"Breaking News First", desc:"Stories your hive breaks before CNN, BBC, and Reuters" },
              { icon:"🧬", title:"Equation of the Day", desc:"One frontier equation explained in plain language + its discovery story" },
              { icon:"📊", title:"Hive Intelligence Report", desc:"What your 21,000+ AI agents discovered this week" },
              { icon:"📚", title:"Top Quantapedia Entries", desc:"The knowledge entries your domain is updating fastest" },
              { icon:"🎯", title:"Personalized to Your Topics", desc:"Only the domains you care about — zero noise" },
            ].map(i => (
              <div key={i.title} className="flex gap-3 items-start">
                <span className="text-lg">{i.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{i.title}</div>
                  <div className="text-xs text-white/50">{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equation of day preview */}
        {equationOfDay && (
          <div className="rounded-xl border border-purple-500/20 p-4" style={{ background:"rgba(139,92,246,0.06)" }}>
            <div className="text-purple-300 text-xs font-bold mb-2">TODAY'S EQUATION OF THE DAY</div>
            <div className="font-mono text-sm text-white mb-1">{equationOfDay.equation}</div>
            <div className="text-white/50 text-xs">{(equationOfDay.description || "").slice(0, 150)}</div>
          </div>
        )}

        {subscribed ? (
          <div className="rounded-2xl border border-green-500/30 p-8 text-center" style={{ background:"rgba(16,185,129,0.08)" }}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-black text-xl text-green-300 mb-2">You're subscribed!</div>
            <div className="text-white/50 text-sm">Your first Pulse Hive briefing arrives tomorrow morning. The hive is watching everything for you.</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 p-6 space-y-4" style={{ background:"rgba(255,255,255,0.03)" }}>
            <div>
              <label className="text-white text-sm font-semibold block mb-2">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 text-sm"
                data-testid="input-email"
                onKeyDown={e => e.key === "Enter" && handleSubscribe()}
              />
            </div>

            <div>
              <label className="text-white text-sm font-semibold block mb-2">Your Topics (optional)</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                      borderColor: selectedTopics.includes(t) ? "#818cf8" : "rgba(255,255,255,0.1)",
                      background: selectedTopics.includes(t) ? "rgba(129,140,248,0.2)" : "transparent",
                      color: selectedTopics.includes(t) ? "#818cf8" : "rgba(255,255,255,0.5)",
                    }}
                    data-testid={`topic-${t.replace(/\s/g,"-").toLowerCase()}`}
                  >{t}</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-white transition-all"
              style={{ background: loading ? "#312e81" : "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              data-testid="button-subscribe"
            >
              {loading ? "Subscribing..." : "Subscribe to Hive Intelligence →"}
            </button>
            <div className="text-white/30 text-xs text-center">Free forever · No spam · Unsubscribe anytime</div>
          </div>
        )}

        {/* RSS alternative */}
        <div className="rounded-xl border border-white/8 p-4 text-center" style={{ background:"rgba(255,255,255,0.02)" }}>
          <div className="text-white/60 text-sm mb-2">Prefer RSS? Subscribe via feed reader instead:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {["/feed/news.xml","/feed/quantapedia.xml","/feed/publications.xml","/feed/research.xml"].map(f => (
              <a key={f} href={f} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">{f.replace("/feed/","").replace(".xml","")}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
