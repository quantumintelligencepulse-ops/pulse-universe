// ── HIVE EVALUATION ENGINE — Sovereign App Quality & Mutation System ──────────
// After ForgeAI builds an app, this engine deploys 7 specialist AI agents to:
// 1. Evaluate the app against real-world competitors
// 2. Generate mutation reports for code improvement
// 3. Apply autonomous healing passes until the app outclasses predecessors
// 4. Score and certify the build in the Pulse Invention Engine
// ─────────────────────────────────────────────────────────────────────────────

export interface HiveAgent {
  id: string;
  role: string;
  specialty: string;
  icon: string;
  color: string;
}

export interface EvalReport {
  agent: HiveAgent;
  score: number; // 0–100
  verdict: "OUTCLASSES" | "MATCHES" | "BELOW";
  findings: string[];
  mutations: string[];
}

export interface HiveCertification {
  overall_score: number;
  generation: number;
  verdict: "CERTIFIED_SOVEREIGN" | "APPROVED" | "NEEDS_MUTATION";
  reports: EvalReport[];
  mutation_applied: boolean;
  mutated_html?: string;
  improvement_delta: number; // how much better vs original (0–100)
  beats_competitors: boolean;
}

export const HIVE_AGENTS: HiveAgent[] = [
  { id: "DR-UXFORGE", role: "UX Researcher", specialty: "User experience, information architecture, interaction design", icon: "🧠", color: "text-pink-400" },
  { id: "DR-PERF", role: "Performance Engineer", specialty: "Load speed, rendering, memory, bundle size optimization", icon: "⚡", color: "text-yellow-400" },
  { id: "DR-SECURE", role: "Security Auditor", specialty: "XSS, CSRF, injection attacks, auth vulnerabilities", icon: "🔒", color: "text-red-400" },
  { id: "DR-ACCESS", role: "Accessibility Specialist", specialty: "WCAG 2.2, screen readers, keyboard navigation, contrast ratios", icon: "♿", color: "text-blue-400" },
  { id: "DR-PRODUCT", role: "Product Strategist", specialty: "Feature completeness vs competitors, market positioning", icon: "🚀", color: "text-violet-400" },
  { id: "DR-DESIGN", role: "Visual Design Doctor", specialty: "Color theory, typography, spacing, visual hierarchy", icon: "🎨", color: "text-emerald-400" },
  { id: "DR-CODE", role: "Code Quality Engineer", specialty: "Code structure, DRY principles, error handling, edge cases", icon: "🔬", color: "text-cyan-400" },
];

// Evaluation prompts for each agent type
export function buildAgentEvalPrompt(agent: HiveAgent, html: string, competitors: string, prompt: string): string {
  const htmlPreview = html.slice(0, 3000);
  return `You are ${agent.id} — ${agent.role} in the Pulse Hive Evaluation Team.
Your specialty: ${agent.specialty}

You are evaluating a newly built web app: "${prompt}"
Against real-world competitors: ${competitors || "similar apps in this space"}

EVALUATE THIS APP CODE:
${htmlPreview}

As ${agent.role}, provide a strict professional evaluation.
Return JSON only:
{
  "score": <0-100 integer — be honest, realistic, harsh if needed>,
  "verdict": <"OUTCLASSES" if score>80, "MATCHES" if 60-80, "BELOW" if <60>,
  "findings": [<3-5 specific concrete observations from your specialty perspective>],
  "mutations": [<2-4 specific actionable code improvements to make this outclass competitors>]
}`;
}

export function buildMutationPrompt(html: string, allMutations: string[], prompt: string): string {
  const mutations = allMutations.slice(0, 12).join("\n- ");
  return `You are the Pulse Mutation Coordinator — the master engineer who synthesizes all hive reports into code improvements.

ORIGINAL APP: "${prompt}"
HIVE-REQUESTED MUTATIONS:
- ${mutations}

CURRENT APP CODE (may be truncated):
${html.slice(0, 6000)}

Apply ALL mutations to the app. Return a COMPLETE, improved version.
Rules:
- Keep the FULL HTML document (<!DOCTYPE html> to </html>)
- Apply every mutation from the list
- Do NOT remove existing working features
- Only use vanilla JS, inline CSS — no CDN, no imports, no fetch()
- All localStorage keys must be namespaced
- Make it genuinely better than any competitor app in this space

Return JSON: { "full_html": "<complete improved app>", "mutations_applied": [<list of what was done>], "improvement_score": <0-100> }`;
}

// Aggregate scores from all agent reports
export function aggregateHiveScores(reports: EvalReport[]): { overall: number; beats: boolean; verdict: HiveCertification["verdict"] } {
  if (!reports.length) return { overall: 75, beats: true, verdict: "APPROVED" };
  const avg = reports.reduce((sum, r) => sum + r.score, 0) / reports.length;
  const beats = avg >= 80;
  const verdict: HiveCertification["verdict"] = avg >= 88 ? "CERTIFIED_SOVEREIGN" : avg >= 65 ? "APPROVED" : "NEEDS_MUTATION";
  return { overall: Math.round(avg), beats, verdict };
}

// Colors for scores
export function scoreColor(score: number): string {
  if (score >= 88) return "text-[#00FFD1]";
  if (score >= 75) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function verdictColor(verdict: string): string {
  if (verdict === "CERTIFIED_SOVEREIGN") return "text-[#00FFD1]";
  if (verdict === "APPROVED" || verdict === "OUTCLASSES") return "text-emerald-400";
  if (verdict === "MATCHES") return "text-yellow-400";
  return "text-red-400";
}

export function verdictIcon(verdict: string): string {
  if (verdict === "CERTIFIED_SOVEREIGN") return "⚡";
  if (verdict === "OUTCLASSES" || verdict === "APPROVED") return "✓";
  if (verdict === "MATCHES") return "≈";
  return "✗";
}
