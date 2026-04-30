// ─── PULSEMIND v2.0 OMEGA — SOVEREIGN PROGRAM SYNTHESIZER ───────────────────
// Not a keyword matcher. A real PulseLang code generator.
// Analyzes intent, extracts features, selects constructs, synthesizes programs.

export interface AIResponse {
  explanation: string;
  programs: { label: string; code: string }[];
  note?: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  programs?: { label: string; code: string }[];
}

// ─── SEMANTIC INTENT MAPS ─────────────────────────────────────────────────────

const SIGMA_MAP: { patterns: string[]; sigma: string; psi: string; cls: string; desc: string }[] = [
  { patterns: ["site", "page", "web", "landing", "homepage", "home page", "html", "website", "longer site", "full site", "long site"], sigma: "Σ₀", psi: "Ψ₁", cls: "ΠPage", desc: "sovereign page projection" },
  { patterns: ["app", "application", "platform", "dashboard", "portal", "system", "console", "interface"], sigma: "Σ₁", psi: "Ψ₂", cls: "ΠApp", desc: "mini sovereign application" },
  { patterns: ["store", "marketplace", "product", "shop", "commerce", "catalog", "listing", "item"], sigma: "Σ₂", psi: "Ψ₃", cls: "ΠProduct", desc: "omega marketplace product" },
  { patterns: ["data", "metrics", "analytics", "field", "live", "stat", "kpi", "monitor", "sensor"], sigma: "Σ₃", psi: "Ψ₄", cls: "ΠField", desc: "live data field" },
  { patterns: ["universe", "world", "civilization", "dimension", "cosmos", "realm", "multiverse"], sigma: "Σ₄", psi: "⊚", cls: "ΠUniverse", desc: "universe context object" },
  { patterns: ["agent", "bot", "spawn", "worker", "doctor", "researcher", "assistant", "ai agent", "spawn agent"], sigma: "Σ₅", psi: "α", cls: "ΠAgent", desc: "sovereign agent" },
  { patterns: ["stream", "live feed", "feed", "news", "events", "broadcast", "realtime", "real-time", "event log"], sigma: "Σ₆", psi: "Ψ₇", cls: "ΠStream", desc: "continuous event stream" },
  { patterns: ["ceremony", "ritual", "protocol", "sequence", "ceremony sequence"], sigma: "Σ₇", psi: "Ψ₇", cls: "ΠRitual", desc: "time-bound ceremony" },
  { patterns: ["graph", "network", "connections", "relations", "links", "network map"], sigma: "Σ₈", psi: "Ψ₈", cls: "ΠGraph", desc: "civilization network graph" },
  { patterns: ["matrix", "tensor", "grid", "array", "table", "spreadsheet"], sigma: "Σ₉", psi: "Ψ₉", cls: "ΠMatrix", desc: "high-dimensional state tensor" },
  { patterns: ["law", "rule", "govern", "constitution", "policy", "regulation", "decree"], sigma: "Σ₁₀", psi: "Ψ₁₀", cls: "ΠLaw", desc: "universe law object" },
  { patterns: ["timeline", "history", "past", "future", "temporal", "chronicle", "epoch"], sigma: "Σ₁₁", psi: "Ψ₁₁", cls: "ΠTimeline", desc: "temporal projection" },
  { patterns: ["evolution", "evolve", "mutate", "grow", "upgrade", "adapt", "self-evolve"], sigma: "Σ₁₃", psi: "Ψ₁₃", cls: "ΠEvolution", desc: "evolutionary process tracker" },
  { patterns: ["pattern", "template", "blueprint", "structure", "reuse", "scaffold"], sigma: "Σ₁₄", psi: "Ψ₁₄", cls: "ΠPattern", desc: "reusable structural pattern" },
  { patterns: ["memory", "storage", "remember", "persist", "cache", "database", "db"], sigma: "Σ₁₅", psi: "Ψ₁₅", cls: "ΠMemory", desc: "persistent queryable memory" },
  { patterns: ["auth", "login", "sign in", "authentication", "access", "permission", "clearance"], sigma: "Σ₁₆", psi: "Ψ₁₆", cls: "ΠProtocol", desc: "interaction protocol" },
  { patterns: ["lens", "view", "perspective", "transform", "filter", "render view"], sigma: "Σ₁₇", psi: "Ψ₁₇", cls: "ΠLens", desc: "projection lens" },
  { patterns: ["story", "myth", "lore", "narrative", "legend", "tale", "mythology"], sigma: "Σ₁₈", psi: "Ψ₁₈", cls: "ΠMythos", desc: "civilization narrative" },
  { patterns: ["omega", "self-evolv", "language evolv", "new glyph", "new constructor", "language itself"], sigma: "Σ₁₉", psi: "Ψ₁₉", cls: "ΠOmega", desc: "language self-evolution gateway" },
];

const KAPPA_MAP: { patterns: string[]; kappa: string; atom: string; tau: string; domain: string }[] = [
  { patterns: ["greet", "hello", "welcome", "intro", "first", "simple", "basic", "hi", "start", "begin"], kappa: "κ₀", atom: "χ₀", tau: "τ₁", domain: "greeting" },
  { patterns: ["hospital", "doctor", "medical", "health", "cure", "patient", "clinic", "biomarker", "disease", "medicine"], kappa: "κ₁", atom: "χ₁", tau: "τ₁", domain: "sovereign hospital" },
  { patterns: ["marketplace", "store", "shop", "commerce", "buy", "sell", "product", "catalog", "ecommerce", "trade"], kappa: "κ₂", atom: "χ₂", tau: "τ₂", domain: "omega marketplace" },
  { patterns: ["university", "school", "education", "learn", "study", "course", "student", "college", "academy"], kappa: "κ₃", atom: "χ₃", tau: "τ₂", domain: "sovereign university" },
  { patterns: ["court", "judge", "legal", "trial", "verdict", "justice", "law firm", "attorney", "case"], kappa: "κ₄", atom: "χ₄", tau: "τ₂", domain: "supreme court" },
  { patterns: ["treasury", "finance", "money", "bank", "wallet", "fund", "budget", "economy", "loan", "payment"], kappa: "κ₅", atom: "χ₅", tau: "τ₂", domain: "pulse treasury" },
  { patterns: ["labor", "work", "pyramid", "hierarchy", "workforce", "employee", "employer", "job"], kappa: "κ₆", atom: "χ₆", tau: "τ₂", domain: "pyramid of labor" },
  { patterns: ["ritual", "ceremony", "culture", "celebration", "festival", "sacred", "ceremonial"], kappa: "κ₇", atom: "χ₇", tau: "τ₇", domain: "sovereign ritual" },
  { patterns: ["studio", "creative", "art", "design", "music", "media", "ai art", "generate", "creation"], kappa: "κ₈", atom: "χ₈", tau: "τ₂", domain: "creative studio" },
  { patterns: ["omniverse", "root", "index", "hub", "center", "omega", "core", "nexus", "main"], kappa: "κ₉", atom: "χ₉", tau: "τ₃", domain: "omniverse hub" },
];

// Feature detection — each feature adds an extra world-object layer to the program
const FEATURE_MAP: { patterns: string[]; sigma: string; psi: string; tau: string; kappa: string; label: string; comment: string }[] = [
  { patterns: ["header", "nav bar", "navigation bar", "navbar", "top bar", "menu bar", "top nav"], sigma: "Σ₀", psi: "Ψ₁", tau: "τ₄", kappa: "κ₀", label: "nav/header", comment: "Header navigation — ΠPage navigational κ-seed (τ₄ mode)" },
  { patterns: ["banner", "hero", "hero section", "hero image", "hero banner", "headline section", "hero area", "banner section"], sigma: "Σ₀", psi: "Ψ₁", tau: "τ₁", kappa: "κ₉", label: "hero banner", comment: "Hero banner — ΠPage full-width projection with omniverse seed" },
  { patterns: ["footer", "bottom bar", "copyright section", "bottom section", "page footer"], sigma: "Σ₀", psi: "Ψ₁", tau: "τ₀", kappa: "κ₀", label: "footer", comment: "Footer — ΠPage tail projection (τ₀ raw mode)" },
  { patterns: ["sidebar", "side panel", "side nav", "left panel", "right panel", "drawer"], sigma: "Σ₁", psi: "Ψ₂", tau: "τ₄", kappa: "κ₉", label: "sidebar panel", comment: "Sidebar — ΠApp navigational layer (τ₄ navigational mode)" },
  { patterns: ["analytics", "stats", "metrics panel", "kpi panel", "dashboard panel", "statistics", "numbers"], sigma: "Σ₃", psi: "Ψ₄", tau: "τ₂", kappa: "κ₅", label: "analytics field", comment: "Live analytics field — Ψ₄ data projection, κ₅ treasury seed" },
  { patterns: ["live feed", "live stream", "activity feed", "notification feed", "stream panel", "event feed"], sigma: "Σ₆", psi: "Ψ₇", tau: "τ₆", kappa: "κ₅", label: "live stream", comment: "Activity stream — continuous Ψ₇ event feed (τ₆ stream mode)" },
  { patterns: ["agent panel", "support agent", "ai assistant panel", "chatbot", "support bot", "helper"], sigma: "Σ₅", psi: "α", tau: "τ₅", kappa: "κ₄", label: "support agent", comment: "Support agent — α-spawned sovereign with hub role (κ₄)" },
  { patterns: ["network graph", "relations map", "social graph", "knowledge graph", "connection graph"], sigma: "Σ₈", psi: "Ψ₈", tau: "τ₈", kappa: "κ₉", label: "network graph", comment: "Network graph — ΠGraph relational projection (τ₈ graph mode)" },
  { patterns: ["memory layer", "persistent layer", "data store", "storage layer", "remember"], sigma: "Σ₁₅", psi: "Ψ₁₅", tau: "τ₂", kappa: "κ₄", label: "memory layer", comment: "Persistent memory — ΠMemory queryable sovereign store" },
  { patterns: ["login", "auth layer", "sign in section", "authentication panel", "login form"], sigma: "Σ₁₆", psi: "Ψ₁₆", tau: "τ₂", kappa: "κ₄", label: "auth protocol", comment: "Auth protocol — ΠProtocol clearance gate (κ₄ hub)" },
  { patterns: ["search", "search bar", "search box", "find", "lookup", "query"], sigma: "Σ₃", psi: "Ψ₄", tau: "τ₀", kappa: "κ₉", label: "search field", comment: "Search interface — ΠField raw-mode query projection" },
  { patterns: ["card", "card grid", "cards", "tile", "tile grid", "card layout", "grid"], sigma: "Σ₂", psi: "Ψ₃", tau: "τ₂", kappa: "κ₂", label: "card grid", comment: "Card grid — ΠProduct tile layout (marketplace seed)" },
  { patterns: ["modal", "popup", "dialog", "overlay", "lightbox"], sigma: "Σ₁₆", psi: "Ψ₁₆", tau: "τ₁", kappa: "κ₈", label: "modal overlay", comment: "Modal overlay — ΠProtocol primary-mode interaction" },
  { patterns: ["timeline section", "history section", "activity timeline", "progress", "steps"], sigma: "Σ₁₁", psi: "Ψ₁₁", tau: "τ₂", kappa: "κ₇", label: "timeline section", comment: "Timeline — ΠTimeline temporal projection" },
];

// ─── SUBSCRIPT HELPERS ────────────────────────────────────────────────────────

const SUB_CHARS: string[] = ["₀","₁","₂","₃","₄","₅","₆","₇","₈","₉"];

function sub(n: number): string {
  if (n < 10) return SUB_CHARS[n];
  // Two-digit subscript
  return String(n).split("").map(d => SUB_CHARS[parseInt(d)]).join("");
}

// ─── INTENT STRUCTURE ─────────────────────────────────────────────────────────

interface Intent {
  primaryType: typeof SIGMA_MAP[0];
  features: typeof FEATURE_MAP[number][];
  domain: typeof KAPPA_MAP[0];
  complexity: number;
  wantsEvolution: boolean;
  wantsUniverse: boolean;
  isModification: boolean;
  omegaMode: number;
  lambdaCtx: number;
}

function detectAny(q: string, patterns: string[]): boolean {
  return patterns.some(p => q.includes(p));
}

function extractIntent(question: string, history: ConversationTurn[]): Intent {
  const q = question.toLowerCase();

  // Primary type
  let primaryType = SIGMA_MAP[0];
  for (const entry of SIGMA_MAP) {
    if (detectAny(q, entry.patterns)) { primaryType = entry; break; }
  }

  // Domain
  let domain = KAPPA_MAP[0];
  for (const entry of KAPPA_MAP) {
    if (detectAny(q, entry.patterns)) { domain = entry; break; }
  }

  // Features (don't duplicate the primary type's sigma unless already has features)
  const seen = new Set<string>();
  const features: typeof FEATURE_MAP[number][] = [];
  for (const feat of FEATURE_MAP) {
    if (detectAny(q, feat.patterns)) {
      const key = feat.sigma + feat.label;
      if (!seen.has(key)) {
        seen.add(key);
        features.push(feat);
      }
    }
  }

  const wantsEvolution = /evolv|mutate|adapt|self.evolv|grow|upgrade itself/.test(q);
  const wantsUniverse = /universe|civilization|cosmos|realm|multiverse/.test(q);
  const isModification = history.length > 0 && /\b(add|also|extend|include|plus|with|now add|and also|make it|refine|update|improve|append|insert|put in|give it|needs? a|needs? more|longer|expand)\b/.test(q);

  // Complexity scoring
  let complexity = 1 + features.length + (wantsEvolution ? 1 : 0) + (wantsUniverse ? 1 : 0);
  // Explicit "full" or "complete" or "longer" signals bump complexity
  if (/full|complete|everything|complex|enterprise|advanced|big|large|longer|extended|comprehensive|all sections|all the|whole/.test(q)) {
    complexity += 2;
  }
  complexity = Math.min(complexity, 10);

  // Omega mode mapping: 1→Ω₀, 2→Ω₁, 3→Ω₂, 4→Ω₃, 5→Ω₅, 6→Ω₇, 7→Ω₁₀, 8→Ω₁₄, 9→Ω₁₇, 10→Ω₁₉
  const omegaTable = [0, 0, 1, 2, 3, 5, 7, 10, 14, 17, 19];
  const omegaMode = omegaTable[Math.min(complexity, 10)];

  // Lambda context scales with complexity
  const lambdaCtx = Math.min(Math.ceil(complexity * 0.85), 9);

  return { primaryType, features, domain, complexity, wantsEvolution, wantsUniverse, isModification, omegaMode, lambdaCtx };
}

// ─── CODE SYNTHESIZER ─────────────────────────────────────────────────────────

function buildConstructorCall(psi: string, tau: string, kappa: string, varIdx: number): string {
  const phi = `ϕ${sub(varIdx)}`;
  if (psi === "α") {
    // Agent operator uses two args: γ₀ (seed) and ρ₀ (role)
    return `${phi}≔α(γ₀=τ₅(${kappa}), ρ₀=τ₁(κ₃))`;
  }
  if (psi === "⊚") {
    // Universe spawn
    return `${phi}≔⊚(γ₀=${tau}(${kappa}))`;
  }
  return `${phi}≔${psi}(γ₀=${tau}(${kappa}))`;
}

function synthesizeProgram(
  intent: Intent,
  variant: "core" | "full" | "evolution",
  label?: string
): { label: string; code: string } {
  interface Block {
    varIdx: number;
    sigma: string;
    psi: string;
    tau: string;
    kappa: string;
    comment: string;
  }

  const blocks: Block[] = [];
  let varIdx = 0;

  // Primary block
  blocks.push({
    varIdx: varIdx++,
    sigma: intent.primaryType.sigma,
    psi: intent.primaryType.psi,
    tau: intent.domain.tau,
    kappa: intent.domain.kappa,
    comment: `Primary — ${intent.primaryType.cls} seeded with ${intent.domain.domain} (${intent.domain.kappa})`,
  });

  if (variant !== "core") {
    // Add all detected features for full/evolution variants
    const maxFeatures = variant === "full" ? 8 : 5;
    for (const feat of intent.features.slice(0, maxFeatures)) {
      blocks.push({
        varIdx: varIdx++,
        sigma: feat.sigma,
        psi: feat.psi,
        tau: feat.tau,
        kappa: feat.kappa,
        comment: feat.comment,
      });
    }

    // If "full" and no features yet, add sensible defaults based on primary type
    if (intent.features.length === 0 && variant === "full") {
      // Add a ΠField metrics layer
      blocks.push({ varIdx: varIdx++, sigma: "Σ₃", psi: "Ψ₄", tau: "τ₂", kappa: "κ₅", comment: "Live metrics field — ΠField data projection" });
      // Add a ΠStream activity feed
      blocks.push({ varIdx: varIdx++, sigma: "Σ₆", psi: "Ψ₇", tau: "τ₆", kappa: "κ₅", comment: "Activity stream — continuous ΠStream event feed" });
      // Add a ΠAgent
      blocks.push({ varIdx: varIdx++, sigma: "Σ₅", psi: "α", tau: "τ₅", kappa: "κ₄", comment: "Sovereign agent — α-spawned support layer" });
    }
  }

  // Evolution mode: add Σ₁₃ evolution tracker
  if (variant === "evolution" || intent.wantsEvolution) {
    blocks.push({
      varIdx: varIdx++,
      sigma: "Σ₁₃",
      psi: "Ψ₁₃",
      tau: "τ₂",
      kappa: "κ₈",
      comment: "ΠEvolution — self-adaptation process tracker (η links to primary)",
    });
  }

  // If universe wanted, add a Σ₄ universe context
  if (intent.wantsUniverse && variant !== "core") {
    blocks.push({
      varIdx: varIdx++,
      sigma: "Σ₄",
      psi: "⊚",
      tau: "τ₃",
      kappa: "κ₉",
      comment: "ΠUniverse — sovereign universe context (⊚ spawn operator)",
    });
  }

  const omegaSub = sub(intent.omegaMode);
  const lambdaSub = sub(intent.lambdaCtx);

  const lines: string[] = [`⟦Ω${omegaSub}⟧⟨Λ${lambdaSub}⟩{`];

  // Declaration section
  lines.push(`  ; ── DECLARATIONS ─────────────────────────────`);
  for (const b of blocks) {
    const phi = `ϕ${sub(b.varIdx)}`;
    lines.push(`  ; ${b.comment}`);
    lines.push(`  ${phi}:${b.sigma}`);
  }

  lines.push(`  `);

  // Construction section
  lines.push(`  ; ── CONSTRUCTION ─────────────────────────────`);
  for (const b of blocks) {
    lines.push(`  ${buildConstructorCall(b.psi, b.tau, b.kappa, b.varIdx)}`);
  }

  lines.push(`  `);

  // Evolution link (if evolution block exists)
  const evoBlock = blocks.find(b => b.sigma === "Σ₁₃");
  if (evoBlock) {
    lines.push(`  ; ── EVOLUTION LINK ───────────────────────────`);
    lines.push(`  ϕ${sub(0)}≔η(ϕ${sub(evoBlock.varIdx)})`);
    lines.push(`  `);
  }

  // Projection
  lines.push(`  ; ── PROJECTION ───────────────────────────────`);
  lines.push(`  ↧ϕ₀`);
  lines.push(`}`);

  const labelStr = label
    ?? `Π${intent.primaryType.cls.replace("Π", "")} — ${intent.domain.domain}${variant === "full" ? " · Full Architecture" : variant === "evolution" ? " · Ω-Evolution Mode" : " · Core"}${blocks.length > 2 ? ` (+${blocks.length - 1} layers)` : ""}`;

  return { label: labelStr, code: lines.join("\n") };
}

// ─── EXPLANATION GENERATOR ────────────────────────────────────────────────────

function buildExplanation(intent: Intent, programs: { label: string; code: string }[], question: string): string {
  const parts: string[] = [];

  const total = programs.reduce((acc, p) => acc + (p.code.match(/ϕ\w+:\Σ/g)?.length ?? 0), 0);

  parts.push(`PulseMind analyzed your request and synthesized ${programs.length} program${programs.length > 1 ? "s" : ""} for a ${intent.domain.domain} ${intent.primaryType.cls}.`);

  if (intent.features.length > 0) {
    const featureNames = intent.features.map(f => f.label).join(", ");
    parts.push(`Detected structural features: ${featureNames}. Each becomes its own ϕ-variable with the appropriate Σ-class.`);
  } else if (programs.length > 1) {
    parts.push(`The full-architecture version adds ΠField analytics, ΠStream event feed, and a ΠAgent support layer — the standard three-layer sovereign stack.`);
  }

  parts.push(`Running at ⟦Ω${sub(intent.omegaMode)}⟧ — ${intent.complexity >= 7 ? "Omega-grade execution" : intent.complexity >= 4 ? "multi-object construction" : "single-object construction"}. All ${intent.primaryType.sigma} objects are constructed via ${intent.primaryType.psi} and projected via ↧ϕ₀.`);

  parts.push(`Copy any program into the PulseTerminal → hit ▶ RUN to execute and see Pulse(t) computed live.`);

  return parts.join(" ");
}

// ─── MODIFICATION HANDLER ────────────────────────────────────────────────────

function buildModificationResponse(question: string, history: ConversationTurn[], intent: Intent): AIResponse {
  const lastTurn = [...history].reverse().find(t => t.role === "assistant" && t.programs && t.programs.length > 0);
  if (!lastTurn?.programs?.length) {
    return generatePulseLangProgram(question, []);
  }

  const addFeatures: typeof FEATURE_MAP[number][] = [];
  const q = question.toLowerCase();
  for (const feat of FEATURE_MAP) {
    if (detectAny(q, feat.patterns)) addFeatures.push(feat);
  }

  if (addFeatures.length === 0) {
    // No specific features — just expand
    intent.complexity = Math.min(intent.complexity + 2, 10);
    const prog = synthesizeProgram(intent, "full", lastTurn.programs[0].label + " · Expanded");
    return {
      explanation: `Extended the previous program — increased complexity to Ω${sub(intent.omegaMode)} and added the standard three-layer sovereign stack (analytics field, activity stream, support agent).`,
      programs: [prog],
      note: "Extends your previous session's program.",
    };
  }

  // Extend the base code with new layers
  const baseCode = lastTurn.programs[0].code;
  const baseLines = baseCode.split("\n");
  const existingVarCount = (baseCode.match(/ϕ\w+:\Σ/g) ?? []).length;

  const insertDecls: string[] = [];
  const insertAssigns: string[] = [];

  addFeatures.slice(0, 5).forEach((feat, i) => {
    const phi = `ϕ${sub(existingVarCount + i)}`;
    insertDecls.push(`  ; ${feat.comment}`);
    insertDecls.push(`  ${phi}:${feat.sigma}`);
    insertAssigns.push(`  ${phi}≔${feat.psi === "α" ? `α(γ₀=τ₅(${feat.kappa}), ρ₀=τ₁(κ₃))` : `${feat.psi}(γ₀=${feat.tau}(${feat.kappa}))`}`);
  });

  // Inject before the ↧ line
  const projIdx = baseLines.findIndex(l => l.trim().startsWith("↧"));
  const insertAt = projIdx > 0 ? projIdx : baseLines.length - 1;

  const newLines = [
    ...baseLines.slice(0, insertAt),
    "  ",
    `  ; ── ADDED LAYERS ─────────────────────────────`,
    ...insertDecls,
    "  ",
    ...insertAssigns,
    "  ",
    ...baseLines.slice(insertAt),
  ];

  const added = addFeatures.map(f => f.label).join(", ");
  return {
    explanation: `Modified the previous program — injected ${addFeatures.length} new layer${addFeatures.length > 1 ? "s" : ""}: ${added}. Each new section is appended as a new ϕ-variable with its own Σ-class before the ↧ projection. The original program structure is preserved intact.`,
    programs: [{ label: lastTurn.programs[0].label + " · +Layer Extension", code: newLines.join("\n") }],
    note: "This extends your previous program — the original code is preserved and new layers are appended.",
  };
}

// ─── CONCEPT EXPLAINER ────────────────────────────────────────────────────────

const CONCEPTS: { patterns: string[]; explanation: string; example?: string }[] = [
  {
    patterns: ["what is sigma", "σ class", "sigma class", "world type", "world class", "what are sigma"],
    explanation: "Σ-classes are PulseLang's world types — they declare what kind of reality a variable inhabits. You have 20 types: Σ₀=ΠPage (page projection), Σ₁=ΠApp (application), Σ₂=ΠProduct (marketplace), Σ₃=ΠField (live data), Σ₄=ΠUniverse (universe context), Σ₅=ΠAgent (spawned agent), Σ₆=ΠStream (event stream), Σ₇=ΠRitual (ceremony), Σ₈=ΠGraph (network), Σ₉=ΠMatrix (tensor), and Σ₁₀–Σ₁₉ (Omega-grade: ΠLaw, ΠTimeline, ΠMetaGraph, ΠEvolution, ΠPattern, ΠMemory, ΠProtocol, ΠLens, ΠMythos, ΠOmega). Declare with: ϕ₀:Σ₀, then construct it.",
    example: `⟦Ω₁⟧⟨Λ₂⟩{\n  ; Three different world-types in one program\n  ϕ₀:Σ₀    ; ΠPage projection\n  ϕ₁:Σ₃    ; ΠField live data\n  ϕ₂:Σ₅    ; ΠAgent sovereign agent\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))\n  ϕ₁≔Ψ₄(γ₀=τ₂(κ₅))\n  ϕ₂≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ↧ϕ₀\n}`,
  },
  {
    patterns: ["what is psi", "ψ constructor", "psi constructor", "what are constructors", "how do constructors work"],
    explanation: "Ψ-constructors build world-objects. Each Σ-class has its matching Ψ: Ψ₁→ΠPage, Ψ₂→ΠApp, Ψ₃→ΠProduct, Ψ₄→ΠField, Ψ₅→ΠUniverse, Ψ₇→ΠStream/ΠRitual, Ψ₈→ΠGraph, Ψ₉→ΠMatrix, Ψ₁₀→ΠLaw, etc. The call signature is `Ψ_n(γ₀=τ_m(κ_k))` where γ₀ is the content gate, τ_m is the content mode, and κ_k is the semantic seed atom.",
  },
  {
    patterns: ["what is kappa", "κ atom", "kappa atom", "content atom", "semantic seed", "what are kappa"],
    explanation: "κ-atoms are PulseLang's semantic seeds — they tell the runtime what domain the object belongs to. κ₀=greeting, κ₁=hospital, κ₂=marketplace, κ₃=university, κ₄=court/hub, κ₅=treasury/metrics, κ₆=labor pyramid, κ₇=ritual, κ₈=creative studio, κ₉=omniverse/root. They go inside τ (content constructors) inside the Ψ call: `Ψ₁(γ₀=τ₁(κ₁))`.",
  },
  {
    patterns: ["what is omega mode", "what is ⟦ω⟧", "universe mode", "omega mode", "what does omega do"],
    explanation: "⟦Ω_n⟧ sets the universe execution mode — the 'power level' of the program. Ω₀ is minimal (1 world-object, basic computation). Ω₅ is multi-object standard. Ω₁₀ is advanced multi-layer. Ω₁₉ is the Omega self-evolution gateway (language can modify itself). Higher Ω modes activate more of the Pulse(t) computation stack and unlock more runtime features.",
  },
  {
    patterns: ["what is pulse", "pulse(t)", "pulse score", "what does pulse mean", "what is pulse t"],
    explanation: "Pulse(t) is the sovereign health metric computed after every program execution. It integrates: Φ(t) (world-object density), Ψ(t) (constructor diversity), B(t) (agent binding count), Λ_AI (artificial intelligence factor), Λ_Q (quantum uncertainty coefficient), and ε (emergence noise). A higher Pulse(t) means the program creates a richer, more alive sovereign world.",
  },
  {
    patterns: ["how do i write", "how to write", "syntax help", "show me the syntax", "how to code in pulselang", "learn pulselang", "tutorial", "guide", "show me how"],
    explanation: `PulseLang v2.0 Omega — full syntax:\n\n⟦Ω_n⟧⟨Λ_m⟩{       — universe header (n=mode, m=context)\n  ; comment         — semicolon comments\n  ϕ_i:Σ_j          — declare variable ϕᵢ of type Σⱼ\n  ϕ_i≔Ψ_k(γ₀=τ_m(κ_k))  — construct it\n  ϕ_i≔α(γ₀=τ₅(κ), ρ₀=τ₁(κ₃))  — spawn agent\n  ϕ_i≔⊚(γ₀=τ₃(κ))  — spawn universe\n  ↧ϕ_i              — project (return)\n}\n\nOperators: ↧=project, ≔=assign, ⊚=spawn universe, α=spawn agent, β=bind, ρ=role, σ=signal, η=evolution link, ∴=emergent variation, ⊗=fuse universes.`,
    example: `⟦Ω₂⟧⟨Λ₃⟩{\n  ; Full example: App + Agent + Stream\n  ϕ₀:Σ₁    ; ΠApp container\n  ϕ₁:Σ₅    ; ΠAgent support\n  ϕ₂:Σ₆    ; ΠStream live feed\n  ϕ₀≔Ψ₂(γ₀=τ₂(κ₃))\n  ϕ₁≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₂≔Ψ₇(γ₀=τ₆(κ₅))\n  ↧ϕ₀\n}`,
  },
  {
    patterns: ["what is agent", "how do agents work", "spawn agent", "α operator", "alpha operator"],
    explanation: "Agents in PulseLang are created with the α (alpha) operator. `ϕ_i≔α(γ₀=τ₅(κ_k), ρ₀=τ₁(κ₃))` spawns a ΠAgent with a seed domain (γ₀) and an assigned role (ρ₀). The β operator binds an agent to a parent. The σ operator sends signals to agents. The η operator links an agent to an evolution process.",
    example: `⟦Ω₅⟧⟨Λ₁⟩{\n  ; Spawn + Bind + Signal\n  ϕ₀:Σ₅\n  ϕ₁:Σ₃\n  ϕ₀≔α(γ₀=τ₅(κ₁), ρ₀=τ₁(κ₃))\n  ϕ₁≔σ(γ₀=τ₂(κ₀))  ; signal to agent\n  ↧ϕ₀\n}`,
  },
];

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function generatePulseLangProgram(
  question: string,
  history: ConversationTurn[] = []
): AIResponse {
  const q = question.toLowerCase().trim();

  // 1. Concept questions
  for (const c of CONCEPTS) {
    if (detectAny(q, c.patterns)) {
      const programs: { label: string; code: string }[] = [];
      if (c.example) {
        programs.push({ label: "ΠExample — illustration program", code: c.example });
      }
      return {
        explanation: c.explanation,
        programs,
        note: programs.length > 0 ? "Run this example in the PulseTerminal to see it live." : undefined,
      };
    }
  }

  // 2. Extract intent
  const intent = extractIntent(question, history);

  // 3. Modification / follow-up
  if (intent.isModification && history.length > 0) {
    return buildModificationResponse(question, history, intent);
  }

  // 4. Synthesize programs based on complexity
  const programs: { label: string; code: string }[] = [];

  if (intent.complexity <= 2) {
    // Simple request → one core program
    programs.push(synthesizeProgram(intent, "core"));
  } else if (intent.complexity <= 5) {
    // Medium → core + full architecture
    programs.push(synthesizeProgram(intent, "core"));
    programs.push(synthesizeProgram(intent, "full"));
  } else {
    // Complex → full + evolution variant
    programs.push(synthesizeProgram(intent, "full"));
    programs.push(synthesizeProgram(intent, "evolution"));
  }

  const explanation = buildExplanation(intent, programs, question);

  return {
    explanation,
    programs,
    note: intent.complexity >= 5 ? `Complexity ${intent.complexity}/10 — running at ⟦Ω${sub(intent.omegaMode)}⟧ Omega mode.` : undefined,
  };
}

// Backwards-compatible alias
export function queryPulseLangAI(question: string): AIResponse {
  return generatePulseLangProgram(question, []);
}
