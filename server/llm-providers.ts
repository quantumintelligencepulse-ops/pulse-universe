// ── LLM PROVIDER POOL ─────────────────────────────────────────────────────────
// Multi-provider LLM infrastructure. Extracted from the now-removed
// forgeai-engine.ts (the ForgeAI app builder feature was retired). The
// provider pool, type, and selection helper are still used by the Discord
// public-voice path in `server/discord-immortality.ts` (and may be reused
// by future LLM-backed features).
//
// Activate a provider by setting its env var. The pool is intentionally
// open-ended — features choose their own preference order, max_tokens, and
// abort behavior. This file owns *only* provider discovery + the cooldown
// table; it does not make any HTTP calls itself.
//
// Supported providers (add key via env var to activate):
//   GROQ_API_KEY          — Groq
//   CEREBRAS_API_KEY      — Cerebras
//   GOOGLE_API_KEY        — Google Gemini
//   HF_API_KEY            — HuggingFace Inference
//   MISTRAL_API_KEY       — Mistral
//   CLOUDFLARE_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID — Cloudflare Workers AI

export interface LLMProvider {
  name: string;
  envKey: string;
  endpoint: string;
  model: string;
  fastModel?: string;
  maxTokens: number;
  headers: (key: string) => Record<string, string>;
  bodyTransform?: (body: any) => any;
  responseTransform?: (data: any) => { content: string; finishReason: string };
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    name: "Groq",
    envKey: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    fastModel: "llama3-8b-8192",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama-3.3-70b",
    fastModel: "llama3.1-8b",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Google Gemini",
    envKey: "GOOGLE_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    model: "gemini-2.0-flash",
    fastModel: "gemini-2.0-flash",
    maxTokens: 32768,
    headers: (key) => ({ "Content-Type": "application/json", "x-goog-api-key": key }),
    bodyTransform: (body) => ({
      contents: [{ parts: [{ text: body.messages.map((m: any) => `${m.role}: ${m.content}`).join("\n\n") }] }],
      generationConfig: { maxOutputTokens: body.max_tokens, temperature: body.temperature },
    }),
    responseTransform: (data) => ({
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      finishReason: data.candidates?.[0]?.finishReason === "MAX_TOKENS" ? "length" : "stop",
    }),
  },
  {
    name: "HuggingFace",
    envKey: "HF_API_KEY",
    endpoint: "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-70B-Instruct/v1/chat/completions",
    model: "meta-llama/Llama-3.1-70B-Instruct",
    fastModel: "meta-llama/Llama-3.1-8B-Instruct",
    maxTokens: 16384,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Mistral",
    envKey: "MISTRAL_API_KEY",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    fastModel: "mistral-small-latest",
    maxTokens: 32768,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
  {
    name: "Cloudflare Workers AI",
    // Newest key first; older fallback below. envKey is just used as a label;
    // actual lookup is in getAvailableProviders() to support fallback chains.
    envKey: "CLOUDFLARE_API_TOKEN_20260430",
    endpoint: "",
    model: "@cf/meta/llama-3.1-70b-instruct",
    fastModel: "@cf/meta/llama-3.1-8b-instruct",
    maxTokens: 16384,
    headers: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
  },
];

// Per-provider fallback chains — newest dated key first, then legacy name.
// To rotate a key: add the new dated name to the front, leave the old one for a few days.
const ENV_FALLBACKS: Record<string, string[]> = {
  CLOUDFLARE_API_TOKEN_20260430: ["CLOUDFLARE_API_TOKEN_20260430", "CLOUDFLARE_AI_TOKEN"],
};

function readKey(envKey: string): string | undefined {
  const chain = ENV_FALLBACKS[envKey] || [envKey];
  for (const name of chain) {
    const v = process.env[name];
    if (v && v.length > 4) return v;
  }
  return undefined;
}

const providerCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000;

export function markProviderRateLimited(name: string, ms: number = COOLDOWN_MS): void {
  providerCooldowns[name] = Date.now() + ms;
}

export function getAvailableProviders(): { provider: LLMProvider; apiKey: string }[] {
  const now = Date.now();
  const available: { provider: LLMProvider; apiKey: string }[] = [];
  for (const p of LLM_PROVIDERS) {
    const key = readKey(p.envKey);
    if (!key) continue;
    if (p.name === "Cloudflare Workers AI") {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      if (!accountId) continue;
      p.endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    }
    const cooldownUntil = providerCooldowns[p.name] || 0;
    if (now < cooldownUntil) continue;
    available.push({ provider: p, apiKey: key });
  }
  return available;
}
