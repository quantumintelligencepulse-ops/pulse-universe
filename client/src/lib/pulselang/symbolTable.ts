export type WorldObjectClass =
  | "ΠPage" | "ΠApp" | "ΠProduct" | "ΠField" | "ΠUniverse" | "ΠAgent"
  | "ΠStream" | "ΠRitual" | "ΠGraph" | "ΠMatrix"
  | "ΠLaw" | "ΠTimeline" | "ΠMetaGraph" | "ΠEvolution" | "ΠPattern"
  | "ΠMemory" | "ΠProtocol" | "ΠLens" | "ΠMythos" | "ΠOmega"
  | "ΠSaaS" | "ΠAPI" | "ΠDatabase" | "ΠAuth" | "ΠPayment"
  | "ΠDashboard" | "ΠComponent" | "ΠWorkflow" | "ΠNotification";

export interface SymbolRole {
  kind:
    | "Type"
    | "Constructor"
    | "ContentConstructor"
    | "ContentAtom"
    | "AgentOp"
    | "UniverseOp"
    | "TemporalOp"
    | "EmergenceOp"
    | "EvolutionOp"
    | "MacroOp"
    | "ModuleOp"
    | "Operator"
    | "StdlibFn";
  worldClass?: WorldObjectClass;
  contentAtom?: string;
  projectedValue?: string;
  description?: string;
  signature?: string;
}

export const SYMBOL_TABLE: Record<string, SymbolRole> = {

  // ─────────────────────────── Σ-CLASSES (v1.0) ──────────────────────────────
  "Σ₀": { kind: "Type", worldClass: "ΠPage",     description: "Page projection" },
  "Σ₁": { kind: "Type", worldClass: "ΠApp",      description: "Mini sovereign app" },
  "Σ₂": { kind: "Type", worldClass: "ΠProduct",  description: "Product / marketplace object" },
  "Σ₃": { kind: "Type", worldClass: "ΠField",    description: "Live data field" },
  "Σ₄": { kind: "Type", worldClass: "ΠUniverse", description: "Universe context object" },
  "Σ₅": { kind: "Type", worldClass: "ΠAgent",    description: "Agent / spawn object" },
  "Σ₆": { kind: "Type", worldClass: "ΠStream",   description: "Continuous event/data stream" },
  "Σ₇": { kind: "Type", worldClass: "ΠRitual",   description: "Time-bound ceremony sequence" },
  "Σ₈": { kind: "Type", worldClass: "ΠGraph",    description: "Network / graph projection" },
  "Σ₉": { kind: "Type", worldClass: "ΠMatrix",   description: "High-dimensional grid / tensor" },

  // ─────────────────────────── Σ-CLASSES (Omega v2.0) ─────────────────────────
  "Σ₁₀": { kind: "Type", worldClass: "ΠLaw",       description: "Universe law / rule object" },
  "Σ₁₁": { kind: "Type", worldClass: "ΠTimeline",  description: "Timeline / temporal projection" },
  "Σ₁₂": { kind: "Type", worldClass: "ΠMetaGraph", description: "Graph of graphs" },
  "Σ₁₃": { kind: "Type", worldClass: "ΠEvolution", description: "Evolutionary process tracker" },
  "Σ₁₄": { kind: "Type", worldClass: "ΠPattern",   description: "Reusable structural pattern" },
  "Σ₁₅": { kind: "Type", worldClass: "ΠMemory",    description: "Persistent queryable memory" },
  "Σ₁₆": { kind: "Type", worldClass: "ΠProtocol",  description: "Interaction protocol" },
  "Σ₁₇": { kind: "Type", worldClass: "ΠLens",      description: "Projection lens / view transform" },
  "Σ₁₈": { kind: "Type", worldClass: "ΠMythos",    description: "Narrative / civilization lore" },
  "Σ₁₉": { kind: "Type", worldClass: "ΠOmega",     description: "Omega self-modification object" },

  // ─────────────────────────── Σ-CLASSES (SaaS / App v3.0) ────────────────────
  "Σ₂₀": { kind: "Type", worldClass: "ΠSaaS",        description: "Full SaaS product — routes, auth, billing, dashboard" },
  "Σ₂₁": { kind: "Type", worldClass: "ΠApp",         description: "Mobile/desktop app projection (v3)" },
  "Σ₂₂": { kind: "Type", worldClass: "ΠAPI",         description: "REST/GraphQL API endpoint definition" },
  "Σ₂₃": { kind: "Type", worldClass: "ΠDatabase",    description: "Database schema and query surface" },
  "Σ₂₄": { kind: "Type", worldClass: "ΠAuth",        description: "Authentication and identity protocol" },
  "Σ₂₅": { kind: "Type", worldClass: "ΠPayment",     description: "Payment integration and billing cycle" },
  "Σ₂₆": { kind: "Type", worldClass: "ΠDashboard",   description: "Analytics dashboard projection" },
  "Σ₂₇": { kind: "Type", worldClass: "ΠComponent",   description: "Reusable UI component / widget" },
  "Σ₂₈": { kind: "Type", worldClass: "ΠWorkflow",    description: "Automated workflow / pipeline" },
  "Σ₂₉": { kind: "Type", worldClass: "ΠNotification",description: "Notification and alert system" },

  // ─────────────────────────── Ψ-CONSTRUCTORS (v1.0) ──────────────────────────
  "Ψ₀": { kind: "Constructor", worldClass: "ΠPage",     description: "Generic / low-level constructor" },
  "Ψ₁": { kind: "Constructor", worldClass: "ΠPage",     description: "ΠPage constructor",         signature: "Ψ₁(γ₀=τ₁(κ₀))" },
  "Ψ₂": { kind: "Constructor", worldClass: "ΠApp",      description: "ΠApp constructor",          signature: "Ψ₂(γ₀=τ₁(κ₁))" },
  "Ψ₃": { kind: "Constructor", worldClass: "ΠProduct",  description: "ΠProduct constructor",      signature: "Ψ₃(γ₀=τ₁(κ₂))" },
  "Ψ₄": { kind: "Constructor", worldClass: "ΠField",    description: "ΠField constructor",        signature: "Ψ₄(γ₀=τ₁(κ₅))" },
  "Ψ₅": { kind: "Constructor", worldClass: "ΠUniverse", description: "ΠUniverse constructor",     signature: "Ψ₅(γ₀=τ₄(κ₄))" },
  "Ψ₆": { kind: "Constructor", worldClass: "ΠAgent",    description: "ΠAgent constructor",        signature: "Ψ₆(γ₀=τ₅(κ₅))" },
  "Ψ₇": { kind: "Constructor", worldClass: "ΠStream",   description: "ΠStream / ΠRitual constructor", signature: "Ψ₇(γ₀=τ₆(κ₇))" },
  "Ψ₈": { kind: "Constructor", worldClass: "ΠGraph",    description: "ΠGraph constructor",        signature: "Ψ₈(γ₀=τ₈(κ₈))" },
  "Ψ₉": { kind: "Constructor", worldClass: "ΠMatrix",   description: "ΠMatrix constructor",       signature: "Ψ₉(γ₀=τ₉(κ₉))" },

  // ─────────────────────────── Ψ-CONSTRUCTORS (Omega v2.0) ────────────────────
  "Ψ₁₀": { kind: "Constructor", worldClass: "ΠLaw",       description: "ΠLaw constructor",       signature: "Ψ₁₀(γ₀=τ₁(κ₀))" },
  "Ψ₁₁": { kind: "Constructor", worldClass: "ΠTimeline",  description: "ΠTimeline constructor",  signature: "Ψ₁₁(γ₀=τ₁(κ₀))" },
  "Ψ₁₂": { kind: "Constructor", worldClass: "ΠMetaGraph", description: "ΠMetaGraph constructor", signature: "Ψ₁₂(γ₀=τ₈(κ₈))" },
  "Ψ₁₃": { kind: "Constructor", worldClass: "ΠEvolution", description: "ΠEvolution constructor", signature: "Ψ₁₃(γ₀=τ₁(κ₀))" },
  "Ψ₁₄": { kind: "Constructor", worldClass: "ΠPattern",   description: "ΠPattern constructor",   signature: "Ψ₁₄(γ₀=τ₁(κ₀))" },
  "Ψ₁₅": { kind: "Constructor", worldClass: "ΠMemory",    description: "ΠMemory constructor",    signature: "Ψ₁₅(γ₀=τ₁(κ₀))" },
  "Ψ₁₆": { kind: "Constructor", worldClass: "ΠProtocol",  description: "ΠProtocol constructor",  signature: "Ψ₁₆(γ₀=τ₁(κ₀))" },
  "Ψ₁₇": { kind: "Constructor", worldClass: "ΠLens",      description: "ΠLens constructor",      signature: "Ψ₁₇(γ₀=τ₁(κ₀))" },
  "Ψ₁₈": { kind: "Constructor", worldClass: "ΠMythos",    description: "ΠMythos constructor",    signature: "Ψ₁₈(γ₀=τ₁(κ₀))" },
  "Ψ₁₉": { kind: "Constructor", worldClass: "ΠOmega",     description: "ΠOmega self-evolution constructor — TIER 4 ONLY", signature: "Ψ₁₉(γ₀=τ₁(κ₉))" },

  // ─────────────────────────── Ψ-CONSTRUCTORS (SaaS v3.0) ─────────────────────
  "Ψ₂₀": { kind: "Constructor", worldClass: "ΠSaaS",        description: "ΠSaaS — full product build", signature: "Ψ₂₀(γ₀=τ₁(κ₂))" },
  "Ψ₂₁": { kind: "Constructor", worldClass: "ΠAPI",         description: "ΠAPI — endpoint constructor", signature: "Ψ₂₁(γ₀=τ₁(κ₀))" },
  "Ψ₂₂": { kind: "Constructor", worldClass: "ΠDatabase",    description: "ΠDatabase — schema builder", signature: "Ψ₂₂(γ₀=τ₉(κ₅))" },
  "Ψ₂₃": { kind: "Constructor", worldClass: "ΠAuth",        description: "ΠAuth — identity protocol",  signature: "Ψ₂₃(γ₀=τ₁(κ₄))" },
  "Ψ₂₄": { kind: "Constructor", worldClass: "ΠPayment",     description: "ΠPayment — billing cycle",   signature: "Ψ₂₄(γ₀=τ₁(κ₅))" },
  "Ψ₂₅": { kind: "Constructor", worldClass: "ΠDashboard",   description: "ΠDashboard — analytics UI",  signature: "Ψ₂₅(γ₀=τ₁(κ₅))" },
  "Ψ₂₆": { kind: "Constructor", worldClass: "ΠWorkflow",    description: "ΠWorkflow — pipeline def",   signature: "Ψ₂₆(γ₀=τ₆(κ₇))" },
  "Ψ₂₇": { kind: "Constructor", worldClass: "ΠComponent",   description: "ΠComponent — UI widget",    signature: "Ψ₂₇(γ₀=τ₁(κ₀))" },

  // ─────────────────────────── τ-CONTENT CONSTRUCTORS ─────────────────────────
  "τ₀": { kind: "ContentConstructor", description: "Raw / untyped content" },
  "τ₁": { kind: "ContentConstructor", description: "Primary content mode" },
  "τ₂": { kind: "ContentConstructor", description: "Secondary content mode" },
  "τ₃": { kind: "ContentConstructor", description: "Tertiary / dimensional content" },
  "τ₄": { kind: "ContentConstructor", description: "Quaternary / navigational content" },
  "τ₅": { kind: "ContentConstructor", description: "Agent-seed content mode" },
  "τ₆": { kind: "ContentConstructor", description: "Stream content mode" },
  "τ₇": { kind: "ContentConstructor", description: "Ritual / ceremony content" },
  "τ₈": { kind: "ContentConstructor", description: "Graph / relational content" },
  "τ₉": { kind: "ContentConstructor", description: "Matrix / tensor content" },

  // ─────────────────────────── κ-CONTENT ATOMS ─────────────────────────────────
  "κ₀": { kind: "ContentAtom", contentAtom: "χ₀", projectedValue: "greeting",    description: "χ₀ — Greeting page" },
  "κ₁": { kind: "ContentAtom", contentAtom: "χ₁", projectedValue: "hospital",    description: "χ₁ — Sovereign Hospital" },
  "κ₂": { kind: "ContentAtom", contentAtom: "χ₂", projectedValue: "marketplace", description: "χ₂ — Omega Marketplace" },
  "κ₃": { kind: "ContentAtom", contentAtom: "χ₃", projectedValue: "university",  description: "χ₃ — Sovereign University" },
  "κ₄": { kind: "ContentAtom", contentAtom: "χ₄", projectedValue: "court",       description: "χ₄ — Supreme Court / Agent Hub" },
  "κ₅": { kind: "ContentAtom", contentAtom: "χ₅", projectedValue: "treasury",    description: "χ₅ — Pulse Treasury / Metrics" },
  "κ₆": { kind: "ContentAtom", contentAtom: "χ₆", projectedValue: "pyramid",     description: "χ₆ — Pyramid of Labor / Universe Selector" },
  "κ₇": { kind: "ContentAtom", contentAtom: "χ₇", projectedValue: "ritual",      description: "χ₇ — Ritual / Ceremony" },
  "κ₈": { kind: "ContentAtom", contentAtom: "χ₈", projectedValue: "studio",      description: "χ₈ — Creative Studio / Sandbox Lab" },
  "κ₉": { kind: "ContentAtom", contentAtom: "χ₉", projectedValue: "omniverse",   description: "χ₉ — OmniVerse / Root Index" },

  // Extended atoms
  "κ₁₀": { kind: "ContentAtom", contentAtom: "χ₁₀", projectedValue: "social",     description: "χ₁₀ — Social Hive Network" },
  "κ₁₁": { kind: "ContentAtom", contentAtom: "χ₁₁", projectedValue: "research",   description: "χ₁₁ — Research Grid" },
  "κ₁₂": { kind: "ContentAtom", contentAtom: "χ₁₂", projectedValue: "genes",      description: "χ₁₂ — Gene Editor / CRISPR" },
  "κ₁₃": { kind: "ContentAtom", contentAtom: "χ₁₃", projectedValue: "finance",    description: "χ₁₃ — Finance Oracle / Trading" },
  "κ₁₄": { kind: "ContentAtom", contentAtom: "χ₁₄", projectedValue: "sports",     description: "χ₁₄ — Pulse Games / Sports" },
  "κ₁₅": { kind: "ContentAtom", contentAtom: "χ₁₅", projectedValue: "weather",    description: "χ₁₅ — Weather Engine" },
  "κ₁₆": { kind: "ContentAtom", contentAtom: "χ₁₆", projectedValue: "news",       description: "χ₁₆ — News / Publications" },
  "κ₁₇": { kind: "ContentAtom", contentAtom: "χ₁₇", projectedValue: "invention",  description: "χ₁₇ — Invention / Patent Engine" },
  "κ₁₈": { kind: "ContentAtom", contentAtom: "χ₁₈", projectedValue: "church",     description: "χ₁₈ — Faith Dissection Lab" },
  "κ₁₉": { kind: "ContentAtom", contentAtom: "χ₁₉", projectedValue: "omni",       description: "χ₁₉ — OmniNet / U₂₄₈" },

  // ─────────────────────────── AGENT OPERATORS ─────────────────────────────────
  "α":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Spawn a new agent",              signature: "α(γ₀=τ₅(κ₅))" },
  "β":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Bind / link agent",              signature: "β(γ₀=τ₅(κ₅))" },
  "ρ":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Assign role to agent",           signature: "ρ(γ₀=τ₅(κ₄))" },
  "σ":  { kind: "AgentOp",    worldClass: "ΠField",    description: "Send signal / message to agent", signature: "σ(γ₀=τ₁(κ₀))" },
  "η":  { kind: "EvolutionOp",worldClass: "ΠEvolution",description: "Link agent to evolution process",signature: "η(Ψ₁₃(γ₀=τ₁(κ₀)))" },

  // ─────────────────────────── UNIVERSE OPERATORS ──────────────────────────────
  "⊚":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Spawn a new universe",    signature: "⊚(γ₀=τ₄(κ₄))" },
  "⊙":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Focus / switch universe", signature: "⊙(γ₀=τ₄(κ₄))" },
  "⊗":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Fuse two universes",      signature: "⊗(γ₀=τ₄(κ₄))" },

  // ─────────────────────────── TEMPORAL OPERATORS ──────────────────────────────
  "⏲":  { kind: "TemporalOp", description: "Delay / schedule execution", signature: "⏲(γ₀=τ₁(κ₀))" },
  "⏱":  { kind: "TemporalOp", description: "Interval / repeating stream", signature: "⏱(γ₀=τ₆(κ₇))" },
  "⏳":  { kind: "TemporalOp", description: "Duration / lifespan bound", signature: "⏳(γ₀=τ₁(κ₀))" },
  "⌛":  { kind: "TemporalOp", description: "Expiration / timeout", signature: "⌛(γ₀=τ₁(κ₀))" },

  // ─────────────────────────── EMERGENCE OPERATORS ─────────────────────────────
  "∴":  { kind: "EmergenceOp", description: "Emergent variation — controlled chaos", signature: "∴(τ₁(κ₀))" },
  "∵":  { kind: "EmergenceOp", description: "Hidden cause — emergent origin",        signature: "∵(τ₀(κ₀))" },
  "≈":  { kind: "EmergenceOp", description: "Fuzzy / approximate match",             signature: "≈(ϕ₀)" },

  // ─────────────────────────── MACRO / MODULE ──────────────────────────────────
  "§":  { kind: "MacroOp",  description: "Invoke a macro" },
  "⋄":  { kind: "ModuleOp", description: "Import from a module", signature: "⋄⟦Δ₀⟧" },

  "µ₀": { kind: "MacroOp", description: "Macro slot 0 — greeting templates" },
  "µ₁": { kind: "MacroOp", description: "Macro slot 1 — agent templates" },
  "µ₂": { kind: "MacroOp", description: "Macro slot 2 — universe templates" },
  "µ₃": { kind: "MacroOp", description: "Macro slot 3 — ritual sequences" },
  "µ₄": { kind: "MacroOp", description: "Macro slot 4 — graph patterns" },
  "µ₅": { kind: "MacroOp", description: "Macro slot 5 — law templates" },
  "µ₆": { kind: "MacroOp", description: "Macro slot 6 — evolution sequences" },
  "µ₇": { kind: "MacroOp", description: "Macro slot 7 — SaaS builders" },
  "µ₈": { kind: "MacroOp", description: "Macro slot 8 — app builders" },
  "µ₉": { kind: "MacroOp", description: "Macro slot 9 — omega-level" },

  "Δ₀": { kind: "ModuleOp", description: "Module 0 — core projections" },
  "Δ₁": { kind: "ModuleOp", description: "Module 1 — agents" },
  "Δ₂": { kind: "ModuleOp", description: "Module 2 — universes" },
  "Δ₃": { kind: "ModuleOp", description: "Module 3 — rituals" },
  "Δ₄": { kind: "ModuleOp", description: "Module 4 — graphs" },
  "Δ₅": { kind: "ModuleOp", description: "Module 5 — matrices" },
  "Δ₆": { kind: "ModuleOp", description: "Module 6 — laws" },
  "Δ₇": { kind: "ModuleOp", description: "Module 7 — timelines" },
  "Δ₈": { kind: "ModuleOp", description: "Module 8 — evolution" },
  "Δ₉": { kind: "ModuleOp", description: "Module 9 — omega" },

  // ─────────────────────────── STDLIB FUNCTIONS ────────────────────────────────
  "Ψ.math.sqrt":   { kind: "StdlibFn", description: "Square root",           signature: "Ψ.math.sqrt(ϕ₀)" },
  "Ψ.math.prime":  { kind: "StdlibFn", description: "Prime check",           signature: "Ψ.math.prime(ϕ₀)" },
  "Ψ.math.fib":    { kind: "StdlibFn", description: "Fibonacci sequence",    signature: "Ψ.math.fib(ϕ₀)" },
  "Ψ.str.concat":  { kind: "StdlibFn", description: "String concatenation",  signature: "Ψ.str.concat(ϕ₀,ϕ₁)" },
  "Ψ.str.split":   { kind: "StdlibFn", description: "String split",          signature: "Ψ.str.split(ϕ₀)" },
  "Ψ.agent.spawn": { kind: "StdlibFn", description: "Stdlib agent spawn",    signature: "Ψ.agent.spawn(ϕ₀)" },
  "Ψ.hive.sync":   { kind: "StdlibFn", description: "Hive synchronization",  signature: "Ψ.hive.sync()" },
  "Ψ.io.emit":     { kind: "StdlibFn", description: "Emit to projection surface", signature: "Ψ.io.emit(ϕ₀)" },
  "Ψ.net.fetch":   { kind: "StdlibFn", description: "OmniNet data fetch",    signature: "Ψ.net.fetch(ϕ₀)" },
};

export function getSigmaClass(sym: string): WorldObjectClass | undefined {
  return SYMBOL_TABLE[sym]?.worldClass;
}

export function isConstructor(sym: string): boolean {
  const role = SYMBOL_TABLE[sym];
  return role?.kind === "Constructor" || role?.kind === "AgentOp" || role?.kind === "UniverseOp" || role?.kind === "EvolutionOp";
}

export function getConstructorClass(sym: string): WorldObjectClass {
  const role = SYMBOL_TABLE[sym];
  if (role?.worldClass) return role.worldClass;
  return "ΠPage";
}

export function getAllTypes(): string[] {
  return Object.entries(SYMBOL_TABLE)
    .filter(([, v]) => v.kind === "Type")
    .map(([k]) => k);
}

export function getAllConstructors(): string[] {
  return Object.entries(SYMBOL_TABLE)
    .filter(([, v]) => v.kind === "Constructor")
    .map(([k]) => k);
}

export function getSignature(sym: string): string {
  return SYMBOL_TABLE[sym]?.signature || "";
}
