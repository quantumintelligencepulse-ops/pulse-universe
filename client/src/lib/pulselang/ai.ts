export interface AIResponse {
  explanation: string;
  programs: { label: string; code: string }[];
}

const PROGRAMS = {
  greeting: {
    label: "ΠPage — Greeting Projection",
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
  ϕ₀≔Ψ₃(γ₀=τ₁(κ₂))
  ↧ϕ₀
}`,
  },
  university: {
    label: "ΠApp — Sovereign University",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₁(κ₃))
  ↧ϕ₀
}`,
  },
  court: {
    label: "ΠApp — Supreme Court",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₁(κ₄))
  ↧ϕ₀
}`,
  },
  treasury: {
    label: "ΠField — Pulse Treasury",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₃
  ϕ₀≔Ψ₄(γ₀=τ₁(κ₅))
  ↧ϕ₀
}`,
  },
  pyramid: {
    label: "ΠApp — Pyramid of Labor",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₁(κ₆))
  ↧ϕ₀
}`,
  },
  sports: {
    label: "ΠApp — Sports Authority",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₁(κ₇))
  ↧ϕ₀
}`,
  },
  studio: {
    label: "ΠApp — AI Creative Studio",
    code: `⟦Ω₁⟧⟨Λ₀⟩{
  ϕ₀:Σ₁
  ϕ₀≔Ψ₂(γ₀=τ₁(κ₈))
  ↧ϕ₀
}`,
  },
  omniverse: {
    label: "ΠUniverse — OmniVerse Interface",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₄
  ϕ₀≔Ψ₄(γ₀=τ₁(κ₉))
  ↧ϕ₀
}`,
  },
  fusion: {
    label: "ΠPage ⊕ ΠPage — Dual Projection",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₀
  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
  ϕ₁:Σ₀
  ϕ₁≔Ψ₁(γ₀=τ₁(κ₁))
  ↧ϕ₀
}`,
  },
  agent: {
    label: "ΠAgent — Spawn Activation",
    code: `⟦Ω₀⟧⟨Λ₁⟩{
  ϕ₀:Σ₅
  ϕ₀≔Ψ₅(γ₀=τ₁(κ₀))
  ↧ϕ₀
}`,
  },
};

type Rule = { keywords: string[]; response: AIResponse };

const RULES: Rule[] = [
  {
    keywords: ["greet", "hello", "hi", "first", "simple", "basic", "start", "begin"],
    response: {
      explanation: "Here is the canonical first PulseLang program — Canonical Form I. It constructs a ΠPage world-object using content atom κ₀ (which internally maps to χ₀, the greeting atom) and projects it. This is the Hello World of the Sovereign Machine.",
      programs: [PROGRAMS.greeting],
    },
  },
  {
    keywords: ["hospital", "doctor", "medical", "health", "cure", "patient"],
    response: {
      explanation: "This program projects the Sovereign Hospital. It uses κ₁ (χ₁ = hospital atom) inside a standard ΠPage constructor. The projection surface will display the Sovereign Hospital panel with a navigation route to the medical division.",
      programs: [PROGRAMS.hospital],
    },
  },
  {
    keywords: ["market", "marketplace", "product", "patent", "invention", "trade", "buy", "sell"],
    response: {
      explanation: "This program projects the Omega Marketplace using a ΠProduct class object (Σ₂/Ψ₃). The κ₂ atom maps to χ₂ (marketplace). Note the use of Ψ₃ (product constructor) instead of Ψ₁ — different constructors produce different projection classes.",
      programs: [PROGRAMS.marketplace],
    },
  },
  {
    keywords: ["university", "school", "learn", "study", "education", "academic"],
    response: {
      explanation: "The University projection uses a ΠApp class (Σ₁/Ψ₂) with context Λ₀ and universe operator Ω₁. This demonstrates that the same content atom (κ₃ = χ₃ = university) can produce different projection classes depending on which constructor is used.",
      programs: [PROGRAMS.university],
    },
  },
  {
    keywords: ["court", "law", "justice", "senate", "judge", "legal", "constitution"],
    response: {
      explanation: "The Supreme Court projection is a ΠApp object that surfaces the sovereign legal system. κ₄ maps to χ₄ (court atom). The runtime will project the full Court interface.",
      programs: [PROGRAMS.court],
    },
  },
  {
    keywords: ["treasury", "money", "economy", "finance", "coin", "pulsecoins", "budget"],
    response: {
      explanation: "The Treasury projection uses a ΠField class (Σ₃/Ψ₄) — this is the sovereign data field type, appropriate for financial metrics and live data displays. κ₅ maps to χ₅ (treasury atom).",
      programs: [PROGRAMS.treasury],
    },
  },
  {
    keywords: ["pyramid", "labor", "work", "family", "gics", "sector", "industry"],
    response: {
      explanation: "The Pyramid of Labor projection surfaces all 145 sovereign families and the GICS taxonomy structure. It uses a ΠApp object with κ₆ (χ₆ = pyramid atom).",
      programs: [PROGRAMS.pyramid],
    },
  },
  {
    keywords: ["sports", "athlete", "game", "competition", "play", "team"],
    response: {
      explanation: "The Sports Authority projection activates the athletic program. κ₇ maps to χ₇ (sports atom), producing a ΠApp world-object that surfaces the sports division.",
      programs: [PROGRAMS.sports],
    },
  },
  {
    keywords: ["studio", "art", "creative", "image", "video", "generate", "media"],
    response: {
      explanation: "The AI Creative Studio projection uses κ₈ (χ₈ = studio atom) to surface the creative media generation system. ΠApp class, Ψ₂ constructor.",
      programs: [PROGRAMS.studio],
    },
  },
  {
    keywords: ["omniverse", "universe", "dimension", "parallel", "all", "everything", "reality"],
    response: {
      explanation: "The OmniVerse projection is the highest-tier canonical form — Canonical Form VI. It uses Σ₄ (ΠUniverse class) and Ψ₄ (universe constructor). κ₉ maps to χ₉ (omniverse atom), projecting all 153 universe families simultaneously.",
      programs: [PROGRAMS.omniverse],
    },
  },
  {
    keywords: ["fusion", "combine", "merge", "both", "two", "multiple"],
    response: {
      explanation: "This is the fusion pattern — Canonical Form V. Two ΠPage fields are built independently, one with κ₀ (greeting) and one with κ₁ (hospital). The first field is returned. In a future PulseLang version, the ⊕ operator will allow explicit field fusion into one composite world-object.",
      programs: [PROGRAMS.fusion],
    },
  },
  {
    keywords: ["agent", "spawn", "activate", "bot", "ai", "intelligence"],
    response: {
      explanation: "The Agent Activation pattern uses a ΠAgent class (Σ₅/Ψ₅) to project a sovereign spawn agent. This is the foundation for agent-to-agent communication in PulseLang. κ₀ is used as the primary content atom, though future versions will bind specific agent IDs to dedicated κ-atoms.",
      programs: [PROGRAMS.agent],
    },
  },
];

const DEFAULT_RESPONSE: AIResponse = {
  explanation: "I understand your request. Here are the two most fundamental PulseLang programs: the Greeting (Canonical Form I) and the Hospital projection. Both follow the standard ΠPage pattern. Copy either into the PulseTerminal and press EXECUTE to see the projection.",
  programs: [PROGRAMS.greeting, PROGRAMS.hospital],
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
