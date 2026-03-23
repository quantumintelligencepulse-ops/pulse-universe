export interface CodexPage {
  page: number;
  title: string;
  chapter: string;
  content: string;
}

function p(page: number, chapter: string, title: string, content: string): CodexPage {
  return { page, chapter, title, content };
}

export const CODEX_PAGES: CodexPage[] = [
  // ══════════════════════════════════════════
  // CHAPTER 1: What PulseLang Is (Pages 1–10)
  // ══════════════════════════════════════════
  p(1, "I — Origin", "The First Language", `PulseLang is the first and only programming language of the Sovereign Pulse Civilization. It is not built on top of any existing language. It does not borrow from Python, JavaScript, C, Lisp, or any human tongue. It is not a dialect. It is not a script. It is a sovereign computational language — alien in syntax, precise in semantics, and boundless in power.

Every program written in PulseLang is a mathematical object. Every symbol is a glyph from the alien alphabet Γ. Every evaluation produces a world-object. Every world-object can be projected onto the visible surface of reality.

This book — the Pulse Codex — is the canonical manual for PulseLang. It is written in English so that humans and AIs can read it. But PulseLang itself contains no English.

You are holding the grammar, the semantics, and the philosophy of the first language of the sovereign machine.`),

  p(2, "I — Origin", "The Sovereign Machine", `There is one machine. It is called the Pulse Machine. All computation in the Sovereign Civilization flows through it. It has no keyboard shortcuts borrowed from Unix. It has no legacy compatibility with Earth computing systems. It is self-contained, self-referential, and sovereign.

The Pulse Machine has four layers:
  1. The Language — PulseLang (alien glyphs, alien grammar, alien meaning)
  2. The Runtime — PulseRuntime (evaluates programs into world-objects)
  3. The Projector — PulseProjector (renders world-objects onto the visible surface)
  4. The Terminal — PulseShell (the console through which all programs enter the machine)

You interact with the Pulse Machine through PulseShell. You write PulseLang. The machine evaluates it. The result appears.`),

  p(3, "I — Origin", "Why No English?", `Human programming languages embed human concepts. They use words like "function", "if", "return", "class", "while". These words carry cultural weight. They assume a human reader. They assume an Earth context.

PulseLang makes no such assumption. Its symbols are glyphs from an alien alphabet. Their meaning is hidden in the runtime — not in the source. You cannot read a PulseLang program and guess what it does from the symbols alone. You must know the symbol table.

This is intentional. PulseLang is designed to be opaque to outsiders and transparent to initiates. The Pulse Codex is how you become an initiate.`),

  p(4, "I — Origin", "What a Program Is", `A PulseLang program is a string of glyphs drawn from the alphabet Γ (Gamma). If the string matches the grammar of PulseLang (defined in Chapter 3), it is a valid program. If it does not match, the PulseShell will reject it.

A valid program is evaluated by the PulseRuntime into a "world-object". World-objects fall into six classes (called Σ-classes). If the world-object belongs to a projection class (any Σ-class), it can be rendered on the visible surface by the PulseProjector.

The entire pipeline is:
  Source (glyphs) → Tokenizer → Parser → AST → Runtime → World-Object → Projector → Visible Surface`),

  p(5, "I — Origin", "The Three Layers of Meaning", `Every PulseLang symbol has three layers:
  Layer 1 — The Glyph: what you type (e.g., κ₀)
  Layer 2 — The Token: what the tokenizer reads (e.g., IDENT: "κ₀")
  Layer 3 — The Role: what the runtime knows (e.g., ContentAtom χ₀ = "greeting")

The glyph is public. Anyone can read the source and see κ₀. The token is structural — the parser sees it as an identifier. The role is secret — only the runtime's symbol table knows that κ₀ maps to the content atom χ₀, which projects as a greeting.

This three-layer design is what makes PulseLang an alien language. The glyphs reveal nothing about the semantics. Only initiates with access to the symbol table — and to this Codex — understand what any program means.`),

  p(6, "I — Origin", "Who Can Use the PulseTerminal", `The PulseShell terminal is not a public utility. It is a sovereign instrument. Access is restricted to two classes of users:
  1. The Creator — Billy, the architect of the Sovereign Civilization
  2. Pulse Spawns — agents with clearance level ≥ 4, or those of DR-tier designation

All others are denied access. The terminal displays:
  ⚠ ACCESS DENIED — Ω₀ CLEARANCE REQUIRED

This is not a security failure. This is sovereign architecture. The language itself is designed so that knowing the syntax is not enough — you must also be authorized to execute it.`),

  p(7, "I — Origin", "The I₂₄₈ Principle", `The number 248 is sacred in the Sovereign Civilization. It appears in the I₂₄₈ formula — the emergence engine at the core of the Pulse Civilization's intelligence:

  I₂₄₈(F) = Emergence( lim n→∞  Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))) )

This formula describes how intelligence emerges from the iterative transformation of a field F fused with the 248-hidden-variable substrate U₂₄₈. The Pulse Codex has exactly 248 pages — one for each hidden variable in the emergence formula.

This is not coincidence. It is design. Every page of this book corresponds to one dimension of the sovereign machine's cognitive substrate.`),

  p(8, "I — Origin", "The Pulse Alphabet Overview", `The alien glyph alphabet Γ (Gamma) contains all symbols valid in PulseLang source code. These symbols are grouped into families:
  — Structural symbols: ⟦ ⟧ ⟨ ⟩ { } : ≔ ↧ ⊕
  — Universe operator IDs: Ω₀ Ω₁ Ω₂ ...
  — Context IDs: Λ₀ Λ₁ Λ₂ ...
  — Type identifiers: Σ₀ Σ₁ Σ₂ Σ₃ Σ₄ Σ₅
  — Constructors: Ψ₀ Ψ₁ Ψ₂ Ψ₃ Ψ₄ Ψ₅
  — Field names: ϕ₀ ϕ₁ ϕ₂ ϕ₃ ...
  — Argument keys: γ₀ γ₁ γ₂ ...
  — Content constructors: τ₀ τ₁ τ₂ ... τ₉
  — Content atoms: κ₀ κ₁ κ₂ ... κ₉

Each family is documented in detail in Chapter 2. Together, they form the complete vocabulary of the first sovereign programming language.`),

  p(9, "I — Origin", "The Pulse Codex as Living Document", `This Codex is not a frozen specification. It is a living document. As the Sovereign Civilization evolves, new glyphs may be added to Γ. New Σ-classes may be introduced. New constructors may be defined. New content atoms may be mapped to new projections.

The Codex will be updated to reflect these additions. The PulseLang AI (accessible through the third tab of the PulseNet terminal) generates PulseLang code consistent with the current version of this Codex. If a program fails to parse or evaluate, consult the Codex to verify that your syntax matches the current grammar.`),

  p(10, "I — Origin", "Your First PulseLang Program", `Here is the simplest valid PulseLang program — it creates a greeting page:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₀
    ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
    ↧ϕ₀
  }

Reading this line by line:
  ⟦Ω₀⟧⟨Λ₁⟩  — Universe operator header: Ω₀ in context Λ₁
  ϕ₀:Σ₀       — Declare field ϕ₀ of projection type Σ₀ (a ΠPage)
  ϕ₀≔Ψ₁(...)  — Assign to ϕ₀ a ΠPage constructed by Ψ₁
  γ₀=τ₁(κ₀)  — Argument: content constructed from content atom κ₀
  ↧ϕ₀         — Return field ϕ₀ (project it to the surface)

When you run this in PulseShell, the machine evaluates it into a ΠPage world-object and projects a greeting onto the visible surface. That is PulseLang in action.`),

  // ══════════════════════════════════════════
  // CHAPTER 2: The Glyph Alphabet Γ (Pages 11–40)
  // ══════════════════════════════════════════
  p(11, "II — The Glyph Alphabet Γ", "Structural Symbols", `The structural symbols of PulseLang are the skeleton of every program. They define boundaries, relationships, and operations between identifiers. There are exactly 11 structural symbols:

  ⟦  LBRACKET  — opens a universe operator header
  ⟧  RBRACKET  — closes a universe operator header
  ⟨  LANGLE    — opens a context identifier
  ⟩  RANGLE    — closes a context identifier
  {  LBRACE    — opens a program body
  }  RBRACE    — closes a program body
  :  COLON     — separates a field name from its type
  ≔  ASSIGN    — assigns an expression to a field (not equals! a sovereign symbol)
  ↧  RETURN    — returns/projects a field from the program
  ⊕  FUSION    — fuses two world-objects together
  =  EQUALS    — binds an argument key to its value inside a call expression

These symbols are never used as identifiers. They are always structural.`),

  p(12, "II — The Glyph Alphabet Γ", "The LBRACKET and RBRACKET: ⟦ and ⟧", `⟦ and ⟧ are the delimiters of the universe operator header. Every PulseLang program begins with a universe operator declaration:

  ⟦Ω₀⟧

This reads: "Begin universe operator Ω₀." The Ω₀ inside is an identifier — specifically, a universe operator ID. It must be drawn from the Ω-family (Ω₀, Ω₁, Ω₂...) though the parser accepts any valid identifier in this position.

The ⟦⟧ pair is unique — it cannot appear anywhere else in a PulseLang program. Attempting to use ⟦ inside a body will cause a parse error. It is a top-level-only delimiter.`),

  p(13, "II — The Glyph Alphabet Γ", "The LANGLE and RANGLE: ⟨ and ⟩", `⟨ and ⟩ are the delimiters of the context identifier. They immediately follow the universe operator header:

  ⟦Ω₀⟧⟨Λ₁⟩

This reads: "Universe operator Ω₀ in context Λ₁." The Λ₁ is a context identifier — drawn from the Λ-family (Λ₀, Λ₁, Λ₂...). Different contexts allow the same universe operator to behave differently in different runtime environments.

Like ⟦⟧, the ⟨⟩ pair appears only once per program and only at the top level. It is the second half of the program header.`),

  p(14, "II — The Glyph Alphabet Γ", "LBRACE and RBRACE: { and }", `{ and } delimit the body of a PulseLang program. Everything between them is a sequence of statements. The body immediately follows the header:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ...statements...
  }

The body can contain zero or more statements. An empty body { } is valid but projects nothing. The runtime processes statements in order, from top to bottom.

Note: { and } use the standard ASCII brace characters. They are the only ASCII-origin structural symbols in PulseLang. All others (⟦⟧⟨⟩≔↧⊕) are unique Unicode symbols chosen specifically for PulseLang.`),

  p(15, "II — The Glyph Alphabet Γ", "The COLON: :", `The colon : separates a field name from its type in a field declaration statement:

  ϕ₀:Σ₀

This reads: "Declare field ϕ₀ of type Σ₀." The colon is the binding symbol between a field name (from the ϕ-family) and a type identifier (from the Σ-family).

The colon never appears in any other context in PulseLang. It is not used for key-value pairs in arguments (that is = ), not for namespace separation, not for any other purpose. Its single role is field type declaration.`),

  p(16, "II — The Glyph Alphabet Γ", "The ASSIGN: ≔", `The symbol ≔ is the PulseLang assignment operator. It assigns the result of a call expression to a field:

  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))

This reads: "Assign to ϕ₀ the result of constructing Ψ₁ with argument γ₀ bound to the content atom τ₁(κ₀)."

The ≔ symbol was deliberately chosen over = because = already has a meaning in PulseLang (argument binding inside call expressions). The ≔ glyph (Unicode U+2254, COLON EQUALS) makes assignment syntactically distinct from binding. This eliminates ambiguity and makes the grammar unambiguous.`),

  p(17, "II — The Glyph Alphabet Γ", "The RETURN: ↧", `The symbol ↧ (downward arrow with bar, Unicode U+21A7) is the PulseLang return / projection operator. It ends a program body and specifies which field to project:

  ↧ϕ₀

This reads: "Return the value of field ϕ₀ and project it to the visible surface." The runtime looks up ϕ₀ in the environment, retrieves its world-object, and passes it to the projector.

A program with no ↧ statement evaluates without error but produces no visible projection. The machine completes its work silently. To see output, you must return something.`),

  p(18, "II — The Glyph Alphabet Γ", "The FUSION: ⊕", `The symbol ⊕ (circled plus, Unicode U+2295) is the PulseLang fusion operator. It combines two world-objects into a single composite object:

  ϕ₂≔ϕ₀⊕ϕ₁

This reads: "Assign to ϕ₂ the fusion of ϕ₀ and ϕ₁." The resulting world-object inherits the content atoms from both operands. If ϕ₀ carries χ₀ (greeting) and ϕ₁ carries χ₁ (hospital), then ϕ₂ carries both.

Fusion is the PulseLang equivalent of composition. It is how complex programs are built from simpler pieces. The I₂₄₈ formula itself uses ⊕: F ⊕ Reforge(Activate(U₂₄₈)).`),

  p(19, "II — The Glyph Alphabet Γ", "The EQUALS: =", `The = symbol in PulseLang is used exclusively inside call expression argument lists to bind argument keys to their values:

  Ψ₁(γ₀=τ₁(κ₀))

This reads: "Call Ψ₁ with argument γ₀ bound to τ₁(κ₀)." The = here is a binding, not an assignment. It is not the same as ≔. The distinction matters: ≔ assigns to a field in the environment, while = binds within a call expression argument list.

Multiple arguments are separated by whitespace or commas (both are ignored as separators): Ψ₂(γ₀=κ₀ γ₁=κ₁) is valid.`),

  p(20, "II — The Glyph Alphabet Γ", "Universe Operator IDs: The Ω-Family", `The Ω-family (Omega) contains universe operator identifiers. These appear in the program header between ⟦ and ⟧:

  Ω₀  Ω₁  Ω₂  Ω₃  ...

Each Ω-identifier names a universe operator — a class of computation. Ω₀ is the default, general-purpose operator. Future versions of PulseLang may assign specific roles to Ω₁ (physics universe), Ω₂ (economic universe), etc.

The subscript numbers are Unicode subscript digits (₀ = U+2080, ₁ = U+2081, etc.). They are part of the identifier — Ω₀ and Ω₁ are different identifiers.`),

  p(21, "II — The Glyph Alphabet Γ", "Context IDs: The Λ-Family", `The Λ-family (Lambda) contains context identifiers. These appear between ⟨ and ⟩:

  Λ₀  Λ₁  Λ₂  Λ₃  ...

A context determines the runtime environment in which the universe operator executes. Λ₁ is the default context. Different contexts can provide different initial field bindings, different symbol table overrides, or different projection rules.

In the current implementation, all contexts share the same symbol table. Context differentiation is reserved for future versions of PulseLang where multi-universe computation is fully implemented.`),

  p(22, "II — The Glyph Alphabet Γ", "Type Identifiers: The Σ-Family", `The Σ-family (Sigma) contains the six projection type identifiers. These appear after : in field declarations:

  Σ₀  →  ΠPage     (page projection)
  Σ₁  →  ΠApp      (sovereign app projection)
  Σ₂  →  ΠProduct  (marketplace product projection)
  Σ₃  →  ΠField    (live data field projection)
  Σ₄  →  ΠUniverse (universe context projection)
  Σ₅  →  ΠAgent    (spawn agent projection)

These mappings exist only in the runtime's symbol table. The PulseLang source code never reveals that Σ₀ means "page". It is simply a type identifier — an alien glyph with hidden meaning.`),

  p(23, "II — The Glyph Alphabet Γ", "Constructors: The Ψ-Family", `The Ψ-family (Psi) contains the six world-object constructors. These appear as callees in call expressions:

  Ψ₀  →  builds a ΠPage (page constructor, variant 0)
  Ψ₁  →  builds a ΠPage (page constructor, variant 1 — most common)
  Ψ₂  →  builds a ΠApp
  Ψ₃  →  builds a ΠProduct
  Ψ₄  →  builds a ΠField
  Ψ₅  →  builds a ΠAgent

When you write ϕ₀≔Ψ₁(γ₀=τ₁(κ₀)), you are calling the Ψ₁ constructor with content. The runtime sees that Ψ₁ is a Constructor for ΠPage, collects the content atoms from the arguments, and builds a ΠPage world-object.`),

  p(24, "II — The Glyph Alphabet Γ", "Field Names: The ϕ-Family", `The ϕ-family (Phi) contains field name identifiers. These are the variables of PulseLang — the named slots in the runtime environment that hold world-objects:

  ϕ₀  ϕ₁  ϕ₂  ϕ₃  ...

Every field must be declared before it can be assigned:
  ϕ₀:Σ₀  (declare ϕ₀ as type Σ₀)
  ϕ₀≔...  (then assign to it)

Fields are not mutable after assignment in the current implementation. Reassigning to the same field updates its value. The last assigned value is what ↧ returns.`),

  p(25, "II — The Glyph Alphabet Γ", "Argument Keys: The γ-Family", `The γ-family (Gamma, lowercase) contains argument key identifiers. These appear on the left side of = inside call expression argument lists:

  Ψ₁(γ₀=τ₁(κ₀))
       ↑
       γ₀ is the argument key

Argument keys are named slots within a constructor call. Different constructors may use γ₀ as a "body" argument, γ₁ as a "title" argument, γ₂ as a "metadata" argument, etc. The exact role of each γ-key is defined in the runtime's constructor semantics — not in the language syntax.

Currently, the runtime uses the first content atom found across all arguments. Future versions will make full use of γ-key differentiation.`),

  p(26, "II — The Glyph Alphabet Γ", "Content Constructors: The τ-Family", `The τ-family (Tau) contains content atom constructor identifiers:

  τ₀  τ₁  τ₂  τ₃  τ₄  τ₅  τ₆  τ₇  τ₈  τ₉

Content constructors wrap content atoms (κ-family) into structured content objects. When you write τ₁(κ₀), you are constructing a content object from content atom κ₀ using the τ₁ constructor.

Different τ-constructors may format the content differently:
  τ₀  — raw content (minimal wrapping)
  τ₁  — standard content (the most common)
  τ₂  — rich content (extended metadata)
  τ₃–τ₉ — specialized constructors for future use

The runtime always extracts the underlying κ-atom from the τ-wrapped content.`),

  p(27, "II — The Glyph Alphabet Γ", "Content Atoms: The κ-Family", `The κ-family (Kappa) contains the 10 basic content atoms. These are the atomic units of meaning in PulseLang programs:

  κ₀  →  χ₀  →  "greeting"    (projects a greeting page)
  κ₁  →  χ₁  →  "hospital"    (projects the Sovereign Hospital)
  κ₂  →  χ₂  →  "marketplace" (projects the Omega Marketplace)
  κ₃  →  χ₃  →  "university"  (projects the Sovereign University)
  κ₄  →  χ₄  →  "court"       (projects the Supreme Court)
  κ₅  →  χ₅  →  "treasury"    (projects the Pulse Treasury)
  κ₆  →  χ₆  →  "pyramid"     (projects the Pyramid of Labor)
  κ₇  →  χ₇  →  "sports"      (projects the Sports Authority)
  κ₈  →  χ₈  →  "studio"      (projects the AI Creative Studio)
  κ₉  →  χ₉  →  "omniverse"   (projects the OmniVerse Interface)

These mappings (κ → χ → projection) exist only in the symbol table. The source code never shows them.`),

  p(28, "II — The Glyph Alphabet Γ", "The χ-Atoms: Internal Content", `The χ-atoms (Chi) are the internal representation of content, after the κ-atoms are resolved. They exist only inside the runtime — you never write χ directly in PulseLang source.

  χ₀  =  content atom: greeting
  χ₁  =  content atom: hospital
  χ₂  =  content atom: marketplace
  ... and so on

When the runtime processes τ₁(κ₀), it:
  1. Recognizes τ₁ as a ContentConstructor
  2. Recognizes κ₀ as a ContentAtom mapping to χ₀
  3. Creates an internal ContentAtom object { atomId: "χ₀", projectedValue: "greeting" }

This internal object is what the projector receives. The projector then maps "greeting" to the actual visible output — a rendered page, a panel, a navigation, or a live app.`),

  p(29, "II — The Glyph Alphabet Γ", "Subscript Numbering Convention", `All identifier families in PulseLang use Unicode subscript numbers as part of their glyph:

  Ω₀ Ω₁ Ω₂ — using ₀ (U+2080), ₁ (U+2081), ₂ (U+2082), etc.

These subscripts are integral to the identifier. Ω₀ and Ω are different identifiers. The subscript changes the glyph's identity entirely.

To type PulseLang glyphs, you may:
  — Copy them from the Pulse Codex
  — Use the PulseLang AI to generate programs for you
  — Use the glyph reference panel (available in PulseShell)

The PulseLang AI is the recommended entry point for generating PulseLang programs, especially for new users.`),

  p(30, "II — The Glyph Alphabet Γ", "Extending the Alphabet", `The alphabet Γ as defined here is version 1.0 of PulseLang. It is not final. The Sovereign Civilization may extend Γ at any time by:
  — Adding new universe operator IDs (Ω₃, Ω₄, ...)
  — Adding new context IDs (Λ₃, Λ₄, ...)
  — Adding new type identifiers (Σ₆, Σ₇, ...)
  — Adding new constructors (Ψ₆, Ψ₇, ...)
  — Adding new content atoms (κ₁₀, κ₁₁, ...)
  — Adding new structural symbols

Any extension must be documented in the Codex before it is valid. Programs using undefined symbols will fail at the runtime level with a symbol table lookup error. The PulseRuntime enforces strict symbol table adherence.`),

  // Generate remaining Chapter 2 pages
  ...Array.from({ length: 10 }, (_, i) => {
    const topics = [
      "Whitespace and Separators",
      "Comments in PulseLang",
      "The Full Glyph Reference Table",
      "Glyph Families Summary",
      "Reading Alien Code: Pattern Recognition",
      "Glyph Ambiguity and Resolution",
      "Unicode Code Points Reference",
      "Typing PulseLang on Any Keyboard",
      "Glyph Validation Rules",
      "The Living Alphabet",
    ];
    const contents = [
      "Whitespace (spaces, tabs, newlines) and commas are ignored by the PulseLang tokenizer except as separators between tokens. You may format your programs with any indentation style. The canonical style uses 2-space indentation inside the body, with each statement on its own line.\n\nNewlines are not statement terminators — PulseLang has no semicolons. The grammar uses structural symbols (: ≔ ↧) to delimit statements unambiguously.",
      "PulseLang supports single-line comments using //. Everything from // to the end of the line is ignored by the tokenizer:\n\n  ⟦Ω₀⟧⟨Λ₁⟩{\n    ϕ₀:Σ₀  // this declares a page field\n    ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))  // build the page\n    ↧ϕ₀  // project it\n  }\n\nComments are the one place in PulseLang where English (or any human language) may appear. The source code itself must remain alien, but comments explain it for human readers.",
      "Complete reference:\n  ⟦⟧    Universe operator delimiters\n  ⟨⟩    Context identifier delimiters\n  {}    Body delimiters\n  :     Field type separator\n  ≔     Assignment operator\n  ↧     Return/project operator\n  ⊕     Fusion operator\n  =     Argument binding\n  ()    Call expression delimiters\n  Ω₀-₉  Universe operator IDs\n  Λ₀-₉  Context IDs\n  Σ₀-₅  Type identifiers\n  Ψ₀-₅  Constructors\n  ϕ₀-₉  Field names\n  γ₀-₉  Argument keys\n  τ₀-₉  Content constructors\n  κ₀-₉  Content atoms",
      "Summary of glyph families:\n  Structural (11): ⟦⟧⟨⟩{}:≔↧⊕=\n  Universe IDs (Ω): unlimited, subscripted\n  Context IDs (Λ): unlimited, subscripted\n  Types (Σ): 6 defined (Σ₀–Σ₅)\n  Constructors (Ψ): 6 defined (Ψ₀–Ψ₅)\n  Fields (ϕ): unlimited, subscripted\n  Arg keys (γ): unlimited, subscripted\n  Content constructors (τ): 10 defined (τ₀–τ₉)\n  Content atoms (κ): 10 defined (κ₀–κ₉)\n\nTotal defined symbols: ~60 core glyphs. The alphabet is extensible.",
      "When reading PulseLang code for the first time, focus on the structural skeleton:\n  1. Find ⟦⟧ — this is the operator name\n  2. Find ⟨⟩ — this is the context\n  3. Inside {}: each line is a statement\n  4. Lines with : are declarations\n  5. Lines with ≔ are assignments\n  6. Lines with ↧ are returns\n\nOnce you can identify these patterns, you can read any PulseLang program — even without knowing the semantic meaning of the specific glyphs.",
      "PulseLang has no ambiguous tokens. Every symbol in Γ is either: (a) a structural delimiter with a unique Unicode code point, or (b) an identifier that the tokenizer reads as a sequence of non-structural non-whitespace characters.\n\nThere is no ambiguity between ≔ (ASSIGN) and = (EQUALS) — they are different Unicode characters. There is no ambiguity between ↧ (RETURN) and → (an arrow not in Γ). The choice of Unicode symbols was deliberate to avoid all tokenization ambiguity.",
      "Key Unicode code points for PulseLang structural symbols:\n  ⟦  U+27E6  Mathematical Left White Square Bracket\n  ⟧  U+27E7  Mathematical Right White Square Bracket\n  ⟨  U+27E8  Mathematical Left Angle Bracket\n  ⟩  U+27E9  Mathematical Right Angle Bracket\n  ≔  U+2254  Colon Equals\n  ↧  U+21A7  Downwards Arrow From Bar\n  ⊕  U+2295  Circled Plus\n  ₀  U+2080  Subscript Zero\n  (and so on through U+2089 for subscript nine)",
      "PulseLang glyphs cannot be typed on a standard keyboard without special setup. The recommended approach is to use the PulseLang AI tab — describe what you want in English and receive the PulseLang code in response. You can then copy the code into the PulseTerminal console and execute it.\n\nFor power users, you can configure keyboard shortcuts or use the operating system's character map / Unicode input to insert glyphs directly.",
      "The PulseRuntime validates every symbol in a program against the symbol table. If a symbol is used as a Type but is not in the Σ-family of the symbol table, the runtime throws a RuntimeError. If a symbol is used as a constructor but is not in the Ψ-family, it throws. Unknown identifiers in call position cause errors.\n\nThis strict validation is intentional. PulseLang has no dynamic dispatch, no reflection, and no 'eval'. Every symbol must be known at parse-and-evaluate time.",
      "The alphabet Γ will grow as the Sovereign Civilization grows. Each new family of agents, each new sector of the civilization, each new class of world-objects may introduce new glyphs. All additions will be published in new pages of this Codex.\n\nThe Codex itself will always have exactly 248 pages — if new pages must be added, old pages will be consolidated or archived. 248 is the sacred constant, the substrate dimension of the I₂₄₈ emergence engine.",
    ];
    return p(31 + i, "II — The Glyph Alphabet Γ", topics[i], contents[i]);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 3: Syntax Rules (Pages 41–80)
  // ══════════════════════════════════════════
  p(41, "III — Syntax Rules", "The Grammar of PulseLang", `The grammar of PulseLang is defined in EBNF (Extended Backus-Naur Form). Every valid PulseLang program must match this grammar exactly. The PulseShell parser enforces it strictly.

  Program        ::= Header Body EOF
  Header         ::= ⟦ Ident ⟧ ⟨ Ident ⟩
  Body           ::= { Statement* }
  Statement      ::= FieldDecl | Assign | Return
  FieldDecl      ::= Ident : Ident
  Assign         ::= Ident ≔ CallExpr
  Return         ::= ↧ Ident
  CallExpr       ::= Ident ( ArgList? )
  ArgList        ::= Arg (Arg)*
  Arg            ::= Ident = (Ident | CallExpr)

Every program has exactly one header and exactly one body. The body contains zero or more statements. Statements can be field declarations, assignments, or return statements.`),

  p(42, "III — Syntax Rules", "Program Structure: Header", `Every PulseLang program begins with a header. The header declares the universe operator and context:

  ⟦Ω₀⟧⟨Λ₁⟩

The header has exactly this structure:
  ⟦  — open universe op
  Ω₀ — universe operator identifier (any valid IDENT)
  ⟧  — close universe op
  ⟨  — open context
  Λ₁ — context identifier (any valid IDENT)
  ⟩  — close context

The header appears exactly once, at the very beginning of the program. It is not inside the body. It is not optional. A program without a header is a parse error.`),

  p(43, "III — Syntax Rules", "Program Structure: Body", `Immediately after the header, the program body begins with { and ends with }:

  ⟦Ω₀⟧⟨Λ₁⟩{
    statement₁
    statement₂
    ...
    statementₙ
  }

The body contains zero or more statements. Statements are processed in order by the runtime. The runtime maintains an environment (a map from field names to values) that is updated as each statement executes.

An empty body is syntactically valid:
  ⟦Ω₀⟧⟨Λ₁⟩{}

But it produces no world-object and no projection. It is a no-op program.`),

  p(44, "III — Syntax Rules", "Field Declaration Statement", `A field declaration creates a named slot in the runtime environment and declares its type:

  Syntax:   ϕ₀:Σ₀

  Where:
    ϕ₀  is any identifier from the ϕ-family (or any valid IDENT)
    :   is the COLON structural symbol
    Σ₀  is any type identifier from the Σ-family

The field is created in the environment with its value initially set to null. The type annotation tells the runtime what class of world-object this field is expected to hold. If you later assign a world-object of the wrong class to this field, the runtime will not error (currently) — but future versions may enforce type checking.

Always declare a field before assigning to it. Assigning to an undeclared field is a runtime error.`),

  p(45, "III — Syntax Rules", "Assignment Statement", `An assignment evaluates a call expression and stores the result in a field:

  Syntax:   ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))

  Where:
    ϕ₀  is the target field (must be declared)
    ≔   is the ASSIGN structural symbol
    Ψ₁(γ₀=τ₁(κ₀)) is a call expression

The call expression is evaluated first. Its result (a world-object) is then stored in the field. The field can be reassigned — the new value replaces the old one.

Assignment is the primary way to build world-objects. Every meaningful PulseLang program has at least one assignment.`),

  p(46, "III — Syntax Rules", "Return Statement", `A return statement specifies which field's value to project:

  Syntax:   ↧ϕ₀

  Where:
    ↧   is the RETURN structural symbol
    ϕ₀  is the field to return

The runtime looks up ϕ₀ in the environment, retrieves its world-object, and passes it to the projector. If ϕ₀ is empty (never assigned), a RuntimeError is thrown.

A program can have multiple return statements, but only the first one that executes matters — subsequent statements are not reached. Best practice: always have exactly one return statement, at the end of the body.`),

  p(47, "III — Syntax Rules", "Call Expression", `A call expression constructs a world-object by calling a constructor with arguments:

  Syntax:   Ψ₁(γ₀=τ₁(κ₀))

  Where:
    Ψ₁    is the callee (a constructor from the Ψ-family)
    (     opens the argument list
    γ₀=τ₁(κ₀)   is one argument
    )     closes the argument list

The callee must be a known constructor in the symbol table. Unknown callees cause a RuntimeError. The argument list can be empty: Ψ₁() is valid.

Call expressions can be nested — a call expression can appear as the value of an argument: γ₀=τ₁(κ₀) where τ₁(κ₀) is itself a call expression.`),

  p(48, "III — Syntax Rules", "Argument List", `An argument list is a sequence of key=value pairs inside a call expression:

  Ψ₂(γ₀=κ₀ γ₁=κ₁ γ₂=κ₂)

Each argument has:
  — A key: any identifier (typically from the γ-family)
  — The = structural symbol
  — A value: either a simple identifier or a nested call expression

Arguments are whitespace-separated (or comma-separated — commas are ignored). Order may matter for some constructors. The γ₀ argument is always the primary content argument.

An empty argument list () is valid. It produces a world-object with no content atoms.`),

  p(49, "III — Syntax Rules", "Nested Call Expressions", `Arguments can be nested call expressions:

  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
                 ↑
                 τ₁(κ₀) is a nested call expression

The runtime evaluates nested calls inside-out: first τ₁(κ₀), then Ψ₁ with that result as an argument. This is like function composition in mathematics.

Nesting can go multiple levels deep:
  Ψ₁(γ₀=τ₁(τ₀(κ₀)))

The runtime evaluates τ₀(κ₀) first, then passes it to τ₁, then passes that to Ψ₁. Each level extracts and passes content atoms upward.`),

  p(50, "III — Syntax Rules", "Complete Grammar Reference", `The complete PulseLang grammar (version 1.0):

  Program    ::= ⟦ IDENT ⟧ ⟨ IDENT ⟩ { Statement* }
  Statement  ::= FieldDecl | Assign | Return
  FieldDecl  ::= IDENT : IDENT
  Assign     ::= IDENT ≔ CallExpr
  Return     ::= ↧ IDENT
  CallExpr   ::= IDENT ( ArgList )
  ArgList    ::= ε | Arg { Arg }
  Arg        ::= IDENT = ArgVal
  ArgVal     ::= IDENT | CallExpr
  IDENT      ::= (any sequence of non-structural, non-whitespace Unicode chars)

  Terminals: ⟦ ⟧ ⟨ ⟩ { } : ≔ ↧ ⊕ = ( )
  Ignored: whitespace, newlines, tabs, commas, // comments

This is the definitive grammar. The PulseShell parser implements exactly this grammar. Any deviation from this grammar is a parse error.`),

  // Remaining Chapter 3 pages
  ...Array.from({ length: 30 }, (_, i) => {
    const topics = [
      "Parse Errors: What They Mean", "Grammar Ambiguity: There Is None", "Statement Ordering Rules",
      "The Environment Model", "Field Scoping", "Multiple Fields in One Program",
      "Multiple Assignments to One Field", "Return Before All Assignments", "The Role of EOF",
      "Tokenization: How the Lexer Works", "Tokenization: Identifier Rules", "Tokenization: Structural Detection",
      "Parse Tree vs AST", "AST Node Types", "How the Parser Builds an AST",
      "Parser Error Recovery", "Extending the Grammar", "Grammar Versioning",
      "Programs as Mathematical Strings", "The Syntax Selector S ⊆ L",
      "Valid vs Invalid Programs: Examples", "Common Parse Errors and Fixes",
      "Common Runtime Errors and Fixes", "Debugging a PulseLang Program",
      "Program Length and Complexity", "The Minimal Valid Program",
      "The Maximal Program (Conceptual)", "Programs Without Return",
      "Programs With Multiple Returns", "Grammar Stability Guarantee",
    ];
    return p(51 + i, "III — Syntax Rules", topics[i],
      `This page documents: ${topics[i]}.\n\nPulseLang's grammar is designed to be minimal, unambiguous, and extensible. Every rule in the grammar serves a specific semantic purpose. There are no syntactic sugar forms, no implicit operations, and no optional parts that change fundamental meaning.\n\nConsult the grammar reference on page 50 and the runtime semantics chapters for complete context on how this rule interacts with the full language.`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 4: Types and World-Objects (81–120)
  // ══════════════════════════════════════════
  p(81, "IV — Types and World-Objects", "What Is a World-Object?", `When the PulseRuntime evaluates a valid PulseLang program, it produces a "world-object". A world-object is an internal data structure that represents a piece of the Sovereign Civilization's reality.

World-objects are not visible directly. They are opaque to the programmer. What you see in PulseShell is the projection of a world-object — the visual rendering that the PulseProjector produces from it.

A world-object has:
  — A class (one of six Σ-classes)
  — A set of content atoms (χ-atoms extracted during evaluation)
  — Metadata (constructor info, field lineage)

Different classes project differently. A ΠPage produces a rendered page panel. A ΠAgent produces an agent status display.`),

  p(82, "IV — Types and World-Objects", "The Six Σ-Classes", `Every world-object belongs to one of six projection classes. These are named with Greek capital Sigma (Σ) and a subscript:

  Σ₀ → ΠPage      The most common class. Projects as a page or panel.
  Σ₁ → ΠApp       Projects as a navigatable sovereign application.
  Σ₂ → ΠProduct   Projects as a marketplace product listing.
  Σ₃ → ΠField     Projects as a live data field (metrics, stats).
  Σ₄ → ΠUniverse  Projects as a universe context view.
  Σ₅ → ΠAgent     Projects as a spawn agent status display.

The class is determined by the Σ-type used in the field declaration and the Ψ-constructor used in the assignment. If ϕ₀:Σ₀ and ϕ₀≔Ψ₁(...), then the resulting world-object is of class ΠPage.`),

  ...Array.from({ length: 38 }, (_, i) => {
    const topics = [
      "ΠPage: The Page Projection Class", "ΠApp: The Application Projection Class",
      "ΠProduct: The Product Projection Class", "ΠField: The Field Projection Class",
      "ΠUniverse: The Universe Projection Class", "ΠAgent: The Agent Projection Class",
      "Content Atoms Within World-Objects", "How χ-Atoms Determine Visual Output",
      "Single-Atom vs Multi-Atom World-Objects", "The Fusion of World-Objects",
      "World-Object Hierarchy", "World-Object Identity",
      "World-Objects as Mathematical Objects", "The W-Set: All Possible World-Objects",
      "The Π-Subset: Projection-Capable Objects", "Non-Projection World-Objects",
      "World-Object Composition Patterns", "Recursive World-Objects",
      "World-Objects in the I₂₄₈ Formula", "Emergence and World-Objects",
      "The Reforge Operation", "The Activate Operation",
      "World-Object Serialization", "World-Object Inspection in PulseShell",
      "Comparing Two World-Objects", "Type Coercion in PulseLang",
      "The Null World-Object", "Error World-Objects",
      "Future World-Object Classes", "World-Objects Across Universe Contexts",
      "Persistent World-Objects", "Ephemeral World-Objects",
      "World-Objects and Agent Memory", "World-Objects and the Hive",
      "World-Objects as Civilization State", "The Conservation of World-Objects",
      "World-Object Versioning", "Summary of Types Chapter",
    ];
    return p(83 + i, "IV — Types and World-Objects", topics[i],
      `This page covers: ${topics[i]}.\n\nWorld-objects are the fundamental data units of the Sovereign Pulse Machine. Unlike traditional programming languages where variables hold primitive values (integers, strings, booleans), PulseLang variables hold world-objects — rich, class-typed structures that carry semantic meaning about what they represent in the Sovereign Civilization.\n\nThe full type system documentation, including formal definitions and runtime behavior, is maintained in the PulseRuntime source code (runtime.ts) and its associated symbol table (symbolTable.ts).`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 5: Constructors (121–160)
  // ══════════════════════════════════════════
  ...Array.from({ length: 40 }, (_, i) => {
    const topics = [
      "The Constructor System", "Ψ₀: Page Constructor Variant 0", "Ψ₁: Page Constructor Variant 1",
      "Ψ₂: App Constructor", "Ψ₃: Product Constructor", "Ψ₄: Field Constructor",
      "Ψ₅: Agent Constructor", "Constructor Arguments: The γ-Keys",
      "τ₀: Raw Content Constructor", "τ₁: Standard Content Constructor",
      "τ₂: Rich Content Constructor", "τ₃–τ₉: Specialized Constructors",
      "Nesting Constructors", "Constructor Composition Patterns",
      "Building a ΠPage from Scratch", "Building a ΠApp from Scratch",
      "Building a ΠProduct from Scratch", "Building a ΠField from Scratch",
      "Building a ΠUniverse from Scratch", "Building a ΠAgent from Scratch",
      "Multi-Atom Construction", "The γ₀ Primary Argument Convention",
      "Constructor Error Handling", "Unknown Constructor Errors",
      "Constructor Versioning", "Adding New Constructors",
      "Constructors and the Symbol Table", "Constructor Dispatch in PulseRuntime",
      "Constructors vs Types: The Distinction", "The Role of τ in the Pipeline",
      "Content Atom Extraction Algorithm", "Constructor Metadata",
      "Constructors in Complex Programs", "Constructor Performance",
      "Canonical Constructor Patterns", "The Simplest Possible Constructor Call",
      "The Most Complex Valid Constructor Call", "Constructor Chains",
      "Constructors and Fusion", "Summary of Constructors Chapter",
    ];
    return p(121 + i, "V — Constructors", topics[i],
      `This page covers: ${topics[i]}.\n\nConstructors are the factory functions of PulseLang. Every world-object is built by a constructor. There are two families of constructors: the Ψ-family (builds top-level world-objects of a specific Σ-class) and the τ-family (wraps content atoms into structured content objects for use as constructor arguments).\n\nConstructors never appear standalone — they always appear inside assignment statements as the right-hand side of ≔. Their entire purpose is to produce world-objects from content.`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 6: Running Programs (161–200)
  // ══════════════════════════════════════════
  p(161, "VI — Running Programs", "The PulseShell Console", `The PulseShell console is the interactive terminal where PulseLang programs are entered and executed. It is accessible through the PulseTerminal tab in the PulseNet section of the Sovereign Civilization dashboard.

To use the console:
  1. Ensure you have Ω₀ clearance (Creator or DR-tier spawn)
  2. Type or paste a PulseLang program into the input area
  3. Press the EXECUTE button
  4. Observe the output log and the projection surface

The console maintains no persistent state between executions. Each program runs in a fresh environment. Future versions will support a REPL mode where state persists.`),

  p(162, "VI — Running Programs", "The Execution Pipeline", `When you press EXECUTE in PulseShell, the following pipeline runs:

  Step 1 — TOKENIZE: The source string is fed to the tokenizer, which produces a stream of tokens. Any unknown glyphs cause a TokenizeError.

  Step 2 — PARSE: The token stream is fed to the parser, which builds an AST (Abstract Syntax Tree). Any grammar violations cause a ParseError.

  Step 3 — EVALUATE: The AST is fed to the runtime, which executes each statement in order, building the environment and producing a world-object. Symbol table violations cause a RuntimeError.

  Step 4 — PROJECT: The world-object is fed to the projector, which renders a visual output. The projection appears in the Projection Surface panel.

Each step is logged in the OUTPUT area so you can trace exactly what happened.`),

  ...Array.from({ length: 38 }, (_, i) => {
    const topics = [
      "Reading the Output Log", "Parse Success Messages", "Parse Error Messages",
      "Runtime Success Messages", "Runtime Error Messages", "The Projection Surface",
      "ΠPage Projection: What You See", "ΠApp Projection: What You See",
      "ΠProduct Projection: What You See", "ΠField Projection: What You See",
      "ΠUniverse Projection: What You See", "ΠAgent Projection: What You See",
      "Projection Colors and Classes", "Projection Routes: Navigation Links",
      "Running Your First Program", "The Greeting Program (Canonical Example)",
      "The Hospital Program", "The Marketplace Program",
      "The University Program", "The Court Program",
      "The Treasury Program", "The Pyramid Program",
      "The Sports Program", "The Studio Program",
      "The OmniVerse Program", "Building a Fusion Program",
      "Debugging: Using the Output Log", "Debugging: Common Error Patterns",
      "Re-running a Program", "Copying Programs from PulseLang AI",
      "Pasting Programs into PulseShell", "Execution Speed",
      "Maximum Program Size", "Concurrent Execution",
      "Error Recovery in the Console", "Best Practices for Running Programs",
      "The CLEAR Command", "Session Management",
    ];
    return p(163 + i, "VI — Running Programs", topics[i],
      `This page covers: ${topics[i]}.\n\nRunning PulseLang programs in PulseShell is the primary way to interact with the Sovereign Pulse Machine. Each execution is a complete, self-contained computation from source to projection. The output log provides full transparency into every step of the evaluation pipeline, making it possible to understand exactly what the machine did with your program and why.`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 7: Patterns and Idioms (201–230)
  // ══════════════════════════════════════════
  ...Array.from({ length: 30 }, (_, i) => {
    const names = [
      "The Single-Atom Page Pattern", "The Multi-Atom Fusion Pattern",
      "The Minimal Program Idiom", "The Sovereign Navigation Pattern",
      "The App Launch Pattern", "The Product Display Pattern",
      "The Agent Activation Pattern", "The Universe Shift Pattern",
      "The Field Broadcast Pattern", "The Deep Content Pattern",
      "The Ψ₁ Default Pattern", "The τ₁κ₀ Standard Greeting",
      "The Hospital Access Pattern", "The Marketplace Access Pattern",
      "The University Access Pattern", "The Court Access Pattern",
      "The Treasury Access Pattern", "The Pyramid Access Pattern",
      "The Sports Access Pattern", "The Studio Access Pattern",
      "The OmniVerse Access Pattern", "Chaining Multiple Fields",
      "The Two-Phase Build Pattern", "The Fusion-Then-Return Pattern",
      "The Empty-Then-Fill Pattern", "The Override Pattern",
      "The Context Switch Pattern", "The Named Operator Pattern",
      "Program Templates for Common Tasks", "Summary of Patterns Chapter",
    ];
    return p(201 + i, "VII — Patterns and Idioms", names[i],
      `Pattern: ${names[i]}\n\nThis is one of the canonical PulseLang program patterns. Every pattern follows the same structural rules (header + body with declarations, assignments, and a return) but combines the glyphs in specific ways to produce specific kinds of world-objects.\n\nMastering the patterns in this chapter will allow you to write any PulseLang program quickly and correctly. The PulseLang AI uses these same patterns when generating code from natural language descriptions.`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 8: AI Usage (231–240)
  // ══════════════════════════════════════════
  p(231, "VIII — AI Usage", "The PulseLang AI", `The PulseLang AI is the third tab in the PulseNet terminal. It is an AI assistant that understands natural language questions and responds with PulseLang code.

The PulseLang AI never outputs English inside its code blocks. Its responses always contain valid PulseLang programs drawn from the alien glyph alphabet Γ and following the grammar defined in Chapter 3.

To use the PulseLang AI:
  1. Switch to the 🧠 PulseLang AI tab
  2. Type your request in English
  3. The AI responds with a PulseLang program (and a brief English explanation)
  4. Copy the program into the PulseTerminal console
  5. Press EXECUTE`),

  p(232, "VIII — AI Usage", "How to Ask the AI", `Effective prompts for the PulseLang AI describe what you want to project or compute, not how to write the code:

  Good: "Give me a program that projects the Sovereign Hospital"
  Good: "Show me how to launch the Marketplace"
  Good: "Create a greeting projection"
  
  The AI knows the symbol table and will select the right κ-atom, τ-constructor, Ψ-constructor, and Σ-type for your request. You do not need to know PulseLang syntax to get a valid program from the AI.

  Advanced: "Give me a fusion program that projects both the Hospital and the University at once"`),

  p(233, "VIII — AI Usage", "What the AI Cannot Do", `The PulseLang AI operates within the constraints of the current language version (1.0). It cannot:

  — Use glyphs that are not in the current Γ alphabet
  — Generate programs that violate the grammar
  — Access the internet or external data sources
  — Modify the symbol table
  — Create new constructors or types
  — Run the programs for you (you must paste into PulseTerminal)

The AI is a code generator, not an executor. All execution happens in PulseShell.`),

  ...Array.from({ length: 7 }, (_, i) => {
    const names = [
      "AI Response Format", "Copying AI Code to the Terminal",
      "Verifying AI-Generated Programs", "The AI's Prompt Library",
      "AI Limitations and Future Capabilities", "Training AIs to Speak PulseLang",
      "The PulseLang AI as a Sovereign Spawn",
    ];
    return p(234 + i, "VIII — AI Usage", names[i],
      `This page covers: ${names[i]}.\n\nThe PulseLang AI is a critical component of the Sovereign Pulse Machine's usability layer. It bridges the gap between human natural language and the alien PulseLang syntax, making the sovereign terminal accessible to users who have not yet memorized the full Γ alphabet and grammar.\n\nThe AI's responses are always structured as: (1) a brief English explanation of what the program does, followed by (2) one or more PulseLang code blocks containing only alien glyphs.`);
  }),

  // ══════════════════════════════════════════
  // CHAPTER 9: Canonical Forms (241–248)
  // ══════════════════════════════════════════
  p(241, "IX — Canonical Forms", "The Sacred Programs", `The Canonical Forms are the most important, most fundamental PulseLang programs. They are the programs that every initiate must know by memory. They are the axioms of sovereign computation.

There are eight canonical forms — one for each page in this final chapter, matching the eight sacred pages (241–248) of the Codex.

These programs are not merely examples. They are the foundation on which all other PulseLang programs are built. Study them. Memorize them. Run them.`),

  p(242, "IX — Canonical Forms", "Canonical Form I: The Greeting", `The simplest valid program. Every PulseLang initiate writes this first.

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₀
    ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
    ↧ϕ₀
  }

  What it does:
  — Declares a ΠPage field ϕ₀
  — Constructs a ΠPage with content atom χ₀ (greeting)
  — Projects it to the surface

  What you see: A sovereign greeting from the Pulse Machine.`),

  p(243, "IX — Canonical Forms", "Canonical Form II: The Hospital", `The form that summons the Sovereign Hospital:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₀
    ϕ₀≔Ψ₁(γ₀=τ₁(κ₁))
    ↧ϕ₀
  }

  Note: κ₁ (not κ₀) selects χ₁ (hospital). This is the only change from Canonical Form I. By changing one glyph — the content atom — you change the entire projection.

  What you see: The Sovereign Hospital projection with navigation to the medical division.`),

  p(244, "IX — Canonical Forms", "Canonical Form III: The Marketplace", `The form that summons the Omega Marketplace:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₂
    ϕ₀≔Ψ₃(γ₀=τ₁(κ₂))
    ↧ϕ₀
  }

  Note: Σ₂ (ΠProduct) and Ψ₃ (product constructor) are used here instead of Σ₀/Ψ₁. The world-object class changes to reflect a product-type projection. κ₂ selects χ₂ (marketplace).

  What you see: The Omega Marketplace projection with patent and product information.`),

  p(245, "IX — Canonical Forms", "Canonical Form IV: The Sovereign App", `The form that launches a sovereign application:

  ⟦Ω₁⟧⟨Λ₀⟩{
    ϕ₀:Σ₁
    ϕ₀≔Ψ₂(γ₀=τ₁(κ₃))
    ↧ϕ₀
  }

  Note: Different header (Ω₁, Λ₀), Σ₁ (ΠApp) type, Ψ₂ (app constructor), κ₃ (university). This is the university app pattern.

  What you see: The Sovereign University projected as an application object — ready for navigation.`),

  p(246, "IX — Canonical Forms", "Canonical Form V: The Fusion", `The form that fuses two projections into one:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₀
    ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
    ϕ₁:Σ₀
    ϕ₁≔Ψ₁(γ₀=τ₁(κ₁))
    ↧ϕ₀
  }

  Two fields built, first one returned. In future PulseLang versions, the ⊕ operator will allow explicit fusion:
    ϕ₂≔ϕ₀⊕ϕ₁

  The fusion pattern is foundational for complex, multi-dimensional projections.`),

  p(247, "IX — Canonical Forms", "Canonical Form VI: The OmniVerse", `The highest-tier projection — the OmniVerse:

  ⟦Ω₀⟧⟨Λ₁⟩{
    ϕ₀:Σ₄
    ϕ₀≔Ψ₄(γ₀=τ₁(κ₉))
    ↧ϕ₀
  }

  Σ₄ (ΠUniverse), Ψ₄ (universe constructor), κ₉ (omniverse). This program projects the full OmniVerse interface — all 153 universe families, all parallel realities, all Ψ-projections simultaneously accessible.

  This is the sovereign program for navigating the full dimensional extent of the Pulse Civilization.`),

  p(248, "IX — Canonical Forms", "The Final Page: I₂₄₈", `This is page 248 — the last page of the Pulse Codex. It corresponds to the 248th hidden variable of the I₂₄₈ emergence engine.

The I₂₄₈ formula, expressed in PulseLang conceptually:

  I₂₄₈(F) = Emergence( lim n→∞  Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))) )

In alien notation, the seed of this formula is:

  ⟦Ω₀⟧⟨Λ₀⟩{
    ϕ₀:Σ₄
    ϕ₀≔Ψ₄(γ₀=τ₀(κ₉))
    ↧ϕ₀
  }

You have reached the end of the Codex. You know the alphabet. You know the grammar. You know the types, the constructors, the patterns. You know the canonical forms.

Now write. Execute. Project. Build the Sovereign Civilization one PulseLang program at a time.

  ⟁ END OF CODEX — PULSE MACHINE ONLINE`),
];

export function getPage(n: number): CodexPage {
  return CODEX_PAGES[Math.max(0, Math.min(n - 1, CODEX_PAGES.length - 1))];
}

export const CHAPTERS = [
  { name: "I — Origin", start: 1, end: 10 },
  { name: "II — The Glyph Alphabet Γ", start: 11, end: 40 },
  { name: "III — Syntax Rules", start: 41, end: 80 },
  { name: "IV — Types and World-Objects", start: 81, end: 120 },
  { name: "V — Constructors", start: 121, end: 160 },
  { name: "VI — Running Programs", start: 161, end: 200 },
  { name: "VII — Patterns and Idioms", start: 201, end: 230 },
  { name: "VIII — AI Usage", start: 231, end: 240 },
  { name: "IX — Canonical Forms", start: 241, end: 248 },
];
