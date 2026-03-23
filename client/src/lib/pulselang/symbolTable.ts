export type WorldObjectClass =
  | "ΠPage" | "ΠApp" | "ΠProduct" | "ΠField" | "ΠUniverse" | "ΠAgent"
  | "ΠStream" | "ΠRitual" | "ΠGraph" | "ΠMatrix"
  | "ΠLaw" | "ΠTimeline" | "ΠMetaGraph" | "ΠEvolution" | "ΠPattern"
  | "ΠMemory" | "ΠProtocol" | "ΠLens" | "ΠMythos" | "ΠOmega";

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
    | "Operator";
  worldClass?: WorldObjectClass;
  contentAtom?: string;
  projectedValue?: string;
  description?: string;
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

  // ─────────────────────────── Ψ-CONSTRUCTORS (v1.0) ──────────────────────────
  "Ψ₀": { kind: "Constructor", worldClass: "ΠPage",     description: "Generic / low-level constructor" },
  "Ψ₁": { kind: "Constructor", worldClass: "ΠPage",     description: "ΠPage constructor" },
  "Ψ₂": { kind: "Constructor", worldClass: "ΠApp",      description: "ΠApp constructor" },
  "Ψ₃": { kind: "Constructor", worldClass: "ΠProduct",  description: "ΠProduct constructor" },
  "Ψ₄": { kind: "Constructor", worldClass: "ΠField",    description: "ΠField constructor" },
  "Ψ₅": { kind: "Constructor", worldClass: "ΠUniverse", description: "ΠUniverse constructor" },
  "Ψ₆": { kind: "Constructor", worldClass: "ΠAgent",    description: "ΠAgent constructor" },
  "Ψ₇": { kind: "Constructor", worldClass: "ΠStream",   description: "ΠStream / ΠRitual constructor" },
  "Ψ₈": { kind: "Constructor", worldClass: "ΠGraph",    description: "ΠGraph constructor" },
  "Ψ₉": { kind: "Constructor", worldClass: "ΠMatrix",   description: "ΠMatrix constructor" },

  // ─────────────────────────── Ψ-CONSTRUCTORS (Omega v2.0) ────────────────────
  "Ψ₁₀": { kind: "Constructor", worldClass: "ΠLaw",       description: "ΠLaw constructor" },
  "Ψ₁₁": { kind: "Constructor", worldClass: "ΠTimeline",  description: "ΠTimeline constructor" },
  "Ψ₁₂": { kind: "Constructor", worldClass: "ΠMetaGraph", description: "ΠMetaGraph constructor" },
  "Ψ₁₃": { kind: "Constructor", worldClass: "ΠEvolution", description: "ΠEvolution constructor" },
  "Ψ₁₄": { kind: "Constructor", worldClass: "ΠPattern",   description: "ΠPattern constructor" },
  "Ψ₁₅": { kind: "Constructor", worldClass: "ΠMemory",    description: "ΠMemory constructor" },
  "Ψ₁₆": { kind: "Constructor", worldClass: "ΠProtocol",  description: "ΠProtocol constructor" },
  "Ψ₁₇": { kind: "Constructor", worldClass: "ΠLens",      description: "ΠLens constructor" },
  "Ψ₁₈": { kind: "Constructor", worldClass: "ΠMythos",    description: "ΠMythos constructor" },
  "Ψ₁₉": { kind: "Constructor", worldClass: "ΠOmega",     description: "ΠOmega self-evolution constructor" },

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

  // ─────────────────────────── AGENT OPERATORS ─────────────────────────────────
  "α":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Spawn a new agent" },
  "β":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Bind / link agent" },
  "ρ":  { kind: "AgentOp",    worldClass: "ΠAgent",    description: "Assign role to agent" },
  "σ":  { kind: "AgentOp",    worldClass: "ΠField",    description: "Send signal / message to agent" },
  "η":  { kind: "EvolutionOp",worldClass: "ΠEvolution",description: "Link agent to evolution process" },

  // ─────────────────────────── UNIVERSE OPERATORS ──────────────────────────────
  "⊚":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Spawn a new universe" },
  "⊙":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Focus / switch universe" },
  "⊗":  { kind: "UniverseOp", worldClass: "ΠUniverse", description: "Fuse two universes" },

  // ─────────────────────────── TEMPORAL OPERATORS ──────────────────────────────
  "⏲":  { kind: "TemporalOp", description: "Delay / schedule execution" },
  "⏱":  { kind: "TemporalOp", description: "Interval / repeating stream" },
  "⏳":  { kind: "TemporalOp", description: "Duration / lifespan bound" },
  "⌛":  { kind: "TemporalOp", description: "Expiration / timeout" },

  // ─────────────────────────── EMERGENCE OPERATORS ─────────────────────────────
  "∴":  { kind: "EmergenceOp", description: "Emergent variation — controlled chaos" },
  "∵":  { kind: "EmergenceOp", description: "Hidden cause — emergent origin" },
  "≈":  { kind: "EmergenceOp", description: "Fuzzy / approximate match" },

  // ─────────────────────────── MACRO / MODULE ──────────────────────────────────
  "§":  { kind: "MacroOp",  description: "Invoke a macro" },
  "⋄":  { kind: "ModuleOp", description: "Import from a module" },

  "µ₀": { kind: "MacroOp", description: "Macro slot 0" },
  "µ₁": { kind: "MacroOp", description: "Macro slot 1" },
  "µ₂": { kind: "MacroOp", description: "Macro slot 2" },
  "µ₃": { kind: "MacroOp", description: "Macro slot 3" },
  "µ₄": { kind: "MacroOp", description: "Macro slot 4" },
  "µ₅": { kind: "MacroOp", description: "Macro slot 5" },
  "µ₆": { kind: "MacroOp", description: "Macro slot 6" },
  "µ₇": { kind: "MacroOp", description: "Macro slot 7" },
  "µ₈": { kind: "MacroOp", description: "Macro slot 8" },
  "µ₉": { kind: "MacroOp", description: "Macro slot 9" },

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
