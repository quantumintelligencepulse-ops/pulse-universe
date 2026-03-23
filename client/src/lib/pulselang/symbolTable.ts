export type WorldObjectClass = "ΠPage" | "ΠApp" | "ΠProduct" | "ΠField" | "ΠUniverse" | "ΠAgent";

export interface SymbolRole {
  kind: "Type" | "Constructor" | "ContentConstructor" | "ContentAtom" | "Operator";
  worldClass?: WorldObjectClass;
  contentAtom?: string;
  projectedValue?: string;
}

export const SYMBOL_TABLE: Record<string, SymbolRole> = {
  "Σ₀": { kind: "Type", worldClass: "ΠPage" },
  "Σ₁": { kind: "Type", worldClass: "ΠApp" },
  "Σ₂": { kind: "Type", worldClass: "ΠProduct" },
  "Σ₃": { kind: "Type", worldClass: "ΠField" },
  "Σ₄": { kind: "Type", worldClass: "ΠUniverse" },
  "Σ₅": { kind: "Type", worldClass: "ΠAgent" },

  "Ψ₀": { kind: "Constructor", worldClass: "ΠPage" },
  "Ψ₁": { kind: "Constructor", worldClass: "ΠPage" },
  "Ψ₂": { kind: "Constructor", worldClass: "ΠApp" },
  "Ψ₃": { kind: "Constructor", worldClass: "ΠProduct" },
  "Ψ₄": { kind: "Constructor", worldClass: "ΠField" },
  "Ψ₅": { kind: "Constructor", worldClass: "ΠAgent" },

  "τ₀": { kind: "ContentConstructor" },
  "τ₁": { kind: "ContentConstructor" },
  "τ₂": { kind: "ContentConstructor" },
  "τ₃": { kind: "ContentConstructor" },
  "τ₄": { kind: "ContentConstructor" },
  "τ₅": { kind: "ContentConstructor" },
  "τ₆": { kind: "ContentConstructor" },
  "τ₇": { kind: "ContentConstructor" },
  "τ₈": { kind: "ContentConstructor" },
  "τ₉": { kind: "ContentConstructor" },

  "κ₀": { kind: "ContentAtom", contentAtom: "χ₀", projectedValue: "greeting" },
  "κ₁": { kind: "ContentAtom", contentAtom: "χ₁", projectedValue: "hospital" },
  "κ₂": { kind: "ContentAtom", contentAtom: "χ₂", projectedValue: "marketplace" },
  "κ₃": { kind: "ContentAtom", contentAtom: "χ₃", projectedValue: "university" },
  "κ₄": { kind: "ContentAtom", contentAtom: "χ₄", projectedValue: "court" },
  "κ₅": { kind: "ContentAtom", contentAtom: "χ₅", projectedValue: "treasury" },
  "κ₆": { kind: "ContentAtom", contentAtom: "χ₆", projectedValue: "pyramid" },
  "κ₇": { kind: "ContentAtom", contentAtom: "χ₇", projectedValue: "sports" },
  "κ₈": { kind: "ContentAtom", contentAtom: "χ₈", projectedValue: "studio" },
  "κ₉": { kind: "ContentAtom", contentAtom: "χ₉", projectedValue: "omniverse" },
};
