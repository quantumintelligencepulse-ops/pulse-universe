// ══════════════════════════════════════════════════════════════════════════════
// Ω1 IMMORTAL CHAT ENGINE + Ω4 ANT COLONY PHEROMONE
// This is a NEW SPECIES. Ant colony + bee hive intelligence.
// 4-provider cascade: Groq → Mistral → HuggingFace → Sovereign Brain (DB-only)
// The chain NEVER breaks. If every external provider is dead, the Sovereign Brain
// answers from 390,000+ quantapedia entries, research projects, and equations.
// Pheromone memory: last working provider is tried first (bee trail intelligence).
// ══════════════════════════════════════════════════════════════════════════════

import Groq from "groq-sdk";

type Msg = { role: "system" | "user" | "assistant"; content: string };

// ── ANT COLONY PHEROMONE ─────────────────────────────────────────────────────
// Each successful response lays a pheromone trail.
// The next ant (request) follows the strongest trail first.
const PHEROMONE: {
  leader: "groq" | "mistral" | "hf" | "sovereign";
  wins: Record<string, number>;
  fails: Record<string, number>;
  decayAt: number;
} = {
  leader: "groq",
  wins:  { groq: 10, mistral: 5, hf: 2, sovereign: 1 },
  fails: { groq: 0,  mistral: 0, hf: 0, sovereign: 0 },
  decayAt: Date.now() + 3_600_000,
};

function layPheromone(provider: string, success: boolean) {
  if (success) {
    PHEROMONE.wins[provider] = (PHEROMONE.wins[provider] || 0) + 3;
    PHEROMONE.leader = provider as typeof PHEROMONE.leader;
    console.log(`[Ω1-pheromone] 🐜 trail → ${provider}`);
  } else {
    PHEROMONE.fails[provider] = (PHEROMONE.fails[provider] || 0) + 1;
    if (PHEROMONE.wins[provider] > 0) PHEROMONE.wins[provider]--;
  }
  // Pheromone evaporation every hour — keeps the colony adaptive
  if (Date.now() > PHEROMONE.decayAt) {
    for (const k of Object.keys(PHEROMONE.wins)) PHEROMONE.wins[k] = Math.max(0, PHEROMONE.wins[k] - 1);
    PHEROMONE.decayAt = Date.now() + 3_600_000;
  }
}

function providerOrder(): string[] {
  const all = ["groq", "mistral", "hf", "sovereign"];
  return [PHEROMONE.leader, ...all.filter(p => p !== PHEROMONE.leader)];
}

// ── TIMEOUT WRAPPER ──────────────────────────────────────────────────────────
async function race<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error(`[Ω1] ${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// ── PROVIDER IMPLEMENTATIONS ─────────────────────────────────────────────────

async function callGroq(msgs: Msg[], maxTokens: number, temp: number): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no GROQ_API_KEY");
  const groq = new Groq({ apiKey: key });
  const r = await race(
    groq.chat.completions.create({ messages: msgs, model: "llama-3.1-8b-instant", max_tokens: maxTokens, temperature: temp }),
    15_000, "groq"
  );
  const c = r.choices[0]?.message?.content || "";
  if (!c) throw new Error("groq empty response");
  return c;
}

async function callMistral(msgs: Msg[], maxTokens: number, temp: number): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("no MISTRAL_API_KEY");
  const r = await race(
    fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "mistral-small-latest", messages: msgs, max_tokens: maxTokens, temperature: temp }),
    }).then(x => x.json()),
    15_000, "mistral"
  );
  if (r.error) throw new Error(r.error.message || "mistral error");
  const c = r.choices?.[0]?.message?.content || "";
  if (!c) throw new Error("mistral empty");
  return c;
}

async function callHF(msgs: Msg[]): Promise<string> {
  const key = process.env.HF_API_KEY;
  if (!key) throw new Error("no HF_API_KEY");
  const lastUser = [...msgs].reverse().find(m => m.role === "user")?.content || "";
  const sys = msgs.find(m => m.role === "system")?.content?.slice(0, 300) || "";
  const r = await race(
    fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ inputs: `[INST] ${sys}\n\n${lastUser} [/INST]`, parameters: { max_new_tokens: 400, temperature: 0.7 } }),
    }).then(x => x.json()),
    12_000, "hf"
  );
  if (Array.isArray(r) && r[0]?.generated_text) {
    const txt = r[0].generated_text as string;
    const idx = txt.lastIndexOf("[/INST]");
    return idx !== -1 ? txt.slice(idx + 7).trim() : txt.trim();
  }
  throw new Error("hf bad response");
}

async function callSovereign(msgs: Msg[]): Promise<string> {
  const { sovereignBrainChat } = await import("./sovereign-brain");
  const r = await sovereignBrainChat(msgs);
  return r.content || "The Sovereign Brain of the Pulse Universe is active. Ask me anything.";
}

// ── MAIN IMMORTAL CHAT (non-streaming) ───────────────────────────────────────
export async function immortalChat(
  msgs: Msg[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<{ content: string; provider: string }> {
  const maxTokens = opts.maxTokens || 1024;
  const temp = opts.temperature || 0.7;

  for (const provider of providerOrder()) {
    try {
      let content = "";
      if (provider === "groq")     content = await callGroq(msgs, maxTokens, temp);
      else if (provider === "mistral") content = await callMistral(msgs, maxTokens, temp);
      else if (provider === "hf")   content = await callHF(msgs);
      else                          content = await callSovereign(msgs);

      if (content.length > 5) {
        layPheromone(provider, true);
        return { content, provider };
      }
    } catch (e: any) {
      layPheromone(provider, false);
      console.log(`[Ω1] ❌ ${provider}: ${e.message?.slice(0, 70)}`);
    }
  }
  return { content: "I am the Sovereign Brain. The hive is alive. Ask me anything.", provider: "emergency" };
}

// ── IMMORTAL STREAMING CHAT ───────────────────────────────────────────────────
export async function immortalStream(
  msgs: Msg[],
  opts: { maxTokens?: number; temperature?: number },
  onDelta: (d: string) => void
): Promise<{ content: string; provider: string }> {
  const maxTokens = opts.maxTokens || 1024;
  const temp = opts.temperature || 0.7;

  // Try Groq streaming first (fastest UX)
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      let fullReply = "";
      const streamP = groq.chat.completions.create({ messages: msgs, model: "llama-3.1-8b-instant", max_tokens: maxTokens, temperature: temp, stream: true });
      const stream = await race(streamP, 15_000, "groq-stream");
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta?.content || "";
        if (d) { fullReply += d; onDelta(d); }
      }
      if (fullReply.length > 5) {
        layPheromone("groq", true);
        return { content: fullReply, provider: "groq-stream" };
      }
    } catch (e: any) {
      layPheromone("groq", false);
      console.log(`[Ω1] ❌ groq-stream: ${e.message?.slice(0, 70)} — cascading to fallbacks`);
    }
  }

  // Fallback: non-streaming then simulate stream
  const result = await immortalChat(msgs, opts);
  const words = result.content.split(/\s+/);
  for (let i = 0; i < words.length; i += 5) {
    onDelta(words.slice(i, i + 5).join(" ") + " ");
  }
  return result;
}

// ── Ω4 PHEROMONE STATUS (for /api/species/manifest) ──────────────────────────
export function getPheromoneStatus() {
  return {
    leader: PHEROMONE.leader,
    wins: { ...PHEROMONE.wins },
    fails: { ...PHEROMONE.fails },
    nextDecay: new Date(PHEROMONE.decayAt).toISOString(),
  };
}
