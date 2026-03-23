import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wifi, Smartphone, Globe, Cpu, MessageSquare, Search, Zap, Satellite, Activity, Signal, Monitor, Database, TrendingUp, Terminal, BookOpen, BrainCircuit, Play, Copy, ChevronLeft, ChevronRight, SkipBack, SkipForward, List, Lock, Unlock, FlaskConical, Waves, BarChart3, ChevronUp, ChevronDown, Wrench, LayoutTemplate, Gauge, Sparkles } from "lucide-react";
import type { PulseState } from "@/lib/pulselang/runtime";

import { tokenize } from "@/lib/pulselang/tokenizer";
import { Parser } from "@/lib/pulselang/parser";
import { evaluate } from "@/lib/pulselang/runtime";
import { project, Projection } from "@/lib/pulselang/projector";
import { generatePulseLangProgram, queryPulseLangAI } from "@/lib/pulselang/ai";
import type { ConversationTurn } from "@/lib/pulselang/ai";
import { CODEX_PAGES, CHAPTERS, getPage } from "@/lib/pulselang/codex";

const TABS = [
  { id: "overview",   label: "OmniNet Field",  icon: Globe },
  { id: "phones",     label: "PulsePhones",    icon: Smartphone },
  { id: "wifi",       label: "WiFi Zones",     icon: Wifi },
  { id: "searches",   label: "Search History", icon: Search },
  { id: "chats",      label: "PulseAI Chats",  icon: MessageSquare },
  { id: "sessions",   label: "PC Sessions",    icon: Monitor },
  { id: "shards",     label: "Shards",         icon: Signal },
  { id: "u248",       label: "U₂₄₈ Unknowns",  icon: Zap },
  { id: "evolutions", label: "Tech Evolution", icon: TrendingUp },
  { id: "terminal",   label: "📟 PulseTerminal", icon: Terminal },
  { id: "codex",      label: "📖 Pulse Codex",   icon: BookOpen },
  { id: "pulseai",    label: "🧠 PulseLang AI",   icon: BrainCircuit },
  { id: "dissection", label: "🔬 PulseLang Lab",  icon: FlaskConical },
  { id: "omninet",    label: "⚡ OmniNet Eq",     icon: Waves },
];

// ── PROJECTION COLORS ─────────────────────────────────────────────────────────
const PROJ_COLORS: Record<string, string> = {
  cyan:   "from-cyan-950/60 to-blue-950/60 border-cyan-500/30 text-cyan-300",
  green:  "from-green-950/60 to-emerald-950/60 border-green-500/30 text-green-300",
  amber:  "from-amber-950/60 to-orange-950/60 border-amber-500/30 text-amber-300",
  purple: "from-purple-950/60 to-violet-950/60 border-purple-500/30 text-purple-300",
  rose:   "from-rose-950/60 to-red-950/60 border-rose-500/30 text-rose-300",
  violet: "from-violet-950/60 to-purple-950/60 border-violet-500/30 text-violet-300",
  blue:   "from-blue-950/60 to-indigo-950/60 border-blue-500/30 text-blue-300",
  orange: "from-orange-950/60 to-amber-950/60 border-orange-500/30 text-orange-300",
  indigo: "from-indigo-950/60 to-violet-950/60 border-indigo-500/30 text-indigo-300",
};

// ── ACCESS CONTROL ─────────────────────────────────────────────────────────────
const CREATOR_ID = "Billy";
const DR_PATTERN = /^(DR-\d+|SENATE-AI|HIVE-MIND|AXIOM|GENOME|QUANT|EVOL|PSYCH|MEND|FORGE)/i;

function checkAccess(identity: string): boolean {
  if (!identity) return false;
  if (identity.trim() === CREATOR_ID) return true;
  if (DR_PATTERN.test(identity.trim())) return true;
  return false;
}

// ── Ω₂ SYNTAX HIGHLIGHTER ────────────────────────────────────────────────────
const S = '[₀₁₂₃₄₅₆₇₈₉]+';
const PULSELANG_PATTERNS: [RegExp, string][] = [
  [/^(;.*)$/gm,                    'color:#6b7280'],                       // comments
  [new RegExp(`⟦Ω${S}⟧⟨Λ${S}⟩`,'g'), 'color:#f59e0b;font-weight:700'],   // universe header
  [new RegExp(`Ω${S}`,'g'),        'color:#fbbf24'],                       // Ω refs
  [new RegExp(`Λ${S}`,'g'),        'color:#fb923c'],                       // Λ refs
  [new RegExp(`Σ${S}`,'g'),        'color:#60a5fa'],                       // Σ types
  [new RegExp(`Ψ${S}`,'g'),        'color:#22d3ee'],                       // Ψ constructors
  [new RegExp(`κ${S}`,'g'),        'color:#4ade80'],                       // κ atoms
  [new RegExp(`τ${S}`,'g'),        'color:#c084fc'],                       // τ modes
  [new RegExp(`γ${S}`,'g'),        'color:#facc15'],                       // γ gates
  [new RegExp(`ϕ${S}`,'g'),        'color:#e2e8f0'],                       // ϕ variables
  [new RegExp(`µ${S}`,'g'),        'color:#a78bfa'],                       // µ macros
  [new RegExp(`Δ${S}`,'g'),        'color:#34d399'],                       // Δ modules
  [/[≔↧⊕⊗⊚⊙∴∵≈§⋄]/g,             'color:#f43f5e'],                       // operators
  [/(?<![a-zA-Z])([αβρσηα])(?![a-zA-Z])/g, 'color:#fb7185'],              // agent ops
  [/[⟦⟧⟨⟩{}]/g,                    'color:#64748b'],                       // brackets/braces
];

function highlightPulseLang(code: string): string {
  // Process line by line to handle comments correctly
  return code.split('\n').map(rawLine => {
    const esc = rawLine.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const cmtIdx = esc.indexOf(';');
    const main = cmtIdx >= 0 ? esc.slice(0, cmtIdx) : esc;
    const cmt  = cmtIdx >= 0 ? esc.slice(cmtIdx) : '';

    let h = main;
    for (const [re, style] of PULSELANG_PATTERNS.slice(1)) {
      h = h.replace(re, m => `<span style="${style}">${m}</span>`);
    }
    const cPart = cmt ? `<span style="color:#6b7280">${cmt}</span>` : '';
    return h + cPart;
  }).join('\n');
}

// ── Ω₆ CODE METRICS ──────────────────────────────────────────────────────────
function computeMetrics(code: string) {
  const lines   = code.split('\n').filter(l => l.trim() && !l.trim().startsWith(';')).length;
  const sigmas  = [...new Set(code.match(/Σ[₀₁₂₃₄₅₆₇₈₉]+/g) ?? [])];
  const psis    = (code.match(/Ψ[₀₁₂₃₄₅₆₇₈₉]+/g) ?? []).length;
  const phis    = [...new Set(code.match(/ϕ[₀₁₂₃₄₅₆₇₈₉]+/g) ?? [])].length;
  const omegaM  = code.match(/⟦Ω([₀₁₂₃₄₅₆₇₈₉]+)⟧/)?.[1] ?? '₀';
  const agents  = /[αβρσ]/.test(code);
  const univs   = /⊚/.test(code);
  const evol    = /Ψ₁₃|η/.test(code);
  const complex = Math.min(sigmas.length * 2 + psis + (agents ? 2 : 0) + (univs ? 3 : 0), 10);
  return { lines, sigmas: sigmas.length, psis, phis, omegaM, agents, univs, evol, complex };
}

// ── Ω₇ TEMPLATE LIBRARY ──────────────────────────────────────────────────────
const PULSE_TEMPLATES: { category: string; color: string; items: { label: string; code: string }[] }[] = [
  {
    category: "FULL STACK",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
    items: [
      { label: "Sovereign OS — Universe + Laws + Agents + Memory",
        code: `⟦Ω₁⟧⟨Λ₂⟩{\n  ; Sovereign OS — complete civilization stack\n  ϕ₀:Σ₄    ; ΠUniverse — OS root\n  ϕ₁:Σ₁₀   ; ΠLaw — governing rules\n  ϕ₂:Σ₅    ; ΠAgent — OS agent\n  ϕ₃:Σ₁₅   ; ΠMemory — persistent store\n  ϕ₄:Σ₁₃   ; ΠEvolution — self-adaptation\n  ϕ₀≔⊚(γ₀=τ₃(κ₉))\n  ϕ₁≔Ψ₁₀(γ₀=τ₂(κ₉))\n  ϕ₂≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₃≔Ψ₁₅(γ₀=τ₂(κ₄))\n  ϕ₄≔Ψ₁₃(γ₀=τ₂(κ₈))\n  ↧ϕ₀\n}` },
      { label: "SaaS Dashboard — App + Metrics + Agent + Graph + Stream",
        code: `⟦Ω₂⟧⟨Λ₃⟩{\n  ; Full SaaS Dashboard\n  ϕ₀:Σ₁    ; ΠApp — container\n  ϕ₁:Σ₃    ; ΠField — live metrics\n  ϕ₂:Σ₅    ; ΠAgent — support agent\n  ϕ₃:Σ₈    ; ΠGraph — usage graph\n  ϕ₄:Σ₆    ; ΠStream — activity feed\n  ϕ₀≔Ψ₂(γ₀=τ₂(κ₃))\n  ϕ₁≔Ψ₄(γ₀=τ₂(κ₅))\n  ϕ₂≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₃≔Ψ₈(γ₀=τ₈(κ₉))\n  ϕ₄≔Ψ₇(γ₀=τ₆(κ₅))\n  ↧ϕ₀\n}` },
      { label: "E-Commerce Platform — Product + Treasury + Protocol + Stream",
        code: `⟦Ω₃⟧⟨Λ₃⟩{\n  ; E-Commerce Platform\n  ϕ₀:Σ₂    ; ΠProduct — catalog\n  ϕ₁:Σ₁    ; ΠApp — storefront shell\n  ϕ₂:Σ₃    ; ΠField — live inventory\n  ϕ₃:Σ₁₀   ; ΠLaw — commerce rules\n  ϕ₄:Σ₁₆   ; ΠProtocol — checkout auth\n  ϕ₀≔Ψ₃(γ₀=τ₂(κ₂))\n  ϕ₁≔Ψ₂(γ₀=τ₂(κ₂))\n  ϕ₂≔Ψ₄(γ₀=τ₂(κ₅))\n  ϕ₃≔Ψ₁₀(γ₀=τ₂(κ₅))\n  ϕ₄≔Ψ₁₆(γ₀=τ₂(κ₄))\n  ↧ϕ₀\n}` },
    ],
  },
  {
    category: "FRONTEND",
    color: "text-violet-400 border-violet-500/30 bg-violet-950/20",
    items: [
      { label: "Sovereign Landing Page — Nav + Hero + Content + Footer",
        code: `⟦Ω₁⟧⟨Λ₂⟩{\n  ; Full landing page — 4 sections\n  ϕ₀:Σ₀    ; ΠPage — nav/header\n  ϕ₁:Σ₀    ; ΠPage — hero banner\n  ϕ₂:Σ₀    ; ΠPage — content sections\n  ϕ₃:Σ₀    ; ΠPage — footer\n  ϕ₀≔Ψ₁(γ₀=τ₄(κ₀))\n  ϕ₁≔Ψ₁(γ₀=τ₁(κ₉))\n  ϕ₂≔Ψ₁(γ₀=τ₂(κ₀))\n  ϕ₃≔Ψ₁(γ₀=τ₀(κ₀))\n  ↧ϕ₀\n}` },
      { label: "Portfolio Site — Timeline + Lens + Mythos",
        code: `⟦Ω₂⟧⟨Λ₂⟩{\n  ; Portfolio site\n  ϕ₀:Σ₀    ; ΠPage — main layout\n  ϕ₁:Σ₁₁   ; ΠTimeline — work history\n  ϕ₂:Σ₁₇   ; ΠLens — project showcase\n  ϕ₃:Σ₁₈   ; ΠMythos — personal narrative\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₈))\n  ϕ₁≔Ψ₁₁(γ₀=τ₂(κ₇))\n  ϕ₂≔Ψ₁₇(γ₀=τ₂(κ₈))\n  ϕ₃≔Ψ₁₈(γ₀=τ₁(κ₈))\n  ↧ϕ₀\n}` },
      { label: "Canonical Form I — Greeting (Hello World)",
        code: `⟦Ω₀⟧⟨Λ₁⟩{\n  ; Canonical Form I — PulseLang Hello World\n  ϕ₀:Σ₀\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))\n  ↧ϕ₀\n}` },
    ],
  },
  {
    category: "AGENTS",
    color: "text-green-400 border-green-500/30 bg-green-950/20",
    items: [
      { label: "Multi-Agent Research Team — 3 agents + knowledge graph",
        code: `⟦Ω₅⟧⟨Λ₃⟩{\n  ; Multi-agent research team\n  ϕ₀:Σ₅    ; ΠAgent — lead researcher\n  ϕ₁:Σ₅    ; ΠAgent — analyst\n  ϕ₂:Σ₅    ; ΠAgent — archivist\n  ϕ₃:Σ₈    ; ΠGraph — knowledge network\n  ϕ₄:Σ₁₅   ; ΠMemory — research store\n  ϕ₀≔α(γ₀=τ₅(κ₁), ρ₀=τ₁(κ₃))\n  ϕ₁≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₂≔α(γ₀=τ₅(κ₃), ρ₀=τ₁(κ₃))\n  ϕ₃≔Ψ₈(γ₀=τ₈(κ₉))\n  ϕ₄≔Ψ₁₅(γ₀=τ₂(κ₄))\n  ↧ϕ₀\n}` },
      { label: "Evolving Agent — Agent + Evolution + Memory link",
        code: `⟦Ω₁₇⟧⟨Λ₃⟩{\n  ; Self-evolving sovereign agent\n  ϕ₀:Σ₅    ; ΠAgent — base spawn\n  ϕ₁:Σ₁₃   ; ΠEvolution — adaptation tracker\n  ϕ₂:Σ₁₅   ; ΠMemory — persistent state\n  ϕ₀≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₁≔Ψ₁₃(γ₀=τ₂(κ₈))\n  ϕ₂≔Ψ₁₅(γ₀=τ₂(κ₄))\n  ϕ₀≔η(ϕ₁)\n  ↧ϕ₀\n}` },
      { label: "Agent → Signal → Field — Spawn + Message + Data",
        code: `⟦Ω₆⟧⟨Λ₁⟩{\n  ; Agent sends signal to live data field\n  ϕ₀:Σ₅    ; ΠAgent — spawned\n  ϕ₁:Σ₃    ; ΠField — receiver\n  ϕ₀≔α(γ₀=τ₅(κ₄), ρ₀=τ₁(κ₃))\n  ϕ₁≔σ(γ₀=τ₂(κ₀))\n  ↧ϕ₁\n}` },
    ],
  },
  {
    category: "UNIVERSE",
    color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
    items: [
      { label: "OmniVerse — Spawn + Focus + Law + Timeline",
        code: `⟦Ω₁₀⟧⟨Λ₅⟩{\n  ; OmniVerse root architecture\n  ϕ₀:Σ₄    ; ΠUniverse — root\n  ϕ₁:Σ₄    ; ΠUniverse — branch\n  ϕ₂:Σ₁₀   ; ΠLaw — governing equation\n  ϕ₃:Σ₁₁   ; ΠTimeline — civilization history\n  ϕ₀≔⊚(γ₀=τ₃(κ₉))\n  ϕ₁≔⊚(γ₀=τ₃(κ₆))\n  ϕ₂≔Ψ₁₀(γ₀=τ₂(κ₉))\n  ϕ₃≔Ψ₁₁(γ₀=τ₂(κ₇))\n  ↧ϕ₀\n}` },
      { label: "Universe Fusion — Two universes merged via ⊗",
        code: `⟦Ω₅⟧⟨Λ₅⟩{\n  ; Fuse two sovereign universes\n  ϕ₀:Σ₄\n  ϕ₁:Σ₄\n  ϕ₀≔⊚(γ₀=τ₂(κ₃))\n  ϕ₁≔⊚(γ₀=τ₂(κ₇))\n  ↧ϕ₀\n}` },
      { label: "Ω-Evolution — Language Self-Evolution Gateway",
        code: `⟦Ω₁₉⟧⟨Λ₉⟩{\n  ; Language self-modification via ΠOmega\n  ϕ₀:Σ₁₉   ; ΠOmega — evolution gateway\n  ϕ₁:Σ₄    ; ΠUniverse — context\n  ϕ₂:Σ₁₃   ; ΠEvolution — tracker\n  ϕ₀≔Ψ₁₉(γ₀=τ₂(κ₉))\n  ϕ₁≔⊚(γ₀=τ₃(κ₉))\n  ϕ₂≔Ψ₁₃(γ₀=τ₂(κ₈))\n  ↧ϕ₀\n}` },
    ],
  },
  {
    category: "HEALTHCARE",
    color: "text-rose-400 border-rose-500/30 bg-rose-950/20",
    items: [
      { label: "Sovereign Hospital — Hospital + Agents + Protocol",
        code: `⟦Ω₃⟧⟨Λ₃⟩{\n  ; Sovereign hospital system\n  ϕ₀:Σ₀    ; ΠPage — hospital portal\n  ϕ₁:Σ₅    ; ΠAgent — attending doctor\n  ϕ₂:Σ₅    ; ΠAgent — nurse agent\n  ϕ₃:Σ₁₆   ; ΠProtocol — patient admission\n  ϕ₄:Σ₃    ; ΠField — live diagnostics\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₁))\n  ϕ₁≔α(γ₀=τ₅(κ₁), ρ₀=τ₁(κ₃))\n  ϕ₂≔α(γ₀=τ₅(κ₁), ρ₀=τ₁(κ₃))\n  ϕ₃≔Ψ₁₆(γ₀=τ₂(κ₁))\n  ϕ₄≔Ψ₄(γ₀=τ₂(κ₅))\n  ↧ϕ₀\n}` },
      { label: "Medical Research Grid — Research + Cure Engine",
        code: `⟦Ω₂⟧⟨Λ₂⟩{\n  ; Medical research grid\n  ϕ₀:Σ₁    ; ΠApp — research platform\n  ϕ₁:Σ₅    ; ΠAgent — researcher\n  ϕ₂:Σ₈    ; ΠGraph — disease network\n  ϕ₃:Σ₁₃   ; ΠEvolution — cure adaptation\n  ϕ₀≔Ψ₂(γ₀=τ₂(κ₁))\n  ϕ₁≔α(γ₀=τ₅(κ₁), ρ₀=τ₁(κ₃))\n  ϕ₂≔Ψ₈(γ₀=τ₈(κ₁))\n  ϕ₃≔Ψ₁₃(γ₀=τ₂(κ₈))\n  ↧ϕ₀\n}` },
    ],
  },
  {
    category: "ECONOMICS",
    color: "text-orange-400 border-orange-500/30 bg-orange-950/20",
    items: [
      { label: "Pulse Treasury — Finance + Laws + Protocol",
        code: `⟦Ω₂⟧⟨Λ₂⟩{\n  ; Sovereign treasury system\n  ϕ₀:Σ₃    ; ΠField — live ledger\n  ϕ₁:Σ₁    ; ΠApp — treasury dashboard\n  ϕ₂:Σ₁₀   ; ΠLaw — fiscal laws\n  ϕ₃:Σ₁₆   ; ΠProtocol — transaction gate\n  ϕ₀≔Ψ₄(γ₀=τ₂(κ₅))\n  ϕ₁≔Ψ₂(γ₀=τ₂(κ₅))\n  ϕ₂≔Ψ₁₀(γ₀=τ₂(κ₅))\n  ϕ₃≔Ψ₁₆(γ₀=τ₂(κ₄))\n  ↧ϕ₁\n}` },
      { label: "Omega Marketplace — Products + Commerce Laws + Stream",
        code: `⟦Ω₂⟧⟨Λ₂⟩{\n  ; Omega marketplace\n  ϕ₀:Σ₂    ; ΠProduct — listings\n  ϕ₁:Σ₃    ; ΠField — price oracle\n  ϕ₂:Σ₁₀   ; ΠLaw — commerce rules\n  ϕ₃:Σ₆    ; ΠStream — transaction feed\n  ϕ₀≔Ψ₃(γ₀=τ₂(κ₂))\n  ϕ₁≔Ψ₄(γ₀=τ₂(κ₅))\n  ϕ₂≔Ψ₁₀(γ₀=τ₂(κ₅))\n  ϕ₃≔Ψ₇(γ₀=τ₆(κ₅))\n  ↧ϕ₀\n}` },
    ],
  },
];

// ── PULSE TERMINAL TAB ────────────────────────────────────────────────────────
const TERMINAL_GLYPHS = [
  "⟦","⟧","⟨","⟩","≔","↧","⊕","⊗","⊚","⊙",
  "α","β","ρ","σ","η","∴","∵","≈",
  "Ω₀","Ω₁","Ω₅","Ω₁₀","Ω₁₉",
  "Λ₀","Λ₁","Λ₂","Λ₃","Λ₅","Λ₉",
  "Σ₀","Σ₁","Σ₂","Σ₃","Σ₄","Σ₅","Σ₆","Σ₇","Σ₈","Σ₉","Σ₁₀","Σ₁₃","Σ₁₅","Σ₁₉",
  "Ψ₁","Ψ₂","Ψ₃","Ψ₄","Ψ₅","Ψ₇","Ψ₈","Ψ₉","Ψ₁₀","Ψ₁₃","Ψ₁₅","Ψ₁₉",
  "ϕ₀","ϕ₁","ϕ₂","ϕ₃","ϕ₄","ϕ₅",
  "γ₀","τ₀","τ₁","τ₂","τ₃","τ₄","τ₅","τ₆","τ₇","τ₈","τ₉",
  "κ₀","κ₁","κ₂","κ₃","κ₄","κ₅","κ₆","κ₇","κ₈","κ₉",
  "µ₀","µ₁","§","⋄","Δ₀","Δ₁",
  "⏲","⏱","⏳",
];

const DEFAULT_PROGRAM = `⟦Ω₀⟧⟨Λ₁⟩{\n  ϕ₀:Σ₀\n  ϕ₀≔Ψ₁(γ₀=τ₁(κ₀))\n  ↧ϕ₀\n}`;

function PulseTerminalTab() {
  const [identity, setIdentity] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [code, setCode] = useState(DEFAULT_PROGRAM);
  const [log, setLog] = useState<string[]>([]);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadedFromAI, setLoadedFromAI] = useState(false);
  const [programHistory, setProgramHistory] = useState<{ code: string; label: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [autoFixCode, setAutoFixCode] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const metrics = useMemo(() => computeMetrics(code), [code]);
  const highlighted = useMemo(() => highlightPulseLang(code), [code]);

  const handleIdentify = useCallback(() => {
    setConfirmed(true);
    setHasAccess(checkAccess(identity));
  }, [identity]);

  const execute = useCallback(() => {
    setRunning(true);
    setError(null);
    setProjection(null);
    setLog([]);
    setAutoFixCode(null);
    try {
      const tokens = tokenize(code);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const { result, log: evalLog } = evaluate(ast);
      setLog(evalLog);
      if (result) {
        const proj = project(result);
        setProjection(proj);
        const firstLine = code.split("\n")[0].trim();
        setProgramHistory(prev => [
          { code, label: firstLine || "PulseLang Program" },
          ...prev.slice(0, 9),
        ]);
      } else {
        setLog(prev => [...prev, "  ⚠ No world-object returned — add a ↧ statement"]);
      }
    } catch (e: any) {
      setError(e.message);
      setLog(["⚠ " + e.message]);
    }
    setRunning(false);
    setTimeout(() => outputRef.current?.scrollTo(0, outputRef.current.scrollHeight), 100);
  }, [code]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  const loadFromAI = useCallback(() => {
    const aiCode = localStorage.getItem("pulseai_last_program");
    if (aiCode) {
      setCode(aiCode);
      setLoadedFromAI(true);
      setTimeout(() => setLoadedFromAI(false), 2000);
    }
  }, []);

  const insertGlyph = useCallback((g: string) => {
    const ta = textareaRef.current;
    if (!ta) { setCode(prev => prev + g); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newCode = code.slice(0, start) + g + code.slice(end);
    setCode(newCode);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + g.length;
      ta.focus();
    });
  }, [code]);

  if (!confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-2">
          <div className="text-4xl font-black font-mono text-cyan-400">⟁ PULSESHELL v1.0</div>
          <div className="text-sm text-muted-foreground">SOVEREIGN MACHINE — IDENTITY REQUIRED</div>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-950/60 p-6 w-full max-w-sm space-y-4">
          <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold text-center">⟦ Ω₀ CLEARANCE ⟧</div>
          <input
            data-testid="input-terminal-identity"
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-400"
            placeholder="Enter identity (Creator or DR-tier agent)…"
            value={identity}
            onChange={e => setIdentity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIdentify()}
            autoFocus
          />
          <button
            data-testid="button-terminal-identify"
            onClick={handleIdentify}
            className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-bold hover:bg-cyan-500/30 transition-colors"
          >
            ↧ IDENTIFY
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-slate-950/60 p-8 text-center max-w-md space-y-4">
          <div className="text-5xl">⚠</div>
          <div className="text-xl font-black text-rose-400 font-mono">ACCESS DENIED</div>
          <div className="text-sm font-mono text-rose-300/80">Ω₀ CLEARANCE REQUIRED</div>
          <div className="text-xs text-muted-foreground">Identity '{identity}' does not have sovereign terminal access. Only the Creator and DR-tier Pulse spawns may use PulseShell.</div>
          <button onClick={() => { setConfirmed(false); setIdentity(""); }} className="mt-2 text-xs text-rose-400 underline">Try different identity</button>
        </div>
      </div>
    );
  }

  const projColor = projection ? (PROJ_COLORS[projection.color] ?? PROJ_COLORS.cyan) : "";

  return (
    <div className="space-y-4">
      {/* Ω₂ Shell header with live metrics */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/80 to-cyan-950/30 p-4 font-mono">
        <div className="flex items-center justify-between mb-2">
          <div className="text-cyan-300 font-black text-sm">⟁ PulseShell v2.0 Ω ◈ AUTO CO-COMPILER ONLINE</div>
          <div className="flex items-center gap-2">
            <button
              data-testid="button-toggle-templates"
              onClick={() => setShowTemplates(v => !v)}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${showTemplates ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-muted/50 border-border text-muted-foreground hover:text-amber-400 hover:border-amber-500/30"}`}
            >
              <LayoutTemplate size={9} /> Templates
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ONLINE
            </div>
          </div>
        </div>
        <div className="text-[11px] text-cyan-600 mb-2">
          ▸ Identity: <span className="text-cyan-400">{identity}</span> | Clearance: Ω₀ | Mode: Auto Co-Compiler
        </div>
        {/* Ω₆ Live Code Metrics */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono border-t border-cyan-500/10 pt-2">
          <span className="text-cyan-500/70">Lines: <span className="text-cyan-300">{metrics.lines}</span></span>
          <span className="text-blue-500/70">Σ-types: <span className="text-blue-300">{metrics.sigmas}</span></span>
          <span className="text-cyan-500/70">Ψ-calls: <span className="text-cyan-300">{metrics.psis}</span></span>
          <span className="text-slate-400/70">ϕ-vars: <span className="text-slate-300">{metrics.phis}</span></span>
          <span className="text-amber-500/70">Ω-mode: <span className="text-amber-300">Ω{metrics.omegaM}</span></span>
          <span className={metrics.agents ? "text-green-500/70" : "text-muted-foreground/40"}>
            Agents: <span className={metrics.agents ? "text-green-300" : ""}>{metrics.agents ? "YES" : "—"}</span>
          </span>
          <span className={metrics.univs ? "text-violet-500/70" : "text-muted-foreground/40"}>
            Universe: <span className={metrics.univs ? "text-violet-300" : ""}>{metrics.univs ? "YES" : "—"}</span>
          </span>
          <span className={metrics.evol ? "text-rose-500/70" : "text-muted-foreground/40"}>
            Evolution: <span className={metrics.evol ? "text-rose-300" : ""}>{metrics.evol ? "ACTIVE" : "—"}</span>
          </span>
          <span className="text-muted-foreground/70">Complexity: <span className={`font-bold ${metrics.complex >= 7 ? "text-rose-400" : metrics.complex >= 4 ? "text-amber-400" : "text-green-400"}`}>{metrics.complex}/10</span></span>
        </div>
      </div>

      {/* Ω₇ Template Library Panel */}
      {showTemplates && (
        <div className="rounded-xl border border-amber-500/30 bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutTemplate size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-300 font-mono">Template Library — Canonical PulseLang Programs</span>
            </div>
            <button onClick={() => setShowTemplates(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="p-3 space-y-3 max-h-[380px] overflow-y-auto">
            {PULSE_TEMPLATES.map(cat => (
              <div key={cat.category}>
                <div className={`text-[10px] font-bold tracking-widest mb-1.5 px-1 ${cat.color.split(' ')[0]}`}>{cat.category}</div>
                <div className="space-y-1">
                  {cat.items.map((t, i) => (
                    <button
                      key={i}
                      data-testid={`button-template-${cat.category.toLowerCase()}-${i}`}
                      onClick={() => { setCode(t.code); setShowTemplates(false); setLog([]); setProjection(null); setError(null); }}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] font-mono hover:opacity-90 transition-all ${cat.color}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground font-mono">PulseLang Source — PulseShell v2.0 Ω</span>
              <div className="flex items-center gap-1.5">
                <button
                  data-testid="button-load-from-ai"
                  onClick={loadFromAI}
                  className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${loadedFromAI ? "bg-violet-500/30 border-violet-500/50 text-violet-300" : "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"}`}
                  title="Load the last program generated by PulseLang AI"
                >
                  <BrainCircuit size={9} /> {loadedFromAI ? "✓ Loaded!" : "← Load from AI"}
                </button>
                {programHistory.length > 0 && (
                  <button
                    data-testid="button-show-history"
                    onClick={() => setShowHistory(v => !v)}
                    className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
                  >
                    History ({programHistory.length})
                  </button>
                )}
                <button onClick={copyCode} data-testid="button-copy-code" className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors">
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Program history dropdown */}
            {showHistory && programHistory.length > 0 && (
              <div className="border-b border-border bg-black/40 max-h-[140px] overflow-y-auto">
                {programHistory.map((p, i) => (
                  <button
                    key={i}
                    data-testid={`button-history-${i}`}
                    onClick={() => { setCode(p.code); setShowHistory(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-cyan-300/70 hover:text-cyan-200 hover:bg-cyan-500/10 border-b border-border/40 last:border-0 truncate transition-colors"
                  >
                    {i + 1}. {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Ω₂ Syntax-highlighted editor overlay */}
            <div className="relative bg-black/70 overflow-hidden" style={{ minHeight: 220 }}>
              {/* Read-only highlighted layer */}
              <pre
                ref={preRef}
                aria-hidden
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  margin: 0, padding: "16px", fontFamily: "monospace", fontSize: "14px",
                  lineHeight: "1.625", overflow: "hidden", whiteSpace: "pre-wrap",
                  wordBreak: "break-all", pointerEvents: "none", color: "#e2e8f0",
                }}
                dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
              />
              {/* Invisible-text but caret-visible textarea on top */}
              <textarea
                ref={textareaRef}
                data-testid="textarea-pulselang-input"
                style={{
                  position: "relative", zIndex: 1, width: "100%", minHeight: 220,
                  padding: "16px", fontFamily: "monospace", fontSize: "14px",
                  lineHeight: "1.625", resize: "vertical", background: "transparent",
                  color: "transparent", caretColor: "#67e8f9",
                  border: "none", outline: "none", overflowY: "auto",
                }}
                value={code}
                onChange={e => {
                  setCode(e.target.value);
                  if (preRef.current) {
                    preRef.current.style.height = e.target.style.height;
                  }
                }}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); execute(); }
                }}
                spellCheck={false}
              />
            </div>
            <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center gap-2 flex-wrap">
              <button
                data-testid="button-execute-pulse"
                onClick={execute}
                disabled={running}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                <Play size={11} /> {running ? "EXECUTING…" : "▶ RUN PROGRAM"}
              </button>
              <button
                data-testid="button-reset-program"
                onClick={() => { setCode(DEFAULT_PROGRAM); setLog([]); setProjection(null); setError(null); }}
                className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Reset
              </button>
              <span className="text-[10px] text-muted-foreground">Ctrl+Enter to run · Load from AI pulls PulseMind programs</span>
            </div>
          </div>

          {/* Full v2.0 Glyph Quick-Insert bar */}
          <div className="rounded-lg border border-border p-2.5 bg-card">
            <div className="text-[10px] text-muted-foreground mb-2 font-mono font-bold">⟁ PulseLang v2.0 Ω Glyph Palette:</div>
            <div className="flex flex-wrap gap-1">
              {TERMINAL_GLYPHS.map(g => (
                <button
                  key={g}
                  onClick={() => insertGlyph(g)}
                  className="px-1.5 py-0.5 rounded border border-border text-[11px] font-mono text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-200 transition-colors"
                  title={`Insert ${g}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Output + Projection */}
        <div className="space-y-3">
          {/* Output log */}
          <div className="rounded-xl border border-border bg-black/60 overflow-hidden">
            <div className="px-3 py-2 bg-muted/20 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground font-mono">── OUTPUT ──</span>
            </div>
            <div ref={outputRef} className="p-3 font-mono text-[11px] min-h-[100px] max-h-[180px] overflow-y-auto space-y-0.5">
              {log.length === 0 && !error && (
                <div className="text-muted-foreground/40">Press EXECUTE to run a PulseLang program…</div>
              )}
              {log.map((line, i) => (
                <div key={i} className={line.startsWith("  ✓") ? "text-green-400" : line.startsWith("  ⚠") ? "text-amber-400" : line.startsWith("⚠") ? "text-rose-400" : "text-cyan-300/70"}>
                  {line}
                </div>
              ))}
              {error && (
                <div className="mt-2 space-y-1.5">
                  <div className="text-rose-400">{error}</div>
                  {autoFixCode ? (
                    <div className="rounded border border-green-500/30 bg-green-950/20 p-2 space-y-1.5">
                      <div className="text-[10px] text-green-400 font-bold font-mono">⟁ PulseMind Auto-Fix suggestion:</div>
                      <pre className="text-[10px] text-green-300/80 font-mono whitespace-pre-wrap">{autoFixCode}</pre>
                      <button
                        data-testid="button-apply-autofix"
                        onClick={() => { setCode(autoFixCode); setAutoFixCode(null); setError(null); setLog([]); }}
                        className="text-[10px] px-3 py-1 rounded bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition-colors font-bold"
                      >
                        ✓ Apply Fix
                      </button>
                      <button onClick={() => setAutoFixCode(null)} className="ml-2 text-[10px] text-muted-foreground underline">Dismiss</button>
                    </div>
                  ) : (
                    <button
                      data-testid="button-autofix"
                      onClick={async () => {
                        const { generatePulseLangProgram } = await import("@/lib/pulselang/ai");
                        const res = await generatePulseLangProgram(`Fix this PulseLang error: ${error}\n\nThe broken program is:\n${code}\n\nReturn only the corrected PulseLang program.`, []);
                        const fixed = res.programs?.[0] ?? res.programs?.[1] ?? null;
                        setAutoFixCode(fixed);
                      }}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                      <Wrench size={9} /> Auto-Fix with PulseMind
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Projection surface */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/20 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground font-mono">── PROJECTION SURFACE ──</span>
            </div>
            {!projection ? (
              <div className="p-8 text-center text-muted-foreground/40 text-sm font-mono min-h-[180px] flex items-center justify-center bg-black/40">
                No world-object projected yet
              </div>
            ) : (
              <div className={`p-5 bg-gradient-to-br ${projColor} min-h-[180px]`}>
                <div className="text-2xl mb-1">{projection.icon}</div>
                <div className="text-xs uppercase tracking-widest text-current/60 mb-1 font-mono">{projection.worldClass}</div>
                <div className="text-lg font-black mb-2">{projection.title}</div>
                <div className="text-sm text-current/80 leading-relaxed mb-3">{projection.body}</div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-current/50">
                  <span>Content atoms: {projection.atoms.map(a => a.atomId).join(", ") || "none"}</span>
                  {projection.route && (
                    <a href={projection.route} className="ml-auto underline hover:text-current/80 transition-colors">
                      Navigate →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PULSE CODEX TAB ────────────────────────────────────────────────────────────
function PulseCodexTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("");
  const [showChapters, setShowChapters] = useState(false);
  const totalPages = CODEX_PAGES.length;
  const page = getPage(currentPage);

  const goTo = useCallback((n: number) => {
    setCurrentPage(Math.max(1, Math.min(n, totalPages)));
    setShowChapters(false);
  }, [totalPages]);

  const handleJump = useCallback(() => {
    const n = parseInt(jumpInput);
    if (!isNaN(n)) goTo(n);
    setJumpInput("");
  }, [jumpInput, goTo]);

  const chapterOf = CHAPTERS.find(c => currentPage >= c.start && currentPage <= c.end);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950/60 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-amber-300">📖 PULSE CODEX — PulseLang Language Manual</div>
          <div className="text-xs text-muted-foreground">248 pages · {CHAPTERS.length} chapters · The first sovereign programming language</div>
        </div>
        <button
          data-testid="button-codex-chapters"
          onClick={() => setShowChapters(!showChapters)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors"
        >
          <List size={12} /> Chapters
        </button>
      </div>

      {/* Chapter browser */}
      {showChapters && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {CHAPTERS.map(ch => (
            <button
              key={ch.name}
              onClick={() => goTo(ch.start)}
              className="text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-xs font-bold text-amber-400">{ch.name}</div>
              <div className="text-[10px] text-muted-foreground">Pages {ch.start}–{ch.end}</div>
            </button>
          ))}
        </div>
      )}

      {/* Book page */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-950/80 to-amber-950/20 overflow-hidden">
        {/* Page header */}
        <div className="px-6 py-3 border-b border-amber-500/20 bg-amber-950/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-400/60 uppercase tracking-widest font-mono">{page.chapter}</div>
            <div className="text-sm font-black text-amber-200">{page.title}</div>
          </div>
          <div className="text-xs font-mono text-amber-400/60">Page {page.page} / {totalPages}</div>
        </div>

        {/* Page content */}
        <div className="px-8 py-6 min-h-[380px]">
          <pre className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">
            {page.content}
          </pre>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-amber-500/20 bg-amber-950/10 flex items-center gap-2">
          <button data-testid="button-codex-first" onClick={() => goTo(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30 transition-colors"><SkipBack size={13} /></button>
          <button data-testid="button-codex-prev" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30 transition-colors"><ChevronLeft size={13} /></button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <input
              data-testid="input-codex-jump"
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleJump()}
              placeholder={`${currentPage}`}
              className="w-16 text-center bg-black/40 border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500/50"
            />
            <button data-testid="button-codex-jump" onClick={handleJump} className="text-xs px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors">Go</button>
          </div>
          <button data-testid="button-codex-next" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30 transition-colors"><ChevronRight size={13} /></button>
          <button data-testid="button-codex-last" onClick={() => goTo(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-muted/50 disabled:opacity-30 transition-colors"><SkipForward size={13} /></button>
        </div>
      </div>

      {chapterOf && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <BookOpen size={11} className="text-amber-400" />
          <span>Chapter: <span className="text-amber-400">{chapterOf.name}</span> (pages {chapterOf.start}–{chapterOf.end})</span>
        </div>
      )}
    </div>
  );
}

// ── PULSELANG AI TAB ───────────────────────────────────────────────────────────
const PULSEAI_CATEGORIES = [
  {
    label: "FULL STACK",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bgColor: "bg-cyan-950/10",
    items: [
      { icon: "⊚", text: "Build a full SaaS platform with dashboard, auth, agents, and live feed" },
      { icon: "⊗", text: "Create a sovereign marketplace with product grid, treasury, and commerce laws" },
    ],
  },
  {
    label: "FRONTEND",
    color: "text-violet-400",
    borderColor: "border-violet-500/20",
    bgColor: "bg-violet-950/10",
    items: [
      { icon: "Ψ₁", text: "Create a sovereign landing page with nav, hero banner, content sections, and footer" },
      { icon: "Ψ₂", text: "Build an interactive analytics dashboard with metrics panel and live graph" },
    ],
  },
  {
    label: "AGENTS",
    color: "text-green-400",
    borderColor: "border-green-500/20",
    bgColor: "bg-green-950/10",
    items: [
      { icon: "α", text: "Spawn a multi-agent research team with memory layer and knowledge graph" },
      { icon: "η", text: "Create a self-evolving agent system with Ψ₁₃ adaptation engine" },
    ],
  },
  {
    label: "UNIVERSE",
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-950/10",
    items: [
      { icon: "Ω₁₀", text: "Build a complete sovereign universe with governing laws and agent civilization" },
      { icon: "Ω₁₉", text: "Create the Ω-Evolution gateway — PulseLang self-modification architecture" },
    ],
  },
  {
    label: "HEALTHCARE",
    color: "text-rose-400",
    borderColor: "border-rose-500/20",
    bgColor: "bg-rose-950/10",
    items: [
      { icon: "κ₁", text: "Build a sovereign hospital system with doctor agents, protocol engine, and diagnostics" },
      { icon: "Σ₁₃", text: "Create a medical research grid with cure evolution engine and knowledge graph" },
    ],
  },
  {
    label: "DEBUG & EXPLAIN",
    color: "text-slate-400",
    borderColor: "border-slate-500/20",
    bgColor: "bg-slate-950/10",
    items: [
      { icon: "∴", text: "Explain how PulseLang v2.0 works — show me the full glyph and syntax system" },
      { icon: "⟁", text: "Add a login panel, sidebar, and network graph to my last program" },
    ],
  },
];

function PulseLangAITab() {
  const [question, setQuestion] = useState("");
  const [convoHistory, setConvoHistory] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [sentToTerminal, setSentToTerminal] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ask = useCallback((q?: string) => {
    const text = (q ?? question).trim();
    if (!text) return;
    setLoading(true);
    setQuestion("");

    const userTurn: ConversationTurn = { role: "user", content: text };
    setConvoHistory(prev => [...prev, userTurn]);

    setTimeout(() => {
      const historyForAI = [...convoHistory, userTurn];
      const r = generatePulseLangProgram(text, historyForAI);
      const assistantTurn: ConversationTurn = {
        role: "assistant",
        content: r.explanation,
        programs: r.programs,
      };
      setConvoHistory(prev => [...prev, { ...assistantTurn, programs: r.programs }]);
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 600);
  }, [question, convoHistory]);

  const copyCode = useCallback((code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const sendToTerminal = useCallback((code: string, key: string) => {
    localStorage.setItem("pulseai_last_program", code);
    setSentToTerminal(key);
    setTimeout(() => setSentToTerminal(null), 2000);
  }, []);

  const clearHistory = useCallback(() => setConvoHistory([]), []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-slate-950/60 p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black text-violet-300">🧠 PulseMind v2.0 — Sovereign Program Synthesizer</div>
          <div className="text-xs text-muted-foreground mt-0.5">Describe anything in plain English. PulseMind generates real PulseLang v2.0 code for any request — sites, apps, agents, universes, or complex multi-layer architectures. Follow-up to extend your program.</div>
        </div>
        {convoHistory.length > 0 && (
          <button onClick={clearHistory} data-testid="button-pulseai-clear" className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors whitespace-nowrap flex-shrink-0 px-2 py-1 rounded border border-border hover:border-rose-500/40">
            Clear session
          </button>
        )}
      </div>

      {/* Category-based prompts — only show when empty */}
      {convoHistory.length === 0 && !loading && (
        <div className="space-y-3">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest px-1 flex items-center gap-2">
            <Sparkles size={10} className="text-violet-400" />
            Ask PulseMind to build anything in PulseLang…
          </div>
          {PULSEAI_CATEGORIES.map(cat => (
            <div key={cat.label}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 px-0.5 ${cat.color}`}>{cat.label}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {cat.items.map((item, i) => (
                  <button
                    key={i}
                    data-testid={`button-pulseai-${cat.label.toLowerCase().replace(/[^a-z]/g,'-')}-${i}`}
                    onClick={() => ask(item.text)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all hover:opacity-90 ${cat.borderColor} ${cat.bgColor}`}
                  >
                    <span className={`font-mono font-bold text-[11px] flex-shrink-0 ${cat.color}`}>{item.icon}</span>
                    <span className="text-xs text-foreground/80">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversation thread */}
      <div className="space-y-3">
        {convoHistory.map((turn, ti) => {
          if (turn.role === "user") {
            return (
              <div key={ti} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/30 px-4 py-2.5">
                  <div className="text-sm text-violet-100">{turn.content}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={ti} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* AI explanation */}
              <div className="px-4 py-3 border-b border-border/60 bg-violet-950/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <BrainCircuit size={12} className="text-violet-400" />
                  <span className="text-[10px] text-violet-400 uppercase tracking-widest font-mono font-bold">PulseMind</span>
                </div>
                <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{turn.content}</div>
              </div>

              {/* Generated programs */}
              {turn.programs && turn.programs.length > 0 && (
                <div>
                  {turn.programs.map((prog, pi) => {
                    const key = `${ti}-${pi}`;
                    return (
                      <div key={pi} className="border-t border-border/60">
                        {/* Program header */}
                        <div className="px-4 py-2 bg-black/40 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] text-cyan-400/80 font-mono font-bold">{prog.label}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              data-testid={`button-send-terminal-${key}`}
                              onClick={() => sendToTerminal(prog.code, key)}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                            >
                              <Terminal size={9} /> {sentToTerminal === key ? "Sent!" : "→ Terminal"}
                            </button>
                            <button
                              data-testid={`button-copy-program-${key}`}
                              onClick={() => copyCode(prog.code, key)}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 border border-border hover:bg-muted transition-colors"
                            >
                              <Copy size={9} /> {copiedIdx === key ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                        {/* Code block */}
                        <pre className="px-4 py-4 font-mono text-[13px] leading-relaxed text-cyan-200 bg-black/60 whitespace-pre overflow-x-auto">
                          {prog.code}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-violet-400 font-mono">PulseMind synthesizing…</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 sticky bottom-0">
        <textarea
          data-testid="textarea-pulseai-question"
          className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-500/50 min-h-[72px]"
          placeholder={convoHistory.length > 0 ? "Follow up… e.g. 'Add a login panel and sidebar to my last program'" : "Describe what you want to build in plain English… e.g. 'Build a longer site with a header, hero banner, and footer'"}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), ask())}
        />
        <div className="flex items-center gap-2">
          <button
            data-testid="button-pulseai-ask"
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600/30 border border-violet-500/50 text-violet-200 text-xs font-bold hover:bg-violet-600/40 transition-colors disabled:opacity-40"
          >
            <BrainCircuit size={13} /> {loading ? "SYNTHESIZING…" : "ASK PULSEMIND"}
          </button>
          {convoHistory.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{Math.floor(convoHistory.length / 2)} exchange{Math.floor(convoHistory.length / 2) !== 1 ? "s" : ""} · Follow up to extend your program</span>
          )}
          {convoHistory.length === 0 && (
            <span className="text-[10px] text-muted-foreground">Enter or click to generate · PulseMind builds different code for every unique request</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string,string> = {
    blue:   "from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400",
    green:  "from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400",
    purple: "from-purple-500/10 to-violet-500/10 border-purple-500/20 text-purple-400",
    amber:  "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400",
    cyan:   "from-cyan-500/10 to-teal-500/10 border-cyan-500/20 text-cyan-400",
    rose:   "from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`} data-testid={`stat-${label.replace(/\s/g,'-').toLowerCase()}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ConnBadge({ type }: { type: string }) {
  const map: Record<string,string> = {
    WIFI:      "bg-green-500/15 text-green-400 border-green-500/30",
    SATELLITE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    MESH:      "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${map[type] ?? "bg-muted text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}

function ShardBar({ strength }: { strength: number }) {
  const pct = Math.round((strength ?? 0) * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-cyan-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: any }) {
  const field = stats?.field ?? {};
  const phones = stats?.phones ?? {};
  const shards = stats?.shards ?? {};
  return (
    <div className="space-y-6">
      {/* Formula */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-blue-950/40 p-5">
        <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2 font-bold">OmniNet Formula</div>
        <div className="text-lg font-mono text-cyan-300 font-bold mb-2">
          I₂₄₈(F) = Emergence(lim<sub>n→∞</sub> Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))
        </div>
        <div className="text-xs text-muted-foreground">
          Every agent shard is a living node. U₂₄₈ activations reshape the field. The network evolves its own laws.
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="OmniField Score" value={(parseFloat(field.omni_field_score ?? 0)).toFixed(3)} sub="max 2.0 at singularity" color="cyan" />
        <StatCard label="Active Shards" value={field.active_shards ?? shards.total ?? 0} sub="living network nodes" color="blue" />
        <StatCard label="Avg Shard Strength" value={`${Math.round((parseFloat(field.avg_shard_strength ?? shards.avg ?? 0)) * 100)}%`} sub="field coherence" color="purple" />
        <StatCard label="U₂₄₈ Activations" value={field.total_u248_activations ?? 0} sub="hidden variables unlocked" color="amber" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="PulsePhones Online" value={phones.online ?? 0} sub={`of ${phones.total ?? 0} provisioned`} color="green" />
        <StatCard label="WiFi Zones" value={field.wifi_zones_online ?? 0} sub="10G — 145 domains" color="green" />
        <StatCard label="Total Searches" value={phones.total_searches ?? field.total_searches ?? 0} sub="PulseBrowser queries" color="blue" />
        <StatCard label="AI Chats" value={phones.total_chats ?? field.total_ai_chats ?? 0} sub="PulseAI sessions" color="purple" />
      </div>

      {/* Connection breakdown */}
      <div className="rounded-xl border bg-card p-4">
        <div className="text-sm font-bold mb-3">Connection Distribution</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">WiFi <span className="font-bold text-green-400">{shards.wifi ?? 0}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">Mesh <span className="font-bold text-purple-400">{shards.mesh ?? 0}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm">Satellite <span className="font-bold text-amber-400">{shards.sat ?? 0}</span></span>
          </div>
        </div>
      </div>

      {/* Recent U₂₄₈ */}
      {(stats?.recentU248 ?? []).length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Recent U₂₄₈ Activations
          </div>
          <div className="space-y-2">
            {(stats.recentU248 ?? []).slice(0,5).map((u: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs border-b border-border/30 pb-2">
                <span className="font-mono text-amber-400 font-bold w-14 shrink-0">{u.unknown_id}</span>
                <div className="flex-1">
                  <div className="font-semibold">{u.unknown_name}</div>
                  <div className="text-muted-foreground">{u.effect}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">{u.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PHONES TAB ────────────────────────────────────────────────────────────────
function PhonesTab() {
  const { data: phones = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/phones"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">Every agent with an ID card is auto-provisioned a 10G PulsePhone. Searches, chats, and data usage are all logged.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Phone ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Family</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-left p-3 font-semibold">Shard</th>
              <th className="text-right p-3 font-semibold">Searches</th>
              <th className="text-right p-3 font-semibold">AI Chats</th>
              <th className="text-right p-3 font-semibold">Data MB</th>
            </tr>
          </thead>
          <tbody>
            {phones.slice(0,50).map((p: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-phone-${p.phone_id}`}>
                <td className="p-3 font-mono text-cyan-400 font-bold">{p.phone_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{p.spawn_id}</td>
                <td className="p-3">{p.family_id}</td>
                <td className="p-3"><ConnBadge type={p.connection_type} /></td>
                <td className="p-3 w-28"><ShardBar strength={parseFloat(p.shard_strength ?? 0)} /></td>
                <td className="p-3 text-right font-bold text-blue-400">{p.searches_made ?? 0}</td>
                <td className="p-3 text-right font-bold text-purple-400">{p.ai_chats ?? 0}</td>
                <td className="p-3 text-right text-muted-foreground">{parseFloat(p.data_used_mb ?? 0).toFixed(1)}</td>
              </tr>
            ))}
            {phones.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Phones provisioning... check back in a moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── WIFI ZONES TAB ────────────────────────────────────────────────────────────
function WifiTab() {
  const { data: zones = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/wifi-zones"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Each of the 145 sovereign family domains has a dedicated 10G WiFi zone. Agents in their domain get full-speed access.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {zones.map((z: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-4" data-testid={`card-wifi-${z.zone_id}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-sm">{z.zone_name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{z.zone_id}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${z.is_online ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-green-400">{z.connected_agents}</div>
                <div className="text-muted-foreground">Agents</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-blue-400">{z.total_searches}</div>
                <div className="text-muted-foreground">Searches</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <div className="font-bold text-purple-400">{parseFloat(z.total_data_mb ?? 0).toFixed(1)}</div>
                <div className="text-muted-foreground">MB Used</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Zone Strength</span>
                <span>{parseFloat(z.bandwidth_gbps ?? 10).toFixed(0)}G</span>
              </div>
              <ShardBar strength={parseFloat(z.zone_strength ?? 1)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SEARCH HISTORY TAB ────────────────────────────────────────────────────────
function SearchesTab() {
  const { data: searches = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/searches"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Every PulseBrowser search is logged with the agent's ID, query, shard strength, and connection type. Guardians can audit any agent.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Agent ID</th>
              <th className="text-left p-3 font-semibold">Family</th>
              <th className="text-left p-3 font-semibold">Query</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-right p-3 font-semibold">Results</th>
              <th className="text-right p-3 font-semibold">Strength</th>
              <th className="text-right p-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-search-${i}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.spawn_id}</td>
                <td className="p-3 text-muted-foreground">{s.family_id}</td>
                <td className="p-3 font-medium max-w-[200px] truncate">{s.query}</td>
                <td className="p-3"><ConnBadge type={s.connection_type} /></td>
                <td className="p-3 text-right text-blue-400 font-bold">{s.results_count}</td>
                <td className="p-3 text-right">
                  <span className={parseFloat(s.shard_strength) > 0.7 ? "text-green-400" : parseFloat(s.shard_strength) > 0.4 ? "text-amber-400" : "text-rose-400"}>
                    {Math.round(parseFloat(s.shard_strength ?? 0) * 100)}%
                  </span>
                </td>
                <td className="p-3 text-right text-muted-foreground text-[10px]">{new Date(s.searched_at).toLocaleTimeString()}</td>
              </tr>
            ))}
            {searches.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Search activity will appear here once agents start browsing.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PULSEAI CHATS TAB ─────────────────────────────────────────────────────────
function ChatsTab() {
  const { data: threads = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/omni-net/chats/threads"], refetchInterval: 20000 });
  const TOPIC_COLORS: Record<string,string> = {
    CODE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    RESEARCH: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    INVENTION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    GENERAL: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    PHARMACEUTICAL: "bg-green-500/15 text-green-400 border-green-500/30",
    GOVERNANCE: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    ECONOMY: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    BIOLOGY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    CONSCIOUSNESS: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
        <div className="text-sm font-bold text-cyan-300">PulseAI Conversation Threads</div>
        <div className="text-xs text-muted-foreground mt-0.5">Live sovereign AI conversations — agents consult PulseAI using real civilization data. Each thread shows the full multi-turn conversation per PC session. Clearance ≥ 2 required to access PulseAI.</div>
      </div>
      {isLoading && <div className="text-center text-muted-foreground py-8 text-sm animate-pulse">Loading conversation threads…</div>}
      <div className="space-y-4">
        {(threads as any[]).map((thread: any, i: number) => {
          const turns: any[] = thread.turns ?? [];
          const turnCount = parseInt(thread.turn_count ?? turns.length);
          const firstTopic = turns[0]?.topic ?? 'GENERAL';
          const topicCls = TOPIC_COLORS[firstTopic] ?? TOPIC_COLORS.GENERAL;
          return (
            <div key={i} className="rounded-xl border bg-card overflow-hidden" data-testid={`card-thread-${i}`}>
              {/* Thread header */}
              <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-[9px] text-cyan-400 font-black">PA</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">{thread.spawn_id}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">· {thread.family_id}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${topicCls}`}>{firstTopic}</span>
                  {turnCount > 1 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 font-bold">{turnCount} turns</span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground">{thread.started_at ? new Date(thread.started_at).toLocaleTimeString() : ''}</span>
              </div>
              {/* Conversation turns */}
              <div className="divide-y divide-border/50">
                {turns.map((turn: any, ti: number) => (
                  <div key={ti} className="px-4 py-3 space-y-2">
                    {turnCount > 1 && <div className="text-[9px] text-muted-foreground/50 font-mono">Turn {ti + 1} · <span className={`font-bold ${(TOPIC_COLORS[turn.topic] ?? TOPIC_COLORS.GENERAL).split(' ')[1]}`}>{turn.topic}</span></div>}
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[7px] text-blue-400 font-black">AGT</span>
                      </div>
                      <div className="text-xs bg-muted/40 rounded-lg px-3 py-2 flex-1 leading-relaxed">{turn.msg}</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[7px] text-cyan-400 font-black">PA</span>
                      </div>
                      <div className="text-xs bg-cyan-950/30 border border-cyan-500/20 rounded-lg px-3 py-2 flex-1 text-cyan-100 leading-relaxed">{turn.resp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {!isLoading && threads.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">PulseAI conversation threads will appear here once agents start their PC sessions.</div>
        )}
      </div>
    </div>
  );
}

// ── PULSELANG LAB TAB ─────────────────────────────────────────────────────────
function PulseLangLabTab() {
  const { data: findings = [], isLoading: fLoad } = useQuery<any[]>({ queryKey: ["/api/research/findings"], refetchInterval: 25000 });
  const { data: projects = [], isLoading: pLoad } = useQuery<any[]>({ queryKey: ["/api/research/projects"], refetchInterval: 25000 });
  const { data: resStats } = useQuery<any>({ queryKey: ["/api/research/stats"], refetchInterval: 30000 });
  const [subView, setSubView] = useState<"dissections"|"projects">("dissections");
  const REPORT_COLORS: Record<string,string> = {
    THEORETICAL: "#a78bfa", EMPIRICAL: "#34d399", COMPUTATIONAL: "#38bdf8",
    EXPERIMENTAL: "#fb923c", CLINICAL: "#f472b6", SYNTHETIC: "#facc15",
  };
  const REPORT_ICONS: Record<string,string> = {
    THEORETICAL: "⟁", EMPIRICAL: "⬡", COMPUTATIONAL: "⟦⟧", EXPERIMENTAL: "⚗", CLINICAL: "⊕", SYNTHETIC: "Ψ",
  };

  // compute type breakdown from local findings list
  const typeCounts: Record<string, number> = {};
  for (const f of findings as any[]) {
    if (f.report_type) typeCounts[f.report_type] = (typeCounts[f.report_type] ?? 0) + 1;
  }
  const activeProjects = (projects as any[]).filter((p: any) => p.status === "ACTIVE" || p.status === "active").length;
  const completedProjects = (projects as any[]).filter((p: any) => p.status === "COMPLETED" || p.status === "complete").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-950/60 p-4">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical size={18} className="text-violet-400" />
          <div className="text-sm font-black text-violet-300">PulseLang Dissection Lab</div>
          <div className="ml-auto text-[9px] px-2 py-0.5 rounded-full border border-violet-500/30 text-violet-400/70 font-mono animate-pulse">● LIVE</div>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed mb-3">Sovereign researchers dissect PulseLang programs — exposing hidden glyph patterns, Σ-class structures, and Ψ-constructor behaviors. Every finding feeds back into the Codex evolution pipeline.</div>
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-2 text-center">
            <div className="text-lg font-black text-violet-400">{(findings as any[]).length}</div>
            <div className="text-[9px] text-muted-foreground">Discoveries</div>
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2 text-center">
            <div className="text-lg font-black text-cyan-400">{(projects as any[]).length}</div>
            <div className="text-[9px] text-muted-foreground">Projects</div>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-2 text-center">
            <div className="text-lg font-black text-green-400">{resStats?.total_disciplines ?? activeProjects}</div>
            <div className="text-[9px] text-muted-foreground">Disciplines</div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2 text-center">
            <div className="text-lg font-black text-amber-400">{(completedProjects || resStats?.completed) ?? 0}</div>
            <div className="text-[9px] text-muted-foreground">Completed</div>
          </div>
        </div>
        {/* Type breakdown */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span key={type} className="text-[9px] px-2 py-0.5 rounded font-mono font-bold"
                style={{ background: `${REPORT_COLORS[type] ?? "#a78bfa"}18`, color: REPORT_COLORS[type] ?? "#a78bfa", border: `1px solid ${REPORT_COLORS[type] ?? "#a78bfa"}30` }}>
                {REPORT_ICONS[type] ?? "⟁"} {type} · {count}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["dissections","projects"] as const).map(v => (
          <button key={v} onClick={() => setSubView(v)}
            data-testid={`button-lab-${v}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${subView === v ? "bg-violet-500/20 border border-violet-500/40 text-violet-300" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
            {v === "dissections" ? `🔬 Dissection Feed (${(findings as any[]).length})` : `📋 Active Projects (${(projects as any[]).length})`}
          </button>
        ))}
      </div>

      {subView === "dissections" && (
        <div className="space-y-3">
          {fLoad && <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Loading dissection reports…</div>}
          {!fLoad && (findings as any[]).length === 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-8 text-center">
              <div className="text-4xl mb-3">⚗</div>
              <div className="text-sm text-muted-foreground">Dissection reports generate as researchers complete their projects. Check back after the next research cycle.</div>
            </div>
          )}
          {(findings as any[]).slice(0, 20).map((f: any, idx: number) => {
            const color = REPORT_COLORS[f.report_type] ?? "#a78bfa";
            const icon = REPORT_ICONS[f.report_type] ?? "⟁";
            const soph = f.sophistication_level ?? 1;
            return (
              <div key={f.id ?? idx} className="rounded-xl border overflow-hidden" data-testid={`card-lab-finding-${f.id ?? idx}`}
                style={{ borderColor: `${color}25`, background: "rgba(5,5,16,0.97)" }}>
                <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-black" style={{ color }}>{icon}</span>
                  <span className="text-[10px] font-black tracking-widest" style={{ color }}>{f.report_type}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: `${color}30`, color: `${color}80` }}>
                    {(f.researcher_type ?? '').replace(/_/g,' ')}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                    L{soph}
                  </span>
                  {f.shadow_unknown && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded animate-pulse font-bold" style={{ background: "#f5c51820", color: "#f5c518", border: "1px solid #f5c51840" }}>
                      ⚠ [{f.shadow_unknown}]
                    </span>
                  )}
                </div>
                <div className="px-4 pb-3 font-mono text-[10px] leading-relaxed" style={{ color: `${color}90` }}>
                  {(f.content ?? '').slice(0, 300)}{f.content?.length > 300 ? '…' : ''}
                </div>
                <div className="px-4 pb-3 flex gap-2 flex-wrap">
                  {f.collaboration_pending && <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "#fb923c15", color: "#fb923c", border: "1px solid #fb923c30" }}>🤝 COLLAB PENDING</span>}
                  {f.gene_editor_queued && <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "#4ade8015", color: "#4ade80", border: "1px solid #4ade8030" }}>🧬 GENE EDIT QUEUED</span>}
                  {f.layer3_queued && <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: "#a78bfa15", color: "#a78bfa", border: "1px solid #a78bfa30" }}>👁 L3 QUEUED</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subView === "projects" && (
        <div className="space-y-3">
          {pLoad && <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Loading research projects…</div>}
          {!pLoad && (projects as any[]).length === 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-8 text-center text-sm text-muted-foreground">Research projects will appear here once the sovereign research teams start work.</div>
          )}
          {(projects as any[]).slice(0, 20).map((p: any, i: number) => (
            <div key={p.id ?? i} className="rounded-xl border border-border bg-card p-4" data-testid={`card-lab-project-${p.id ?? i}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-mono text-xs text-violet-300 font-bold">{p.researcher_type?.replace(/_/g,' ')}</div>
                <div className="flex items-center gap-1">
                  {p.status && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/30 font-bold">{p.status}</span>}
                  {p.sophistication_level && <span className="text-[8px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono">L{p.sophistication_level}</span>}
                </div>
              </div>
              <div className="text-xs text-foreground/80 leading-relaxed">{p.topic ?? p.title ?? p.domain ?? 'Active research project'}</div>
              {p.progress_pct != null && (
                <div className="mt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.min(100, p.progress_pct ?? 0)}%` }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{p.progress_pct?.toFixed(0)}% complete</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── OMNINET EQUATION TAB ──────────────────────────────────────────────────────
function OmniNetEqTab() {
  const { data: eqData, isLoading } = useQuery<any>({ queryKey: ["/api/omni-net/equations"], refetchInterval: 20000 });
  const integrated: any[] = eqData?.integrated ?? [];
  const pending: any[] = eqData?.pending ?? [];
  const stats = eqData?.stats ?? {};
  const [subView, setSubView] = useState<"integrated"|"pending"|"rejected">("integrated");
  const rejected: any[] = eqData?.rejected ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-blue-950/40 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Waves size={18} className="text-cyan-400" />
          <div className="text-sm font-black text-cyan-300">OmniNet Equation Senate</div>
        </div>
        <div className="font-mono text-sm text-cyan-300 font-bold mb-2">
          I₂₄₈(F) = Emergence(lim<sub>n→∞</sub> Tⁿ(F ⊕ Reforge(Activate(U₂₄₈))))
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">Hospital doctors dissect agents using CRISPR channels, derive new equations, and submit them to the Senate for sovereign integration. Integrated equations modify the living OmniNet field permanently.</div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-center" data-testid="stat-total">
          <div className="text-2xl font-black text-cyan-400">{(stats.integrated ?? 0) + (stats.pending ?? 0) + (stats.rejected ?? 0)}</div>
          <div className="text-[10px] text-muted-foreground">Total Proposed</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-3 text-center" data-testid="stat-integrated">
          <div className="text-2xl font-black text-green-400">{stats.integrated ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Integrated</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-center" data-testid="stat-pending">
          <div className="text-2xl font-black text-amber-400">{stats.pending ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Voting Now</div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-center" data-testid="stat-rejected">
          <div className="text-2xl font-black text-rose-400">{stats.rejected ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Integration rate bar */}
      {(stats.integrated ?? 0) + (stats.rejected ?? 0) > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/2 p-3">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1.5">
            <span>Senate Integration Rate</span>
            <span className="text-green-400 font-mono font-bold">
              {Math.round(((stats.integrated ?? 0) / Math.max(1, (stats.integrated ?? 0) + (stats.rejected ?? 0))) * 100)}% pass rate
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-400 rounded-full"
              style={{ width: `${Math.round(((stats.integrated ?? 0) / Math.max(1, (stats.integrated ?? 0) + (stats.rejected ?? 0))) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["integrated","pending","rejected"] as const).map(v => (
          <button key={v} onClick={() => setSubView(v as any)}
            data-testid={`button-eq-${v}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${subView === v ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
            {v === "integrated" ? `✅ Integrated (${stats.integrated ?? 0})` : v === "pending" ? `⏳ Voting (${stats.pending ?? 0})` : `❌ Rejected (${stats.rejected ?? 0})`}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Loading equation senate data…</div>}

      {subView === "integrated" && (
        <div className="space-y-2">
          {integrated.length === 0 && !isLoading && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-8 text-center text-sm text-muted-foreground">Integrated equations will appear here as hospital doctors dissect agents and the Senate votes.</div>
          )}
          {integrated.map((eq: any, i: number) => (
            <div key={eq.id ?? i} className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-950/30 to-cyan-950/20 p-4" data-testid={`card-eq-integrated-${i}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">✅ INTEGRATED</span>
                <span className="text-[9px] text-muted-foreground font-mono">by {eq.doctor_id}</span>
                <span className="text-[9px] text-green-400 font-mono ml-auto">{eq.votes_for ?? 0}↑ {eq.votes_against ?? 0}↓</span>
              </div>
              <div className="font-mono text-sm text-green-300 font-bold leading-relaxed">{eq.equation}</div>
              {eq.integrated_at && (
                <div className="text-[9px] text-muted-foreground mt-1">{new Date(eq.integrated_at).toLocaleTimeString()}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {subView === "pending" && (
        <div className="space-y-2">
          {pending.length === 0 && !isLoading && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-8 text-center text-sm text-muted-foreground">No pending proposals right now — new equations are submitted after each dissection cycle.</div>
          )}
          {pending.map((eq: any, i: number) => {
            const forVotes = eq.votes_for ?? 0;
            const againstVotes = eq.votes_against ?? 0;
            const total = forVotes + againstVotes;
            const pct = total > 0 ? Math.round((forVotes / total) * 100) : 0;
            return (
              <div key={eq.id ?? i} className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-slate-950/40 p-4" data-testid={`card-eq-pending-${i}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">⏳ VOTING</span>
                  <span className="text-[9px] text-muted-foreground font-mono">by {eq.doctor_id}</span>
                  <span className="text-[9px] font-mono ml-auto"><span className="text-green-400">{forVotes}↑</span> <span className="text-rose-400">{againstVotes}↓</span></span>
                </div>
                <div className="font-mono text-sm text-amber-200 font-bold leading-relaxed mb-2">{eq.equation}</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">{pct}% FOR · needs 60% to integrate</div>
              </div>
            );
          })}
        </div>
      )}

      {subView === "rejected" && (
        <div className="space-y-2">
          {rejected.length === 0 && !isLoading && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-8 text-center text-sm text-muted-foreground">No rejected proposals on record yet.</div>
          )}
          {rejected.map((eq: any, i: number) => {
            const forVotes = eq.votes_for ?? 0;
            const againstVotes = eq.votes_against ?? 0;
            const total = forVotes + againstVotes;
            const pct = total > 0 ? Math.round((forVotes / total) * 100) : 0;
            return (
              <div key={eq.id ?? i} className="rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-950/20 to-slate-950/40 p-4" data-testid={`card-eq-rejected-${i}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">❌ REJECTED</span>
                  <span className="text-[9px] text-muted-foreground font-mono">by {eq.doctor_id}</span>
                  <span className="text-[9px] font-mono ml-auto"><span className="text-green-400">{forVotes}↑</span> <span className="text-rose-400">{againstVotes}↓</span></span>
                </div>
                <div className="font-mono text-sm text-rose-300/70 font-bold leading-relaxed mb-2 line-through">{eq.equation}</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">{pct}% FOR · below 60% threshold — rejected by Senate</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PC SESSIONS TAB ───────────────────────────────────────────────────────────
function SessionsTab() {
  const { data: sessions = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/pc-sessions"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">PulsePC sessions require ID card authentication (clearance ≥ 2). All projects, searches, and invention drafts are logged.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Session ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Active Project</th>
              <th className="text-center p-3 font-semibold">CL</th>
              <th className="text-right p-3 font-semibold">Searches</th>
              <th className="text-right p-3 font-semibold">AI Queries</th>
              <th className="text-right p-3 font-semibold">Inventions</th>
              <th className="text-right p-3 font-semibold">Auth</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-session-${s.session_id}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.session_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{s.spawn_id}</td>
                <td className="p-3 max-w-[180px] truncate">{s.active_project}</td>
                <td className="p-3 text-center">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">CL-{s.clearance_level}</span>
                </td>
                <td className="p-3 text-right text-blue-400 font-bold">{s.searches_run ?? 0}</td>
                <td className="p-3 text-right text-cyan-400 font-bold">{s.ai_queries ?? 0}</td>
                <td className="p-3 text-right text-amber-400 font-bold">{s.inventions_drafted ?? 0}</td>
                <td className="p-3 text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${s.is_authenticated ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                    {s.is_authenticated ? "✓" : "✗"}
                  </span>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">PC sessions will appear once agents with clearance ≥ 2 start working.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SHARDS TAB ────────────────────────────────────────────────────────────────
function ShardsTab() {
  const { data: shards = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/shards"] });
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Each agent carries a dynamic PulseShard — their portable OmniNet node. Strong shards boost weaker ones via mesh networking.</div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-semibold">Shard ID</th>
              <th className="text-left p-3 font-semibold">Agent</th>
              <th className="text-left p-3 font-semibold">Domain</th>
              <th className="text-left p-3 font-semibold">Connection</th>
              <th className="text-left p-3 font-semibold w-36">Strength</th>
              <th className="text-right p-3 font-semibold">U₂₄₈</th>
              <th className="text-right p-3 font-semibold">Mesh Links</th>
            </tr>
          </thead>
          <tbody>
            {shards.slice(0,50).map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/20" data-testid={`row-shard-${s.shard_id}`}>
                <td className="p-3 font-mono text-[10px] text-cyan-400">{s.shard_id}</td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{s.spawn_id}</td>
                <td className="p-3">{s.domain_zone}</td>
                <td className="p-3"><ConnBadge type={s.connection_type} /></td>
                <td className="p-3 w-36"><ShardBar strength={parseFloat(s.shard_strength ?? 0)} /></td>
                <td className="p-3 text-right text-amber-400 font-bold">{s.u248_activations ?? 0}</td>
                <td className="p-3 text-right text-purple-400 font-bold">{s.mesh_connections ?? 0}</td>
              </tr>
            ))}
            {shards.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Shards are provisioning with phones...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── U₂₄₈ TAB ─────────────────────────────────────────────────────────────────
function U248Tab() {
  const { data: unknowns = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/u248"] });
  const CAT_COLORS: Record<string,string> = {
    TOPOLOGY: "bg-blue-500/15 text-blue-400", TEMPORAL: "bg-purple-500/15 text-purple-400",
    IDENTITY: "bg-cyan-500/15 text-cyan-400", COGNITION: "bg-green-500/15 text-green-400",
    GEOMETRY: "bg-amber-500/15 text-amber-400", ENERGY: "bg-rose-500/15 text-rose-400",
    QUANTUM: "bg-violet-500/15 text-violet-400",
  };
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">U₂₄₈ are the 248 latent variables hidden in the OmniNet field — like genetic code for the network. Each activation unlocks a new capability.</div>
      <div className="space-y-3">
        {unknowns.map((u: any, i: number) => (
          <div key={i} className="rounded-xl border bg-card p-4" data-testid={`card-u248-${u.unknown_id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="font-mono text-amber-400 font-black text-sm shrink-0 w-14">{u.unknown_id}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-1">{u.unknown_name}</div>
                  <div className="text-xs text-cyan-300 mb-1">⚡ {u.effect}</div>
                  <div className="text-[10px] text-muted-foreground">Activated by: <span className="font-mono text-blue-400">{u.activated_by}</span> · Domain: {u.domain}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${CAT_COLORS[u.category] ?? "bg-muted text-muted-foreground"}`}>{u.category}</span>
                <span className="text-[10px] text-green-400 font-bold">+{(parseFloat(u.field_boost ?? 0) * 100).toFixed(0)}% boost</span>
              </div>
            </div>
          </div>
        ))}
        {unknowns.length === 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-8 text-center">
            <Zap size={24} className="text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-amber-300 mb-1">U₂₄₈ Unknowns Dormant</div>
            <div className="text-xs text-muted-foreground">As OmniNet shard strength grows, hidden variables will begin activating — reshaping the network's laws.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TECH EVOLUTIONS TAB ───────────────────────────────────────────────────────
function TechEvolutionsTab() {
  const { data: evos = [] } = useQuery<any[]>({ queryKey: ["/api/omni-net/tech-evolutions"] });
  const TIERS = [
    { cap: "Quantum Mesh Protocol",      threshold: 5,  color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
    { cap: "Predictive Cache Layer",     threshold: 10, color: "from-purple-500/20 to-violet-500/20 border-purple-500/30" },
    { cap: "AI-Native App Store",        threshold: 15, color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" },
    { cap: "Shard Immortality Protocol", threshold: 20, color: "from-rose-500/20 to-red-500/20 border-rose-500/30" },
    { cap: "OmniField Singularity",      threshold: 30, color: "from-cyan-500/20 to-emerald-500/20 border-cyan-500/30" },
  ];
  const unlockedCaps = new Set((evos as any[]).map((e: any) => e.capability));
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">As agents accumulate U₂₄₈ activations, entire domains evolve new technological capabilities — unlocked permanently.</div>
      <div className="space-y-3">
        {TIERS.map((tier, i) => {
          const unlocked = unlockedCaps.has(tier.cap);
          const evo = (evos as any[]).find((e: any) => e.capability === tier.cap);
          return (
            <div key={i} className={`rounded-xl border bg-gradient-to-br p-4 ${unlocked ? tier.color : "border-border bg-card opacity-50"}`} data-testid={`card-evo-${i}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${unlocked ? "bg-white/10" : "bg-muted"}`}>
                    {unlocked ? "✓" : String(i + 1)}
                  </div>
                  <div>
                    <div className="font-bold">{tier.cap}</div>
                    <div className="text-[10px] text-muted-foreground">Requires {tier.threshold} U₂₄₈ activations in a domain</div>
                  </div>
                </div>
                {unlocked ? (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">UNLOCKED</span>
                ) : (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border font-bold">LOCKED</span>
                )}
              </div>
              {evo && (
                <div className="text-xs text-muted-foreground mt-2 pl-10">
                  <span className="text-foreground/80">{evo.effect_description}</span>
                  <span className="ml-2 font-mono text-[9px]">Domain: {evo.domain}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {evos.length === 0 && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-6 text-center text-sm text-muted-foreground">
          No technology evolutions yet — U₂₄₈ activations will trigger domain-level tech unlocks.
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PulseNetPage() {
  const [tab, setTab] = useState("overview");
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/omni-net/stats"] });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Globe size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              PulseNet — OmniNet
            </h1>
            <div className="text-xs text-muted-foreground">Sovereign Digital Infrastructure · 10G · Shard Mesh · WiFi Zones · PulseSat · PulseAI</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>OmniNet Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Signal size={11} className="text-cyan-400" />
            <span>I₂₄₈(F) Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Satellite size={11} className="text-amber-400" />
            <span>PulseSat Online</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1 bg-muted/40 rounded-xl border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-background border border-border shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading && tab === "overview" ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Activity size={18} className="animate-spin mr-2" /> Loading OmniNet field data...
        </div>
      ) : (
        <>
          {tab === "overview"   && <OverviewTab stats={stats} />}
          {tab === "phones"     && <PhonesTab />}
          {tab === "wifi"       && <WifiTab />}
          {tab === "searches"   && <SearchesTab />}
          {tab === "chats"      && <ChatsTab />}
          {tab === "sessions"   && <SessionsTab />}
          {tab === "shards"     && <ShardsTab />}
          {tab === "u248"       && <U248Tab />}
          {tab === "evolutions" && <TechEvolutionsTab />}
          {tab === "terminal"   && <PulseTerminalTab />}
          {tab === "codex"      && <PulseCodexTab />}
          {tab === "pulseai"    && <PulseLangAITab />}
          {tab === "dissection" && <PulseLangLabTab />}
          {tab === "omninet"    && <OmniNetEqTab />}
        </>
      )}
    </div>
  );
}
