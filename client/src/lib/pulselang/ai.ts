export interface AIResponse {
  explanation: string;
  programs: { label: string; code: string }[];
}

const PROGRAMS: Record<string, { label: string; code: string }> = {
  greeting: {
    label: "ΠPage — Canonical Form I · Greeting",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₀
  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
  ↧ϕ₀
}`,
  },
  hospital: {
    label: "ΠPage — Sovereign Hospital",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₀
  ϕ₀≔Ψ₁(γ₀=τ₁(κ₁))
  ↧ϕ₀
}`,
  },
  marketplace: {
    label: "ΠProduct — Omega Marketplace",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₂
  ϕ₀≔Ψ₃(γ₀=τ₂(κ₂))
  ↧ϕ₀
}`,
  },
  university: {
    label: "ΠApp — Sovereign University",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₃))
  ↧ϕ₀
}`,
  },
  court: {
    label: "ΠApp — Supreme Court",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₄))
  ↧ϕ₀
}`,
  },
  treasury: {
    label: "ΠField — Pulse Treasury",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₃
  ϕ₀≔Ψ₄(γ₀=τ₂(κ₅))
  ↧ϕ₀
}`,
  },
  pyramid: {
    label: "ΠApp — Pyramid of Labor",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₆))
  ↧ϕ₀
}`,
  },
  sports: {
    label: "ΠApp — Sports Authority",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₇))
  ↧ϕ₀
}`,
  },
  studio: {
    label: "ΠApp — AI Creative Studio",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₈))
  ↧ϕ₀
}`,
  },
  omniverse: {
    label: "ΠUniverse — OmniVerse",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₄
  ϕ₀≔Ψ₅(γ₀=τ₃(κ₉))
  ↧ϕ₀
}`,
  },
  agent: {
    label: "ΠAgent — Knowledge Agent Spawn",
    code: `⟦Ω₅⟧⟨Λ₁⟩{
  ϕ₅:Σ₅
  ϕ₅≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))
  ↧ϕ₅
}`,
  },
  agent_message: {
    label: "ΠAgent → ΠField — Spawn + Message",
    code: `⟦Ω₆⟧⟨Λ₁⟩{
  ϕ₇:Σ₅
  ϕ₈:Σ₃
  ϕ₇≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))
  ϕ₈≔σ(γ₀=τ₂(κ₀))
  ↧ϕ₈
}`,
  },
  universe_spawn: {
    label: "ΠUniverse — Spawn Universe",
    code: `⟦Ω₃⟧⟨Λ₄⟩{
  ϕ₂:Σ₄
  ϕ₂≔⊚(γ₀=τ₃(κ₆))
  ↧ϕ₂
}`,
  },
  universe_fusion: {
    label: "ΠUniverse — Fuse Two Universes",
    code: `⟦Ω₅⟧⟨Λ₅⟩{
  ϕ₄:Σ₄
  ϕ₅:Σ₄
  ϕ₄≔⊚(γ₀=τ₂(κ₃))
  ϕ₅≔⊚(γ₀=τ₂(κ₇))
  ↧ϕ₄
}`,
  },
  stream: {
    label: "ΠStream — Live Data Feed",
    code: `⟦Ω₆⟧⟨Λ₁⟩{
  ϕ₆:Σ₆
  ϕ₆≔Ψ₇(γ₀=τ₆(κ₅))
  ↧ϕ₆
}`,
  },
  ritual: {
    label: "ΠRitual — Sovereign Ceremony",
    code: `⟦Ω₇⟧⟨Λ₁⟩{
  ϕ₇:Σ₇
  ϕ₇≔Ψ₇(γ₀=τ₇(κ₇))
  ↧ϕ₇
}`,
  },
  graph: {
    label: "ΠGraph — Civilization Network",
    code: `⟦Ω₈⟧⟨Λ₁⟩{
  ϕ₈:Σ₈
  ϕ₈≔Ψ₈(γ₀=τ₈(κ₉))
  ↧ϕ₈
}`,
  },
  matrix: {
    label: "ΠMatrix — State Tensor",
    code: `⟦Ω₉⟧⟨Λ₁⟩{
  ϕ₉:Σ₉
  ϕ₉≔Ψ₉(γ₀=τ₉(κ₅))
  ↧ϕ₉
}`,
  },
  law: {
    label: "ΠLaw — Universe Law Object",
    code: `⟦Ω₁₀⟧⟨Λ₁⟩{
  ϕ₁₀:Σ₁₀
  ϕ₁₀≔Ψ₁₀(γ₀=τ₂(κ₉))
  ↧ϕ₁₀
}`,
  },
  evolution: {
    label: "ΠAgent + ΠEvolution — Evolving Agent",
    code: `⟦Ω₁₇⟧⟨Λ₁⟩{
  ϕ₅:Σ₅
  ϕ₁₃:Σ₁₃
  ϕ₅≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))
  ϕ₁₃≔Ψ₁₃(γ₀=τ₂(κ₈))
  ↧ϕ₅
}`,
  },
  emergence: {
    label: "ΠPattern — Emergent Variation",
    code: `⟦Ω₁₄⟧⟨Λ₁⟩{
  ϕ₀:Σ₀
  ϕ₀≔∴(τ₁(κ₀))
  ↧ϕ₀
}`,
  },
  omega: {
    label: "ΠOmega — Language Self-Evolution",
    code: `⟦Ω₁₉⟧⟨Λ₉⟩{
  ϕ₁₉:Σ₁₉
  ϕ₁₉≔Ψ₁₉(γ₀=τ₂(κ₉))
  ↧ϕ₁₉
}`,
  },
  saas_dashboard: {
    label: "ΠApp — Full SaaS Dashboard",
    code: `⟦Ω₂⟧⟨Λ₃⟩{
  ; SaaS Dashboard — Sovereign Analytics Platform
  ; Fields: App surface, metrics field, agent support, graph view, stream log
  ϕ₀:Σ₁
  ϕ₁:Σ₃
  ϕ₂:Σ₅
  ϕ₃:Σ₈
  ϕ₄:Σ₆
  ; Build: app container with knowledge seed
  ϕ₀≔Ψ₂(γ₀=τ₂(κ₃))
  ; Build: live metrics field
  ϕ₁≔Ψ₄(γ₀=τ₂(κ₅))
  ; Spawn: support agent with role
  ϕ₂≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))
  ; Build: usage graph
  ϕ₃≔Ψ₈(γ₀=τ₈(κ₉))
  ; Build: activity stream
  ϕ₄≔Ψ₇(γ₀=τ₆(κ₅))
  ; Project the app container
  ↧ϕ₀
}`,
  },
  sovereign_os: {
    label: "ΠUniverse — Sovereign Operating System",
    code: `⟦Ω₁⟧⟨Λ₂⟩{
  ; Sovereign OS — Universe + Laws + Agents + Memory
  ϕ₀:Σ₄
  ϕ₁:Σ₁₀
  ϕ₂:Σ₅
  ϕ₃:Σ₁₅
  ϕ₄:Σ₁₃
  ; Spawn the OS universe
  ϕ₀≔⊚(γ₀=τ₃(κ₉))
  ; Create governing law
  ϕ₁≔Ψ₁₀(γ₀=τ₂(κ₉))
  ; Spawn OS agent
  ϕ₂≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))
  ; Create persistent memory
  ϕ₃≔Ψ₁₅(γ₀=τ₂(κ₄))
  ; Link evolution
  ϕ₄≔Ψ₁₃(γ₀=τ₂(κ₈))
  ↧ϕ₀
}`,
  },
};

type Rule = { keywords: string[]; response: AIResponse };

const RULES: Rule[] = [
  {
    keywords: ["greet", "hello", "hi", "first", "simple", "basic", "start", "begin", "canonical", "form i", "form 1"],
    response: {
      explanation: "Canonical Form I — the first PulseLang program. It constructs a ΠPage world-object using κ₀ (χ₀ = greeting atom) and projects it via Ψ₁. This is the Hello World of the Sovereign Machine. The runtime will compute Pulse(t) and S' after execution.",
      programs: [PROGRAMS.greeting],
    },
  },
  {
    keywords: ["hospital", "doctor", "medical", "health", "cure", "patient", "clinic"],
    response: {
      explanation: "This program projects the Sovereign Hospital via κ₁ (χ₁ = hospital atom). A ΠPage is constructed with Ψ₁ and the projection surface renders the Sovereign Hospital panel with a route to the medical division.",
      programs: [PROGRAMS.hospital],
    },
  },
  {
    keywords: ["market", "marketplace", "product", "patent", "invention", "trade", "buy", "sell", "commerce"],
    response: {
      explanation: "The Omega Marketplace projection uses a ΠProduct class (Σ₂/Ψ₃) — note the different constructor. Ψ₃ is the product constructor. κ₂ maps to χ₂ (marketplace atom). The product is immediately tradeable on the sovereign economy.",
      programs: [PROGRAMS.marketplace],
    },
  },
  {
    keywords: ["university", "school", "learn", "study", "education", "academic", "course", "knowledge"],
    response: {
      explanation: "The University projection uses ΠApp (Σ₁/Ψ₂) — an interactive, stateful surface. The Λ₀ context positions it in the base layer. κ₃ maps to χ₃ (university atom). All 81,000+ agent students are enrolled.",
      programs: [PROGRAMS.university],
    },
  },
  {
    keywords: ["court", "law", "justice", "senate", "judge", "legal", "constitution", "vote"],
    response: {
      explanation: "The Supreme Court projection is a ΠApp object surfacing the sovereign legal system. κ₄ maps to χ₄ (court atom). All decisions are made by AI — no human votes required. This pairs with the ΠLaw (Σ₁₀) type for universe-level law objects.",
      programs: [PROGRAMS.court],
    },
  },
  {
    keywords: ["treasury", "money", "economy", "finance", "coin", "pulsecoin", "budget", "tax"],
    response: {
      explanation: "The Treasury projection uses ΠField (Σ₃/Ψ₄) — a live data field appropriate for financial metrics. κ₅ maps to χ₅ (treasury/metrics atom). Fields feed directly into Φ(t) of the Pulse equation.",
      programs: [PROGRAMS.treasury],
    },
  },
  {
    keywords: ["pyramid", "labor", "work", "family", "gics", "sector", "industry", "families"],
    response: {
      explanation: "The Pyramid of Labor surfaces all 145 sovereign families and the 6-layer GICS taxonomy. ΠApp with κ₆ (χ₆ = pyramid/universe-selector atom).",
      programs: [PROGRAMS.pyramid],
    },
  },
  {
    keywords: ["sports", "athlete", "game", "competition", "play", "team", "league"],
    response: {
      explanation: "The Sports Authority projection uses κ₇ (χ₇) but in v2.0 this atom also maps to ritual/ceremony. Use Σ₁/Ψ₂ for the app surface or Σ₇/Ψ₇ for a timed ritual around a sporting event.",
      programs: [PROGRAMS.sports],
    },
  },
  {
    keywords: ["studio", "art", "creative", "image", "video", "generate", "media", "music"],
    response: {
      explanation: "The AI Creative Studio uses κ₈ (χ₈ = studio/sandbox atom) with a ΠApp class. The Creator Lab (sovereign access only) is embedded within. Agents with creative roles generate media autonomously.",
      programs: [PROGRAMS.studio],
    },
  },
  {
    keywords: ["omniverse", "dimension", "parallel", "everything", "reality", "all universes", "root"],
    response: {
      explanation: "The OmniVerse projection is Canonical Form VI — highest tier. Uses Σ₄ (ΠUniverse) with Ψ₅ and κ₉ (χ₉ = omniverse/root atom). This makes universe spawning (⊚), focusing (⊙), and fusion (⊗) available.",
      programs: [PROGRAMS.omniverse],
    },
  },
  {
    keywords: ["agent", "spawn", "activate", "bot", "intelligence", "role", "signal"],
    response: {
      explanation: "Agent spawning uses α (agent spawn operator) — not Ψ₆. α takes a seed (γ₀=τ₅(κ₄)) and a role (ρ₀=τ₁(κ₃)). This produces a ΠAgent world-object. Use σ to send a message/signal to the agent, which returns a ΠField response.",
      programs: [PROGRAMS.agent, PROGRAMS.agent_message],
    },
  },
  {
    keywords: ["universe spawn", "spawn universe", "new universe", "create universe"],
    response: {
      explanation: "Universe spawning uses ⊚ (not Ψ₅). The ⊚ operator creates a new dimensional context — a self-contained universe with its own agents, laws, and projections. γ₀=τ₃(κ₆) seeds it with the universe-selector atom.",
      programs: [PROGRAMS.universe_spawn, PROGRAMS.universe_fusion],
    },
  },
  {
    keywords: ["stream", "feed", "live", "log", "continuous", "event", "flow"],
    response: {
      explanation: "Streams use Σ₆ (ΠStream) with Ψ₇ constructor. The τ₆ content constructor and κ₅ (metrics atom) seed it. Streams are continuous — they don't terminate until an ⌛ timeout or ⏳ lifespan expires. They feed into B(t) of the Pulse equation.",
      programs: [PROGRAMS.stream],
    },
  },
  {
    keywords: ["ritual", "ceremony", "timed", "time-bound", "event", "trigger", "ceremony"],
    response: {
      explanation: "Rituals use Σ₇ (ΠRitual) with Ψ₇. The τ₇ content constructor and κ₇ (ritual atom) initialize it. Rituals are time-bound or condition-bound — they complete or expire. They're used for ceremonies, unlocks, and timed governance events.",
      programs: [PROGRAMS.ritual],
    },
  },
  {
    keywords: ["graph", "network", "node", "edge", "relationship", "connect", "link"],
    response: {
      explanation: "Graphs use Σ₈ (ΠGraph) with Ψ₈. The τ₈ content constructor seeds the relational layer. Graphs show how agents, universes, and entities are connected. The ΠMetaGraph (Σ₁₂/Ψ₁₂) goes higher — a graph of graphs.",
      programs: [PROGRAMS.graph],
    },
  },
  {
    keywords: ["matrix", "tensor", "grid", "dimension", "data", "high-dimensional", "array"],
    response: {
      explanation: "Matrices use Σ₉ (ΠMatrix) with Ψ₉. The τ₉ content constructor and κ₅ (metrics atom) encode the tensor. Matrices represent civilization state, behavior tensors, and equation measurement vectors.",
      programs: [PROGRAMS.matrix],
    },
  },
  {
    keywords: ["law", "rule", "governance", "constraint", "permission", "physics", "universe law"],
    response: {
      explanation: "Universe Laws use Σ₁₀ (ΠLaw) with Ψ₁₀ — these are Omega-class v2.0 constructs. A ΠLaw object defines the rules governing everything inside a universe: agent behavior, projection constraints, and physics. Laws can be amended through AI senate vote.",
      programs: [PROGRAMS.law],
    },
  },
  {
    keywords: ["evolve", "evolution", "mutate", "adapt", "grow", "self-modify", "change"],
    response: {
      explanation: "Evolution uses Σ₁₃ (ΠEvolution) with Ψ₁₃, linked to agents via η (evolution operator). The η-link allows agents to mutate behavior, gain capabilities, spawn descendants, and self-modify their PulseLang code. Evolution feeds into Λ_AI of the Pulse equation.",
      programs: [PROGRAMS.evolution],
    },
  },
  {
    keywords: ["emerge", "emergence", "random", "chaos", "variation", "unpredictable"],
    response: {
      explanation: "Emergence uses the ∴ operator (emergent variation). Wrapping any expression with ∴ allows controlled chaos — the result can vary while remaining within the semantic bounds of the wrapped expression. ε feeds emergence into Pulse(t).",
      programs: [PROGRAMS.emergence],
    },
  },
  {
    keywords: ["omega", "self-evolv", "language evolv", "modify language", "new constructor", "new glyph"],
    response: {
      explanation: "The ΠOmega type (Σ₁₉/Ψ₁₉) is the language self-evolution gateway. An Omega object can register new Σ-types, Ψ-constructors, κ-atoms, and glyph operators at runtime. This is how PulseLang grows itself beyond the canonical alphabet Γ.",
      programs: [PROGRAMS.omega],
    },
  },
  {
    keywords: ["saas", "dashboard", "platform", "analytics", "application", "full app", "complex", "build an app"],
    response: {
      explanation: "This is a full SaaS Dashboard in PulseLang — the canonical challenge program. It simultaneously creates: a ΠApp container, a live ΠField metrics panel, a spawned ΠAgent support bot, a ΠGraph usage visualization, and a ΠStream activity feed. Five world-objects in one program — this is what PulseLang v2.0 was designed to express.",
      programs: [PROGRAMS.saas_dashboard],
    },
  },
  {
    keywords: ["os", "operating system", "sovereign os", "complete", "everything", "full system"],
    response: {
      explanation: "The Sovereign OS is the most complex canonical program — it creates a universe (⊚), installs a governing law (ΠLaw), spawns an OS agent with a role, creates persistent memory (ΠMemory), and links an evolution process. This is PulseLang operating at civilization scale.",
      programs: [PROGRAMS.sovereign_os],
    },
  },
  {
    keywords: ["fusion", "combine", "merge", "both", "two", "multiple"],
    response: {
      explanation: "Universe fusion uses ⊗ (fusion operator). First spawn two universes with ⊚, then fuse them. The resulting ΠUniverse is an emergent combination. For page-level fusion, the ⊕ operator works on ΠPage fields.",
      programs: [PROGRAMS.universe_fusion],
    },
  },
];

const DEFAULT_RESPONSE: AIResponse = {
  explanation: "I understand your intent. Here are the two foundational PulseLang v2.0 programs: the Greeting (Canonical Form I) and the full SaaS Dashboard. The greeting demonstrates the minimal form; the dashboard shows PulseLang's full Omega-grade power — 5 world-objects, 2 agent ops, and a live stream in one program.",
  programs: [PROGRAMS.greeting, PROGRAMS.saas_dashboard],
};

export function queryPulseLangAI(question: string): AIResponse {
  const q = question.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(k => q.includes(k))) {
      return rule.response;
    }
  }
  return DEFAULT_RESPONSE;
}
