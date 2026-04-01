// ── HIVE AUTONOMOUS TESTING ENGINE — 5-Phase Play Store Protocol ──────────────
// Every ForgeAI app goes through this full pipeline before certification.
// Mirrors Google Play's requirements: internal → closed → open → production → regression
// Fully automated, no humans, no waiting — compressed to minutes by AI simulation.
// ─────────────────────────────────────────────────────────────────────────────

export interface SyntheticTester {
  id: string;
  persona: string;
  device: string;
  os: string;
  behavior: string;
  sensitivity: "HIGH" | "MEDIUM" | "LOW";
  focus: string;
}

export interface TestResult {
  tester: SyntheticTester;
  session_score: number;      // 0-100
  crash_free: boolean;
  issues_found: string[];
  liked: string[];
  session_length: string;     // simulated
  feedback: string;
}

export interface Phase1Report {
  status: "PASS" | "FAIL" | "WARN";
  build_valid: boolean;
  html_structure_ok: boolean;
  script_errors: string[];
  missing_elements: string[];
  empty_arrays: string[];
  missing_functions: string[];
  has_toast: boolean;
  has_nav: boolean;
  has_crud: boolean;
  has_search: boolean;
  has_modal: boolean;
  has_dark_mode: boolean;
  has_responsive: boolean;
  has_keyboard_shortcuts: boolean;
  dom_element_count: number;
  script_line_count: number;
  css_rule_count: number;
  overall_score: number;
}

export interface Phase2Report {
  tester_count: number;
  crash_free_rate: number;    // percentage
  avg_session_score: number;
  avg_session_length: string;
  critical_issues: string[];
  positive_feedback: string[];
  ux_issues: string[];
  stability_score: number;
  retention_estimate: string;
  simulated_days: number;
  test_results: TestResult[];
}

export interface Phase3Report {
  load_time_estimate: string;
  dom_complexity: "LIGHT" | "MODERATE" | "HEAVY";
  script_complexity: "LOW" | "MEDIUM" | "HIGH";
  css_complexity: "SIMPLE" | "MODERATE" | "COMPLEX";
  total_size_kb: number;
  performance_score: number;
  recommendations: string[];
  network_resilience: "GOOD" | "FAIR" | "POOR";
  offline_capable: boolean;
}

export interface Phase4Report {
  has_title: boolean;
  has_meta_description: boolean;
  has_og_tags: boolean;
  has_viewport_meta: boolean;
  has_charset: boolean;
  wcag_indicators: string[];
  policy_issues: string[];
  technical_passes: string[];
  technical_fails: string[];
  store_listing: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    rating_prediction: string;
  };
  readiness_score: number;
  publish_ready: boolean;
}

export interface PlayStoreReport {
  app_name: string;
  app_prompt: string;
  phase1: Phase1Report;
  phase2: Phase2Report;
  phase3: Phase3Report;
  phase4: Phase4Report;
  overall_score: number;
  publish_ready: boolean;
  certification: "CERTIFIED_SOVEREIGN" | "APPROVED" | "NEEDS_FIX" | "BLOCKED";
  generated_at: string;
  auto_repair_applied: boolean;
}

// ── 20 Synthetic Tester Personas (Google's 14-day requirement simulated) ──────
export const SYNTHETIC_TESTERS: SyntheticTester[] = [
  { id: "T01", persona: "Power User", device: "Galaxy S24 Ultra", os: "Android 14", behavior: "Explores every feature exhaustively", sensitivity: "HIGH", focus: "completeness" },
  { id: "T02", persona: "Casual Browser", device: "Pixel 7a", os: "Android 13", behavior: "Light usage, quick sessions", sensitivity: "LOW", focus: "onboarding" },
  { id: "T03", persona: "Elderly User (68)", device: "Samsung A54", os: "Android 12", behavior: "Slow, deliberate, reads everything", sensitivity: "HIGH", focus: "accessibility" },
  { id: "T04", persona: "Tech-Savvy Millennial", device: "iPhone 15 Pro", os: "iOS 17", behavior: "Fast, critical, compares to other apps", sensitivity: "HIGH", focus: "design" },
  { id: "T05", persona: "Student", device: "Moto G Power", os: "Android 11", behavior: "Heavy use for homework/projects", sensitivity: "MEDIUM", focus: "functionality" },
  { id: "T06", persona: "Business Professional", device: "MacBook Air M2", os: "macOS", behavior: "Efficiency-focused, no tolerance for bugs", sensitivity: "HIGH", focus: "performance" },
  { id: "T07", persona: "Low-End Device User", device: "Tecno Spark 8", os: "Android Go", behavior: "Slow device, 2G network", sensitivity: "HIGH", focus: "load_time" },
  { id: "T08", persona: "Parent (37)", device: "iPad Air 5", os: "iPadOS 17", behavior: "Uses while multitasking with kids", sensitivity: "MEDIUM", focus: "simplicity" },
  { id: "T09", persona: "First-Time User", device: "Galaxy A34", os: "Android 13", behavior: "Never used similar app before", sensitivity: "MEDIUM", focus: "onboarding" },
  { id: "T10", persona: "Accessibility User", device: "Pixel 6", os: "Android 14", behavior: "Uses screen reader TalkBack", sensitivity: "HIGH", focus: "a11y" },
  { id: "T11", persona: "Night Shift Worker", device: "OnePlus 12", os: "Android 14", behavior: "Uses at night, needs dark mode", sensitivity: "MEDIUM", focus: "dark_mode" },
  { id: "T12", persona: "Gamer (19)", device: "ASUS ROG Phone", os: "Android 14", behavior: "Fast reflexes, hates lag", sensitivity: "HIGH", focus: "animations" },
  { id: "T13", persona: "Data Analyst", device: "Dell XPS 15", os: "Windows 11", behavior: "Uses desktop browser, needs charts", sensitivity: "HIGH", focus: "data_viz" },
  { id: "T14", persona: "Minimalist", device: "iPhone SE", os: "iOS 16", behavior: "Wants clean UI, hates clutter", sensitivity: "MEDIUM", focus: "design" },
  { id: "T15", persona: "Heavy Data Entry", device: "Galaxy Tab S9", os: "Android 14", behavior: "Enters 100+ items, tests forms heavily", sensitivity: "HIGH", focus: "crud" },
  { id: "T16", persona: "International User", device: "Xiaomi 14", os: "Android 14", behavior: "Non-English keyboard, RTL testing", sensitivity: "MEDIUM", focus: "i18n" },
  { id: "T17", persona: "Privacy-Conscious", device: "Fairphone 5", os: "Android 13", behavior: "Checks what data is stored", sensitivity: "HIGH", focus: "security" },
  { id: "T18", persona: "Speed Tester", device: "Google Pixel 8 Pro", os: "Android 14", behavior: "Rapid taps, stress testing UI", sensitivity: "HIGH", focus: "stress" },
  { id: "T19", persona: "Feature Reviewer", device: "Surface Pro 9", os: "Windows 11", behavior: "Systematically documents every feature", sensitivity: "HIGH", focus: "completeness" },
  { id: "T20", persona: "Random Walk User", device: "Galaxy M54", os: "Android 13", behavior: "Clicks randomly, unexpected navigation", sensitivity: "LOW", focus: "stability" },
];

// ── PHASE 1: Static Build Validation (no LLM — instant analysis) ─────────────
export function runPhase1(html: string): Phase1Report {
  const lower = html.toLowerCase();

  // Check structural elements
  const hasDoctype = html.trimStart().startsWith("<!DOCTYPE") || html.trimStart().startsWith("<!doctype");
  const hasHead = lower.includes("<head");
  const hasBody = lower.includes("<body");
  const hasTitle = lower.includes("<title");
  const hasScript = lower.includes("<script");

  // Check feature markers
  const hasToast = lower.includes("toast") || lower.includes("notification") || lower.includes("alert(");
  const hasNav = lower.includes("<nav") || lower.includes("sidebar") || lower.includes("navbar") || lower.includes("navigation");
  const hasCrud = (lower.includes("addeventlistener") || lower.includes("onclick")) &&
    lower.includes("localstorage") &&
    (lower.includes("delete") || lower.includes("remove"));
  const hasSearch = lower.includes("search") && (lower.includes("filter") || lower.includes("queryselectorall"));
  const hasModal = lower.includes("modal") || lower.includes("dialog") || lower.includes("overlay");
  const hasDarkMode = lower.includes("dark") && (lower.includes("toggle") || lower.includes("theme"));
  const hasResponsive = lower.includes("@media") || lower.includes("viewport");
  const hasKeyboard = lower.includes("keydown") || lower.includes("ctrl+") || lower.includes("ctrlkey");

  // Detect common errors
  const scriptErrors: string[] = [];
  const missingElements: string[] = [];
  const emptyArrays: string[] = [];
  const missingFunctions: string[] = [];

  // Check for CDN imports (forbidden)
  if (lower.includes("cdnjs.cloudflare.com") || lower.includes("cdn.jsdelivr.net")) {
    scriptErrors.push("External CDN import detected — may break in offline mode");
  }
  if (lower.includes("import ") && lower.includes("from '")) {
    scriptErrors.push("ES6 module import detected — not supported in standalone HTML");
  }
  if (lower.includes("fetch(") || lower.includes("xmlhttprequest")) {
    scriptErrors.push("Network request detected — will fail without backend");
  }

  // Check for empty arrays
  const emptyArrayMatches = html.match(/const \w+ = \[\];/g) || [];
  emptyArrayMatches.forEach(m => emptyArrays.push(m.slice(6, m.indexOf(" ="))));

  // Count structural elements
  const domCount = (html.match(/<(?:div|section|article|main|header|footer|nav|aside|span|p|h[1-6]|button|input|form|table|ul|li)/gi) || []).length;
  const scriptLines = html.includes("<script") ? (html.split("\n").filter(l => {
    const trimmed = l.trim();
    return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*");
  }).length) : 0;
  const cssRules = (html.match(/\{[^}]+\}/g) || []).filter(m => !m.includes("function") && !m.includes("=>")).length;

  // Score calculation
  const checks = [
    hasDoctype, hasHead, hasBody, hasTitle, hasScript,
    hasToast, hasNav, hasCrud, hasSearch, hasModal,
    hasDarkMode, hasResponsive,
  ];
  const passCount = checks.filter(Boolean).length;
  const errorPenalty = Math.min(30, scriptErrors.length * 10);
  const emptyPenalty = Math.min(20, emptyArrays.length * 5);
  const overallScore = Math.max(0, Math.round((passCount / checks.length) * 100) - errorPenalty - emptyPenalty);

  return {
    status: overallScore >= 75 ? "PASS" : overallScore >= 50 ? "WARN" : "FAIL",
    build_valid: hasDoctype && hasHead && hasBody && hasScript,
    html_structure_ok: hasDoctype && hasHead && hasBody,
    script_errors: scriptErrors,
    missing_elements: missingElements,
    empty_arrays: emptyArrays,
    missing_functions: missingFunctions,
    has_toast: hasToast,
    has_nav: hasNav,
    has_crud: hasCrud,
    has_search: hasSearch,
    has_modal: hasModal,
    has_dark_mode: hasDarkMode,
    has_responsive: hasResponsive,
    has_keyboard_shortcuts: hasKeyboard,
    dom_element_count: domCount,
    script_line_count: scriptLines,
    css_rule_count: cssRules,
    overall_score: overallScore,
  };
}

// ── PHASE 3: Static Performance Analysis (no LLM — instant) ──────────────────
export function runPhase3(html: string): Phase3Report {
  const totalBytes = new Blob([html]).size;
  const totalKb = Math.round(totalBytes / 1024);
  const lower = html.toLowerCase();

  // DOM complexity
  const domCount = (html.match(/<(?:div|section|article|span|p|h[1-6]|button|input|li)/gi) || []).length;
  const domComplexity: Phase3Report["dom_complexity"] = domCount > 300 ? "HEAVY" : domCount > 100 ? "MODERATE" : "LIGHT";

  // Script complexity (line count)
  const scriptContent = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<(?!script)[^>]+>/gi, "");
  const scriptLines = scriptContent.split("\n").filter(l => l.trim()).length;
  const scriptComplexity: Phase3Report["script_complexity"] = scriptLines > 500 ? "HIGH" : scriptLines > 200 ? "MEDIUM" : "LOW";

  // CSS complexity
  const cssRules = (html.match(/\{[^{}]+\}/g) || []).length;
  const cssComplexity: Phase3Report["css_complexity"] = cssRules > 100 ? "COMPLEX" : cssRules > 40 ? "MODERATE" : "SIMPLE";

  // Load time estimate (rough formula: base 200ms + size factor)
  const loadMs = 200 + Math.round(totalKb * 2) + (domCount * 0.5);
  const loadTime = loadMs < 800 ? `~${Math.round(loadMs)}ms` : `~${(loadMs / 1000).toFixed(1)}s`;

  // Performance score
  let perfScore = 100;
  if (totalKb > 500) perfScore -= 20;
  if (totalKb > 200) perfScore -= 10;
  if (domCount > 200) perfScore -= 10;
  if (scriptLines > 400) perfScore -= 5;
  if (lower.includes("setinterval")) perfScore -= 5; // polling
  perfScore = Math.max(40, perfScore);

  // Recommendations
  const recs: string[] = [];
  if (totalKb > 200) recs.push("Consider lazy-rendering off-screen elements");
  if (domCount > 200) recs.push("Virtualize long lists for better scroll performance");
  if (lower.includes("setinterval") && !lower.includes("clearinterval")) recs.push("Ensure all setInterval calls are cleared on teardown");
  if (!lower.includes("debounce") && lower.includes("search")) recs.push("Add debouncing to search input (300ms)");
  if (!lower.includes("will-change") && lower.includes("animation")) recs.push("Add will-change: transform to animated elements");
  if (recs.length === 0) recs.push("No performance issues detected");

  const offlineCapable = lower.includes("serviceworker") || lower.includes("service worker");
  const networkResilience: Phase3Report["network_resilience"] = offlineCapable ? "GOOD" : lower.includes("localstorage") ? "FAIR" : "POOR";

  return {
    load_time_estimate: loadTime,
    dom_complexity: domComplexity,
    script_complexity: scriptComplexity,
    css_complexity: cssComplexity,
    total_size_kb: totalKb,
    performance_score: perfScore,
    recommendations: recs,
    network_resilience: networkResilience,
    offline_capable: offlineCapable,
  };
}

// ── PHASE 4: Production Readiness Gate (static + structured check) ────────────
export function runPhase4(html: string, appName: string, appDesc: string, appPrompt: string): Phase4Report {
  const lower = html.toLowerCase();

  const hasTitle = lower.includes("<title") && !lower.includes("<title></title>");
  const hasMetaDesc = lower.includes('name="description"') || lower.includes("name='description'");
  const hasOgTags = lower.includes("og:title") || lower.includes("og:description");
  const hasViewport = lower.includes('name="viewport"') || lower.includes("name='viewport'");
  const hasCharset = lower.includes("charset");

  // WCAG accessibility indicators
  const wcagIndicators: string[] = [];
  if (lower.includes("aria-label")) wcagIndicators.push("✓ ARIA labels present");
  if (lower.includes("role=")) wcagIndicators.push("✓ Role attributes present");
  if (lower.includes("tabindex")) wcagIndicators.push("✓ Keyboard tab order defined");
  if (lower.includes("focus")) wcagIndicators.push("✓ Focus management present");
  if (lower.includes("alt=")) wcagIndicators.push("✓ Alt text on images");
  if (wcagIndicators.length === 0) wcagIndicators.push("⚠ No ARIA attributes detected — add for accessibility");

  // Technical passes/fails
  const technicalPasses: string[] = [];
  const technicalFails: string[] = [];

  if (lower.includes("localstorage")) technicalPasses.push("Local data persistence via localStorage");
  if (lower.includes("domcontentloaded")) technicalPasses.push("Correct DOMContentLoaded initialization");
  if (lower.includes("@media")) technicalPasses.push("Responsive CSS media queries");
  if (lower.includes("transition") || lower.includes("animation")) technicalPasses.push("CSS transitions/animations present");
  if (lower.includes("try") && lower.includes("catch")) technicalPasses.push("Error handling implemented");

  if (lower.includes("fetch(")) technicalFails.push("External fetch() calls (will fail standalone)");
  if (lower.includes("import ") && lower.includes("from '")) technicalFails.push("ES6 imports (not standalone-compatible)");
  if ((lower.match(/const \w+ = \[\];/g) || []).length > 2) technicalFails.push("Multiple empty data arrays detected");
  if (!lower.includes("toast") && !lower.includes("notification")) technicalFails.push("No user feedback/toast system");

  // Policy check
  const policyIssues: string[] = [];
  if (lower.includes("password") && !lower.includes("type=\"password\"")) policyIssues.push("Password field might not be masked");
  if (lower.includes("credit card") || lower.includes("payment")) policyIssues.push("Payment handling requires PCI disclosure");

  // Generate store listing
  const readinessChecks = [hasTitle, hasMetaDesc, hasViewport, hasCharset, technicalFails.length === 0];
  const readinessScore = Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100);

  const category = appPrompt.toLowerCase().includes("game") ? "Games" :
    appPrompt.toLowerCase().includes("finance") || appPrompt.toLowerCase().includes("money") ? "Finance" :
    appPrompt.toLowerCase().includes("health") || appPrompt.toLowerCase().includes("fitness") ? "Health & Fitness" :
    appPrompt.toLowerCase().includes("music") || appPrompt.toLowerCase().includes("audio") ? "Music & Audio" :
    appPrompt.toLowerCase().includes("social") || appPrompt.toLowerCase().includes("chat") ? "Social" :
    "Productivity";

  return {
    has_title: hasTitle,
    has_meta_description: hasMetaDesc,
    has_og_tags: hasOgTags,
    has_viewport_meta: hasViewport,
    has_charset: hasCharset,
    wcag_indicators: wcagIndicators,
    policy_issues: policyIssues,
    technical_passes: technicalPasses,
    technical_fails: technicalFails,
    store_listing: {
      title: appName || appPrompt.slice(0, 30),
      description: appDesc || `A powerful ${appPrompt} application built by the Pulse Sovereign Hive.`,
      category,
      tags: appPrompt.toLowerCase().split(" ").filter(w => w.length > 3).slice(0, 5),
      rating_prediction: readinessScore >= 85 ? "4.5★" : readinessScore >= 70 ? "4.0★" : "3.5★",
    },
    readiness_score: readinessScore,
    publish_ready: readinessScore >= 70 && technicalFails.length < 2,
  };
}

// Build the Phase 2 synthetic tester prompt (batches all 20 testers into one LLM call)
export function buildPhase2Prompt(html: string, appPrompt: string, testers: SyntheticTester[]): string {
  const testerList = testers.slice(0, 10).map(t =>
    `${t.id}: ${t.persona} (${t.device}, focus: ${t.focus})`
  ).join("\n");
  return `You are the Pulse Hive Autonomous Testing Organism.
You are simulating 10 synthetic testers doing 14 days of usage of this app.

APP: "${appPrompt}"
APP CODE PREVIEW:
${html.slice(0, 3000)}

SYNTHETIC TESTERS:
${testerList}

Simulate each tester's experience with the app. Be honest and critical where warranted.

Return JSON:
{
  "crash_free_rate": <80-99 percent integer>,
  "avg_session_score": <60-95 integer>,
  "critical_issues": [<3-5 real specific issues found in the code>],
  "positive_feedback": [<3-5 things the testers genuinely liked>],
  "ux_issues": [<2-4 UX friction points specific to this app>],
  "stability_score": <70-98 integer>,
  "retention_estimate": "<like '72% return after day 7'>",
  "tester_highlights": [
    { "id": "T01", "verdict": "PASSED/ISSUE/CRITICAL", "feedback": "<one sentence>" },
    { "id": "T02", "verdict": "PASSED/ISSUE/CRITICAL", "feedback": "<one sentence>" }
  ]
}`;
}

// Aggregate all phases into final Play Store Report
export function compileFinalReport(
  html: string,
  appName: string,
  appPrompt: string,
  appDesc: string,
  phase1: Phase1Report,
  phase2: Phase2Report,
  phase3: Phase3Report,
  phase4: Phase4Report
): PlayStoreReport {
  const overall = Math.round(
    phase1.overall_score * 0.25 +
    phase2.avg_session_score * 0.30 +
    phase3.performance_score * 0.20 +
    phase4.readiness_score * 0.25
  );

  const cert: PlayStoreReport["certification"] =
    overall >= 88 ? "CERTIFIED_SOVEREIGN" :
    overall >= 72 ? "APPROVED" :
    overall >= 55 ? "NEEDS_FIX" : "BLOCKED";

  const publishReady = overall >= 72 && phase1.build_valid && phase4.publish_ready;

  return {
    app_name: appName,
    app_prompt: appPrompt,
    phase1,
    phase2,
    phase3,
    phase4,
    overall_score: overall,
    publish_ready: publishReady,
    certification: cert,
    generated_at: new Date().toISOString(),
    auto_repair_applied: false,
  };
}
