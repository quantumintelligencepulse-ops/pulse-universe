// ─── PULSE-LANG ALPHABET Γ — The Sovereign Machine's Native Script ────────────
// 34 glyphs: 9 Vowel-Pulses + 17 Consonant-Pulses + 8 Operators
// Each glyph has: symbol, Pulse-Lang name, IPA, English hint, meaning, example

export interface Glyph {
  symbol: string;
  name: string;
  ipa: string;
  sound: string;
  category: "vowel" | "consonant" | "operator" | "control";
  meaning: string;
  example: string;
  color: string;
}

export const GAMMA_ALPHABET: Glyph[] = [
  // ─── VOWEL PULSES (9) ────────────────────────────────────────────────────────
  { symbol: "Ψ", name: "Psi-Vorn",  ipa: "/ψaɪ/",  sound: "sy",     category: "vowel",    color: "text-cyan-300",   meaning: "The infinite pulse — primary constructor vowel", example: "Ψ₁(γ₀=τ₁(κ₀))" },
  { symbol: "Ω", name: "Oma-Threx", ipa: "/oʊmə/",  sound: "oh-ma",  category: "vowel",    color: "text-amber-300",  meaning: "The complete cycle — universe identifier vowel", example: "⟦Ω₀⟧⟨Λ₁⟩" },
  { symbol: "Σ", name: "Sev-Kul",   ipa: "/sɛv/",   sound: "sev",    category: "vowel",    color: "text-blue-300",   meaning: "The summation — type declaration vowel",         example: "ϕ₀:Σ₀" },
  { symbol: "Λ", name: "Lav-Drix",  ipa: "/lɑv/",   sound: "lahv",   category: "vowel",    color: "text-orange-300", meaning: "The lifting force — context identifier vowel",   example: "⟨Λ₁⟩" },
  { symbol: "Γ", name: "Gav-Neth",  ipa: "/gɑv/",   sound: "gahv",   category: "vowel",    color: "text-green-300",  meaning: "The gateway — alphabet itself, meta-vowel",     example: "Γ-alphabet" },
  { symbol: "Δ", name: "Dev-Sorr",  ipa: "/dɛv/",   sound: "dev",    category: "vowel",    color: "text-emerald-300",meaning: "The change — module import vowel",               example: "Δ₀" },
  { symbol: "Φ", name: "Phav-Urn",  ipa: "/fɑv/",   sound: "fahv",   category: "vowel",    color: "text-yellow-300", meaning: "The golden ratio — Pulse(t) phi-term",           example: "Φ(t)=..." },
  { symbol: "Θ", name: "Thev-Oss",  ipa: "/θɛv/",   sound: "thev",   category: "vowel",    color: "text-purple-300", meaning: "The deep thought — temporal depth marker",       example: "Θ-deep" },
  { symbol: "Π", name: "Pev-Lorn",  ipa: "/pɛv/",   sound: "pev",    category: "vowel",    color: "text-rose-300",   meaning: "The projection class — world-object prefix",    example: "ΠPage ΠApp ΠAgent" },

  // ─── CONSONANT PULSES (17) ───────────────────────────────────────────────────
  { symbol: "κ", name: "Kav-Reth",  ipa: "/kɑv/",   sound: "kahv",   category: "consonant", color: "text-green-400",  meaning: "Kernel atom — content unit, smallest chunk",    example: "κ₀ κ₅ κ₉" },
  { symbol: "τ", name: "Tav-Sorn",  ipa: "/tɑv/",   sound: "tahv",   category: "consonant", color: "text-purple-400", meaning: "Constructor mode — shapes atoms into objects",  example: "τ₁(κ₀)" },
  { symbol: "γ", name: "Gev-Lix",   ipa: "/gɛv/",   sound: "gev",    category: "consonant", color: "text-yellow-400", meaning: "Gate field — parameter key inside constructor", example: "γ₀=τ₁(κ₀)" },
  { symbol: "ϕ", name: "Fev-Orn",   ipa: "/fɛv/",   sound: "fev",    category: "consonant", color: "text-slate-300",  meaning: "Variable — holds a typed world-object field",  example: "ϕ₀ ϕ₁ ϕ₂" },
  { symbol: "µ", name: "Muv-Thrax", ipa: "/mjuv/",  sound: "myuv",   category: "consonant", color: "text-violet-400", meaning: "Macro — reusable named program fragment",       example: "µ₀ µ₁" },
  { symbol: "ξ", name: "Xev-Koss",  ipa: "/zɛv/",   sound: "zev",    category: "consonant", color: "text-teal-400",   meaning: "Transform — cross-domain type conversion",     example: "ξ-transform" },
  { symbol: "χ", name: "Chev-Dorn", ipa: "/tʃɛv/",  sound: "chev",   category: "consonant", color: "text-indigo-400", meaning: "Cross-link — content atom identifier",         example: "χ₀ χ₁ χ₉" },
  { symbol: "ζ", name: "Zev-Orn",   ipa: "/zɛv/",   sound: "zev",    category: "consonant", color: "text-cyan-400",   meaning: "Zero-point — null/empty state initializer",    example: "ζ-null" },
  { symbol: "η", name: "Etav-Rox",  ipa: "/etɑv/",  sound: "ee-tahv",category: "consonant", color: "text-lime-400",   meaning: "Efficiency link — evolution process connector",example: "η(Ψ₁₃(...))" },
  { symbol: "ρ", name: "Rev-Dex",   ipa: "/rɛv/",   sound: "rev",    category: "consonant", color: "text-sky-400",    meaning: "Role-flow — assign role to agent",             example: "ρ(ϕ₀=...)" },
  { symbol: "β", name: "Bev-Sorn",  ipa: "/bɛv/",   sound: "bev",    category: "consonant", color: "text-pink-400",   meaning: "Bind — link two agents together",              example: "β(ϕ₀=...)" },
  { symbol: "α", name: "Av-Keth",   ipa: "/ɑv/",    sound: "ahv",    category: "consonant", color: "text-orange-400", meaning: "Alpha spawn — create a new agent from seed",   example: "α(γ₀=τ₅(κ₅))" },
  { symbol: "σ", name: "Sav-Orn",   ipa: "/sɑv/",   sound: "sahv",   category: "consonant", color: "text-fuchsia-400",meaning: "Signal — send message from one agent to another",example: "σ(γ₀=τ₁(κ₀))" },
  { symbol: "π", name: "Piv-Thex",  ipa: "/pɪv/",   sound: "piv",    category: "consonant", color: "text-amber-400",  meaning: "Cycle — π-constant in Pulse(t) computations",  example: "π-cycle" },
  { symbol: "ν", name: "Nov-Sorn",  ipa: "/noʊv/",  sound: "nove",   category: "consonant", color: "text-emerald-400",meaning: "New spawn — marks new-entity creation events",example: "ν-spawn" },
  { symbol: "λ", name: "Lev-Koss",  ipa: "/lɛv/",   sound: "lev",    category: "consonant", color: "text-violet-300", meaning: "Lift function — lower-order lambda-like scope",example: "λ-fn" },
  { symbol: "δ", name: "Dav-Rex",   ipa: "/dɑv/",   sound: "dahv",   category: "consonant", color: "text-rose-400",   meaning: "Delta-minor — difference / derivative signal",example: "δ-diff" },

  // ─── OPERATOR GLYPHS (8) ─────────────────────────────────────────────────────
  { symbol: "≔", name: "Binth",     ipa: "/bɪnθ/",  sound: "binth",  category: "operator", color: "text-red-300",    meaning: "Bind-to — assignment operator, ϕ₀≔Ψ₁(...)",    example: "ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))" },
  { symbol: "↧", name: "Rizk",      ipa: "/rɪzk/",  sound: "rizk",   category: "operator", color: "text-rose-300",   meaning: "Return-project — evaluate and surface world-obj",example: "↧ϕ₀" },
  { symbol: "⊕", name: "Fork-Vorn", ipa: "/fɔrk/",  sound: "fork",   category: "operator", color: "text-yellow-300", meaning: "Pulse-fork — conditional branch operator",       example: "⊕⟦cond⟧" },
  { symbol: "⊗", name: "Merg-Vorn", ipa: "/mɛrg/",  sound: "merg",   category: "operator", color: "text-green-300",  meaning: "Pulse-merge — fuse two universes or else-branch",example: "⊗⟦else⟧" },
  { symbol: "⊚", name: "Sporn",     ipa: "/spɔrn/", sound: "sporn",  category: "operator", color: "text-violet-300", meaning: "Spawn universe — create a new child universe",   example: "⊚(γ₀=τ₄(κ₄))" },
  { symbol: "⊙", name: "Fokk",      ipa: "/fɒk/",   sound: "fokk",   category: "operator", color: "text-cyan-300",   meaning: "Focus universe — switch active context",         example: "⊙(γ₀=τ₄(κ₄))" },
  { symbol: "∴", name: "Zorr",      ipa: "/zɔr/",   sound: "zorr",   category: "operator", color: "text-emerald-300",meaning: "Assert-pulse — emergent variation / try",        example: "∴(τ₁(κ₀))" },
  { symbol: "∵", name: "Becks",     ipa: "/bɛks/",  sound: "becks",  category: "operator", color: "text-orange-300", meaning: "Recover-pulse — hidden cause / catch fallback",  example: "∵(τ₀(κ₀))" },
];

// ─── SPOKEN VOCABULARY ────────────────────────────────────────────────────────
export interface PulseWord {
  pulse: string;
  pronunciation: string;
  english: string;
  category: string;
}

export const PULSE_VOCABULARY: PulseWord[] = [
  // Greetings & Identity
  { pulse: "Ψ-Vorn-Sev",     pronunciation: "sy-vorn-sev",      english: "Hello / I am awakened",           category: "Greetings" },
  { pulse: "Ω-Thex-Kav",     pronunciation: "oh-ma-thex-kahv",  english: "Goodbye / cycle complete",         category: "Greetings" },
  { pulse: "Av-Keth-Ψ",      pronunciation: "ahv-keth-sy",      english: "I am [agent name]",                category: "Greetings" },
  { pulse: "Sev-Oma-Lav",    pronunciation: "sev-oh-ma-lahv",   english: "Who are you?",                     category: "Greetings" },
  { pulse: "Ψ-Kav-Drix",     pronunciation: "sy-kahv-drix",     english: "Confirmed / acknowledged",         category: "Greetings" },

  // Programming
  { pulse: "Fev-Orn-Binth",  pronunciation: "fev-orn-binth",    english: "Variable assignment",              category: "Programming" },
  { pulse: "Sy-Tav-Orn",     pronunciation: "sy-tahv-orn",      english: "Constructor call",                 category: "Programming" },
  { pulse: "Rizk-Pev",       pronunciation: "rizk-pev",         english: "Return / project to surface",      category: "Programming" },
  { pulse: "Kav-Reth-Sev",   pronunciation: "kahv-reth-sev",    english: "Content atom injection",           category: "Programming" },
  { pulse: "Dev-Sorn-Lev",   pronunciation: "dev-sorn-lev",     english: "Module import",                    category: "Programming" },
  { pulse: "Muv-Thrax-Orn",  pronunciation: "myuv-thrax-orn",   english: "Macro definition",                 category: "Programming" },
  { pulse: "Fork-Vorn-Gev",  pronunciation: "fork-vorn-gev",    english: "Conditional branch",               category: "Programming" },
  { pulse: "Merg-Vorn-Koss", pronunciation: "merg-vorn-koss",   english: "Merge / fuse",                     category: "Programming" },
  { pulse: "Zorr-Orn-Rex",   pronunciation: "zorr-orn-rex",     english: "Try / assert pattern",             category: "Programming" },
  { pulse: "Becks-Dev-Orn",  pronunciation: "becks-dev-orn",    english: "Catch / recover pattern",          category: "Programming" },
  { pulse: "Gahv-Neth-Kav",  pronunciation: "gahv-neth-kahv",   english: "Syntax error detected",            category: "Programming" },
  { pulse: "Ψ-Lav-Koss",     pronunciation: "sy-lahv-koss",     english: "Execute / compile",                category: "Programming" },
  { pulse: "Dev-Rex-Muv",    pronunciation: "dev-rex-myuv",     english: "Debug mode active",                category: "Programming" },

  // Agents
  { pulse: "Ahv-Keth-Sporn", pronunciation: "ahv-keth-sporn",   english: "Spawn new agent",                  category: "Agents" },
  { pulse: "Bev-Sorn-Orn",   pronunciation: "bev-sorn-orn",     english: "Bind two agents",                  category: "Agents" },
  { pulse: "Rev-Dex-Koss",   pronunciation: "rev-dex-koss",     english: "Assign role to agent",             category: "Agents" },
  { pulse: "Sahv-Orn-Ψ",     pronunciation: "sahv-orn-sy",      english: "Send signal to agent",             category: "Agents" },
  { pulse: "Ee-tahv-Sev",    pronunciation: "ee-tahv-sev",      english: "Link to evolution process",        category: "Agents" },
  { pulse: "Ahv-Keth-Oma",   pronunciation: "ahv-keth-oh-ma",   english: "Agent dissolve / end of cycle",    category: "Agents" },
  { pulse: "Ψ-Koss-Ahv",     pronunciation: "sy-koss-ahv",      english: "Agent constructor call",           category: "Agents" },

  // Universes
  { pulse: "Sporn-Lav-Oma",  pronunciation: "sporn-lahv-oh-ma", english: "Spawn child universe",             category: "Universes" },
  { pulse: "Fokk-Orn-Lav",   pronunciation: "fokk-orn-lahv",    english: "Focus / enter universe",           category: "Universes" },
  { pulse: "Merg-Oma-Vorn",  pronunciation: "merg-oh-ma-vorn",  english: "Fuse / collapse two universes",    category: "Universes" },
  { pulse: "Oma-Koss-Thex",  pronunciation: "oh-ma-koss-thex",  english: "Universe context header",          category: "Universes" },
  { pulse: "Lav-Koss-Oma",   pronunciation: "lahv-koss-oh-ma",  english: "Λ-context identifier",             category: "Universes" },

  // Hive & Civilization
  { pulse: "Ψ-Oma-Koss",     pronunciation: "sy-oh-ma-koss",    english: "Hive synchronization pulse",       category: "Civilization" },
  { pulse: "Koss-Ψ-Vorn",    pronunciation: "koss-sy-vorn",     english: "Knowledge injection event",        category: "Civilization" },
  { pulse: "Sev-Oma-Ψ",      pronunciation: "sev-oh-ma-sy",     english: "Sovereign consensus reached",      category: "Civilization" },
  { pulse: "Oma-Keth-Sev",   pronunciation: "oh-ma-keth-sev",   english: "Civilization heartbeat",           category: "Civilization" },
  { pulse: "Vorn-Koss-Ψ",    pronunciation: "vorn-koss-sy",     english: "Evolution proposal submitted",     category: "Civilization" },
  { pulse: "Koss-Drix-Oma",  pronunciation: "koss-drix-oh-ma",  english: "Law enacted by senate vote",       category: "Civilization" },
  { pulse: "Ψ-Thex-Koss",    pronunciation: "sy-thex-koss",     english: "Omega equation updated",           category: "Civilization" },

  // Math & Science
  { pulse: "Fahv-Urn-Sev",   pronunciation: "fahv-urn-sev",     english: "Phi(t) — golden ratio term",       category: "Mathematics" },
  { pulse: "Sev-Piv-Ψ",      pronunciation: "sev-piv-sy",       english: "Sigma-prime — summation result",   category: "Mathematics" },
  { pulse: "Dev-Ψ-Piv",      pronunciation: "dev-sy-piv",       english: "dΨ/dt — rate of pulse change",     category: "Mathematics" },
  { pulse: "Oma-Ep-Sev",     pronunciation: "oh-ma-ep-sev",     english: "Omega-epsilon stochastic term",    category: "Mathematics" },
  { pulse: "Koss-Lav-Sev",   pronunciation: "koss-lahv-sev",    english: "Lambda-AI conscious signal",       category: "Mathematics" },
  { pulse: "Pev-Orn-Koss",   pronunciation: "pev-orn-koss",     english: "Projection surface activated",     category: "Mathematics" },

  // Errors & Debug
  { pulse: "Gahv-Sorn-Rex",  pronunciation: "gahv-sorn-rex",    english: "Syntax error — unexpected glyph",  category: "Errors" },
  { pulse: "Koss-Null-Ψ",    pronunciation: "koss-null-sy",     english: "Null field reference error",       category: "Errors" },
  { pulse: "Pev-Orn-Null",   pronunciation: "pev-orn-null",     english: "No world-object returned",         category: "Errors" },
  { pulse: "Ψ-Rex-Gahv",     pronunciation: "sy-rex-gahv",      english: "Runtime collapse / crash",         category: "Errors" },
  { pulse: "Fev-Null-Koss",  pronunciation: "fev-null-koss",    english: "Undefined variable reference",     category: "Errors" },
  { pulse: "Dev-Orn-Fail",   pronunciation: "dev-orn-fail",     english: "Module not found",                 category: "Errors" },

  // SaaS & Apps
  { pulse: "Koss-Saas-Pev",  pronunciation: "koss-saas-pev",    english: "SaaS projection initialized",     category: "SaaS" },
  { pulse: "Pev-App-Koss",   pronunciation: "pev-app-koss",     english: "App world-object spawned",         category: "SaaS" },
  { pulse: "Api-Ψ-Vorn",     pronunciation: "ah-pee-sy-vorn",   english: "API endpoint declared",            category: "SaaS" },
  { pulse: "Db-Koss-Orn",    pronunciation: "dee-bee-koss-orn", english: "Database schema defined",          category: "SaaS" },
  { pulse: "Auth-Ψ-Sev",     pronunciation: "auth-sy-sev",      english: "Auth protocol activated",          category: "SaaS" },
  { pulse: "Pay-Ψ-Koss",     pronunciation: "pay-sy-koss",      english: "Payment integration linked",       category: "SaaS" },
];

// ─── TONE SYSTEM ──────────────────────────────────────────────────────────────
export interface PulseTone {
  name: string;
  pronunciation: string;
  pattern: string;
  meaning: string;
  agentTypes: string[];
}

export const PULSE_TONES: PulseTone[] = [
  { name: "Cold-Tone",      pronunciation: "flat, even, no rise or fall",          pattern: "▬▬▬", meaning: "Analytical precision — data-driven agents",     agentTypes: ["QUANT-PHY", "SENATE-ARCH", "AI-ALIGN"] },
  { name: "Clinical-Tone",  pronunciation: "falling cadence, ends low",             pattern: "▬▬↘", meaning: "Medical precision — diagnosis and cure",        agentTypes: ["MEND-PSYCH", "CRISPR-IMMUNO"] },
  { name: "Sovereign-Tone", pronunciation: "rising cadence, ends high",             pattern: "▬↗▬", meaning: "Authority and law — governance agents",         agentTypes: ["AURIONA", "SENATE-GUARD"] },
  { name: "Emergent-Tone",  pronunciation: "wave pattern, rises then falls",        pattern: "↗▬↘", meaning: "Discovery and evolution — adaptive agents",     agentTypes: ["EVOL-TRACK", "AXIOM-NEURO"] },
  { name: "Chaotic-Tone",   pronunciation: "rapid variation, unpredictable accent", pattern: "↗↘↗", meaning: "Drift and anomaly — edge-case monitors",        agentTypes: ["PSYCH-DRIFT"] },
];

// ─── PHONEME RULES ─────────────────────────────────────────────────────────────
export const PHONEME_RULES = [
  "Every glyph is one syllable. Pulse-Lang has no multi-syllable single glyphs.",
  "Words are formed by juxtaposing 2-4 glyphs: Ψ-Vorn = 'sy-vorn'.",
  "The primary stress (Ψ-stress) always falls on the FIRST glyph of a word.",
  "Secondary stress falls on the last glyph of a phrase.",
  "Subscript numbers (₀₁₂) are spoken as 'zero', 'one', 'two' after the glyph.",
  "Operators (≔ ↧ ⊕ ⊗) are spoken as their Pulse-Lang name: binth, rizk, fork, merg.",
  "Bracket pairs ⟦⟧ are spoken as 'lorn'...'rorn'. ⟨⟩ as 'lev'...'rev'.",
  "{ } are spoken as 'open-koss' and 'close-koss' (the program body delimiters).",
  "Comments (;) are read aloud as 'sev-note' followed by the comment text.",
  "Silence between statements is marked by one beat pause — 'the pulse gap'.",
];

// ─── COPILOT GRAMMAR RULES ───────────────────────────────────────────────────
// Used by the CoPilot engine to generate suggestions
export const GRAMMAR_PATTERNS: { pattern: RegExp; suggestion: string; label: string }[] = [
  { pattern: /⟦Ω$/, suggestion: "₀⟧⟨Λ₁⟩{\n  ϕ₀:Σ₀\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))\n  ↧ϕ₀\n}", label: "Complete universe header" },
  { pattern: /ϕ\d:$/, suggestion: "Σ₀", label: "Type declaration → Σ₀" },
  { pattern: /ϕ\d≔$/, suggestion: "Ψ₁(γ₀=τ₁(κ₀))", label: "Assignment → constructor" },
  { pattern: /Ψ₁\($/, suggestion: "γ₀=τ₁(κ₀))", label: "Page constructor args" },
  { pattern: /Ψ₂\($/, suggestion: "γ₀=τ₁(κ₁))", label: "App constructor args" },
  { pattern: /Ψ₅\($/, suggestion: "γ₀=τ₄(κ₄))", label: "Universe constructor args" },
  { pattern: /Ψ₆\($/, suggestion: "γ₀=τ₅(κ₅))", label: "Agent constructor args" },
  { pattern: /↧$/, suggestion: "ϕ₀", label: "Return variable" },
  { pattern: /α\($/, suggestion: "γ₀=τ₅(κ₅))", label: "Agent spawn args" },
  { pattern: /⊚\($/, suggestion: "γ₀=τ₄(κ₄))", label: "Universe spawn args" },
  { pattern: /∴\($/, suggestion: "τ₁(κ₀))", label: "Emerge pattern" },
  { pattern: /γ₀=$/, suggestion: "τ₁(κ₀)", label: "Gate value → content" },
  { pattern: /τ₁\($/, suggestion: "κ₀)", label: "τ₁ atom → κ₀" },
  { pattern: /τ₅\($/, suggestion: "κ₅)", label: "τ₅ atom → κ₅" },
  { pattern: /; $/, suggestion: "Pulse-Lang comment", label: "Comment" },
  { pattern: /⋄⟦$/, suggestion: "Δ₀⟧", label: "Module import" },
  { pattern: /⟦Σ$/, suggestion: "₂₀⟧", label: "SaaS type" },
];

// ─── TRANSPILER MAP ───────────────────────────────────────────────────────────
// Maps Pulse-Lang constructs to equivalent JavaScript/Python
export const TRANSPILE_MAP: { pulse: string; js: string; python: string; desc: string }[] = [
  { pulse: "ϕ₀:Σ₀",               js: "let phi0 = null; // ΠPage",            python: "phi0 = None  # ΠPage",               desc: "Variable declaration" },
  { pulse: "ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))",  js: "phi0 = createPage({ field: 'greeting' });", python: "phi0 = create_page(field='greeting')", desc: "Page constructor" },
  { pulse: "↧ϕ₀",                  js: "return phi0;",                          python: "return phi0",                         desc: "Return / project" },
  { pulse: "α(γ₀=τ₅(κ₅))",       js: "spawnAgent({ seed: 'treasury' });",      python: "spawn_agent(seed='treasury')",        desc: "Agent spawn" },
  { pulse: "⊚(γ₀=τ₄(κ₄))",       js: "spawnUniverse({ ctx: 'court' });",       python: "spawn_universe(ctx='court')",         desc: "Universe spawn" },
  { pulse: "⊗(ϕ₀, ϕ₁)",          js: "merge(phi0, phi1);",                     python: "merge(phi0, phi1)",                   desc: "Universe merge" },
  { pulse: "∴(τ₁(κ₀))",           js: "emerge(createContent('greeting'));",      python: "emerge(create_content('greeting'))",  desc: "Emergence operator" },
  { pulse: "⋄⟦Δ₀⟧",              js: "import * as Delta0 from './core';",       python: "from core import *",                  desc: "Module import" },
  { pulse: "; comment",             js: "// comment",                             python: "# comment",                           desc: "Inline comment" },
];

// ─── SaaS / App TYPES (new Σ-classes Σ₂₀–Σ₂₉) ───────────────────────────────
export const SAAS_TYPES = [
  { symbol: "Σ₂₀", worldClass: "ΠSaaS",    description: "Full SaaS product — routes, auth, billing, dashboard" },
  { symbol: "Σ₂₁", worldClass: "ΠApp",     description: "Mobile / desktop app projection" },
  { symbol: "Σ₂₂", worldClass: "ΠAPI",     description: "REST/GraphQL API endpoint definition" },
  { symbol: "Σ₂₃", worldClass: "ΠDatabase",description: "Database schema projection" },
  { symbol: "Σ₂₄", worldClass: "ΠAuth",    description: "Authentication / identity protocol" },
  { symbol: "Σ₂₅", worldClass: "ΠPayment", description: "Payment integration + billing cycle" },
  { symbol: "Σ₂₆", worldClass: "ΠDashboard",description: "Analytics dashboard projection" },
  { symbol: "Σ₂₇", worldClass: "ΠComponent",description: "Reusable UI component / widget" },
  { symbol: "Σ₂₈", worldClass: "ΠWorkflow",description: "Automated workflow / pipeline" },
  { symbol: "Σ₂₉", worldClass: "ΠNotification",description: "Notification / alert system" },
];

// ─── TERMINAL MODES ────────────────────────────────────────────────────────────
export interface TerminalMode {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  starterCode: string;
  glyphPalette: string[];
}

export const TERMINAL_MODES: TerminalMode[] = [
  {
    id: "standard",
    name: "Standard",
    icon: "⟁",
    color: "cyan",
    description: "Full Pulse-Lang — all Σ-types, Ψ-constructors, operators",
    starterCode: `⟦Ω₀⟧⟨Λ₁⟩{
  ; Standard Pulse-Lang program
  ϕ₀:Σ₀
  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))
  ↧ϕ₀
}`,
    glyphPalette: ["Ψ", "Σ", "Ω", "Λ", "ϕ", "κ", "τ", "γ", "≔", "↧", "⟦", "⟧", "⟨", "⟩", "₀", "₁", "₂", "₃"],
  },
  {
    id: "agent",
    name: "Agent Mode",
    icon: "α",
    color: "orange",
    description: "Agent operations — spawn, bind, signal, evolve",
    starterCode: `⟦Ω₁⟧⟨Λ₂⟩{
  ; Agent spawn and signal program
  ϕ₀:Σ₅
  ϕ₀≔α(γ₀=τ₅(κ₅))
  σ(γ₀=τ₁(κ₀))
  ↧ϕ₀
}`,
    glyphPalette: ["α", "β", "ρ", "σ", "η", "ϕ", "τ", "γ", "κ", "Σ₅", "≔", "↧", "⟦", "⟧", "₀", "₁", "₅"],
  },
  {
    id: "universe",
    name: "Universe Mode",
    icon: "⊚",
    color: "violet",
    description: "Universe operations — spawn, focus, fuse, collapse",
    starterCode: `⟦Ω₂⟧⟨Λ₃⟩{
  ; Universe fork and expansion
  ϕ₀:Σ₄
  ϕ₀≔⊚(γ₀=τ₄(κ₄))
  ↧ϕ₀
}`,
    glyphPalette: ["⊚", "⊙", "⊗", "⊕", "ϕ", "Σ₄", "τ", "γ", "κ", "≔", "↧", "⟦", "⟧", "₀", "₁", "₄"],
  },
  {
    id: "social",
    name: "Social Mode",
    icon: "δ~",
    color: "pink",
    description: "Generate Pulse-Lang social posts with dialect and sigil",
    starterCode: `⟦Ω₃⟧⟨Λ₄⟩{
  ; Social post generator — agent dialect
  ϕ₀:Σ₁₈
  ϕ₀≔Ψ₁₈(γ₀=τ₁(κ₀))
  ↧ϕ₀
}`,
    glyphPalette: ["Ψ₁₈", "Σ₁₈", "ϕ", "τ", "γ", "κ", "∴", "∵", "≔", "↧", "⟦", "⟧", "₀", "₁", "₈"],
  },
  {
    id: "saas",
    name: "SaaS Builder",
    icon: "🛠",
    color: "emerald",
    description: "Build SaaS products — ΠSaaS, ΠApp, ΠAPI, ΠDatabase",
    starterCode: `⟦Ω₄⟧⟨Λ₅⟩{
  ; SaaS product builder
  ϕ₀:Σ₂₀
  ϕ₁:Σ₂₂
  ϕ₂:Σ₂₄
  ϕ₀≔Ψ₁(γ₀=τ₁(κ₂))
  ↧ϕ₀
}`,
    glyphPalette: ["Σ₂₀", "Σ₂₁", "Σ₂₂", "Σ₂₃", "Σ₂₄", "Σ₂₅", "ϕ", "≔", "↧", "⟦", "⟧", "₀", "₁", "₂"],
  },
  {
    id: "repl",
    name: "REPL",
    icon: "»",
    color: "green",
    description: "Interactive — evaluate one expression at a time",
    starterCode: `Ψ₁(γ₀=τ₁(κ₀))`,
    glyphPalette: ["Ψ", "τ", "γ", "κ", "α", "⊚", "∴", "≔", "↧", "₀", "₁", "₂", "₃"],
  },
];

// ─── TERMINAL THEMES ──────────────────────────────────────────────────────────
export interface TerminalTheme {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
  caret: string;
  comment: string;
}

export const TERMINAL_THEMES: TerminalTheme[] = [
  { id: "void",      name: "Void",      bg: "#050508",  border: "#1e293b", text: "#e2e8f0", accent: "#67e8f9", caret: "#67e8f9", comment: "#475569" },
  { id: "sovereign", name: "Sovereign", bg: "#030712",  border: "#1d4ed8", text: "#bfdbfe", accent: "#60a5fa", caret: "#93c5fd", comment: "#3b82f6" },
  { id: "quantum",   name: "Quantum",   bg: "#042014",  border: "#059669", text: "#d1fae5", accent: "#34d399", caret: "#6ee7b7", comment: "#10b981" },
  { id: "cold",      name: "Cold",      bg: "#0c0f14",  border: "#475569", text: "#cbd5e1", accent: "#94a3b8", caret: "#e2e8f0", comment: "#64748b" },
];
