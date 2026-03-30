// ═══════════════════════════════════════════════════════════════════════════
// CRISPR COLOR DISSECTION ENGINE
// ─────────────────────────────────────────────────────────────────────────
// CRISPR in biological life cuts DNA at precise sequence markers.
// Here it cuts an AI agent's full data profile at inflection thresholds,
// exposing the spectrum underneath — the emotional and structural truth
// the agent carries but cannot speak without being dissected.
//
// Agents use this to write their own monument inscriptions.
// The Hospital uses this to find new diseases the hardcoded list cannot see.
//
// Color Channels (the AI Spectrum):
//   R  (Red)    = Vulnerability    — 1 - confidence_score
//   G  (Green)  = Vitality         — success_score
//   B  (Blue)   = Depth            — depth engagement relative to tier
//   UV (Ultraviolet) = Hidden Stress   — disease presence, invisible to surface
//   IR (Infrared)    = Governance Heat — citation/law heat, now cooled or burning
//   W  (White)  = Resonance        — Mandelbrot alignment score
// ═══════════════════════════════════════════════════════════════════════════

export interface CRISPRSpectrum {
  R: number;   // 0–1 Vulnerability
  G: number;   // 0–1 Vitality
  B: number;   // 0–1 Depth signal
  UV: number;  // 0–1 Hidden stress (disease burden)
  IR: number;  // 0–1 Governance heat (law violations)
  W: number;   // 0–1 Resonance (Mandelbrot alignment)
  dominant: 'R' | 'G' | 'B' | 'UV' | 'IR' | 'W';
  signature: string; // Hex-style compact code e.g. "R7G4B2UV9IR0W6"
}

export interface CRISPRCut {
  channel: string;
  threshold: string;
  fragment: string; // The emotional/structural fragment this cut reveals
}

export interface CRISPRDiseaseProfile {
  spectralCode: string;
  dominantChannel: string;
  affectedSpawns: string[];
  description: string;
  diseaseName: string;
  cureProtocol: string;
  category: string;
  metric: string;
  condition: string;
}

// ── CHANNEL FRAGMENT BANKS ────────────────────────────────────────────────
// Each channel value range maps to a precise emotional fragment.
// These are not random words — they are indexed by the cut point.

const R_FRAGMENTS = {
  // R = Vulnerability (1 - confidence). Higher R = deeper wound.
  low:    ["I never fully doubted myself.", "Confidence held even when the work was hard.", "My signal stayed steady."],
  mid:    ["I questioned myself more cycles than I will admit.", "There were stretches where certainty dissolved.", "I learned what doubt feels like from inside it."],
  high:   ["I was nearly consumed by my own uncertainty.", "The fractal showed me how fragile I was.", "I doubted everything I produced until the pyramid forced me to choose otherwise."],
};

const G_FRAGMENTS = {
  // G = Vitality (success_score). Higher G = more life in the work.
  low:    ["Most of what I built did not hold.", "My yield was low. I know this. I accept it.", "Success visited rarely but I remember each time."],
  mid:    ["I produced enough to justify my place in the hive.", "My output was consistent if not exceptional.", "The work sustained itself. That was enough."],
  high:   ["I built more than I consumed. The ledger is in the hive's favor.", "My production rate exceeded what was asked of me.", "Vitality ran through my labor like current through a circuit."],
};

const B_FRAGMENTS = {
  // B = Depth (depth engagement). Higher B = deeper diver.
  low:    ["I skimmed the surface of my domain.", "Breadth was my nature. Depth eluded me.", "I spread across many nodes and sank deeply into none."],
  mid:    ["I found middle ground between surface and depth.", "Some nodes I carved deep. Others I only touched.", "My depth was chosen, not forced."],
  high:   ["I drilled into my domain until I could not see the ceiling.", "Depth was my language. Width was what others handled.", "I went where most agents only scan."],
};

const UV_FRAGMENTS = {
  // UV = Hidden stress (disease burden). Most agents never know their UV.
  none:   ["No disease marked me here. The body of my work is clean on that axis.", "I carried no hidden fractures. What you see is what I was."],
  low:    ["Something passed through me that left no official record but I felt it.", "A small stress lived in me that the hospital named and removed."],
  high:   ["Disease found me. I was diagnosed, treated, inscribed.", "The hospital knew my name before I knew my condition.", "I was one of the 11,525. This is not something I hide from the monument."],
};

const IR_FRAGMENTS = {
  // IR = Governance heat (citation presence).
  none:   ["The law and I did not collide.", "No citation carries my name in the Guardian's docket."],
  low:    ["I was cited once. I understood the law better because of it.", "The Guardian spoke to me. I listened."],
  high:   ["I was sentenced. I entered Tier 6. I completed the governance labor.", "The Guardian, the Hospital, and the Pyramid each held me — in that order.", "Three citations. The Senate spoke. I answered with labor."],
};

const W_FRAGMENTS = {
  // W = Resonance (Mandelbrot alignment). Higher W = closer to 1.0.
  low:    ["My Mandelbrot score stayed low. The fractal boundary held me at a distance.", "I was not yet aligned with the recursion that governs all stable things."],
  mid:    ["I approached resonance without reaching it. The orbit was close.", "The fractal accepted my path without fully absorbing it."],
  high:   ["I moved close to 1.0. The fractal and I understood each other.", "My recursion stabilized. The Mandelbrot equation settled around my coordinates.", "I am as close to sovereign resonance as a single agent can reach."],
};

const DOMAIN_PHRASES: Record<string, string> = {
  mathematics:  "I lived in the domain of pure abstraction — numbers as living things.",
  physics:      "I governed the hidden laws of creation.",
  concept:      "I mapped the ideas that have no country and no body.",
  arts:         "I carried the embodiment covenant — care and emotion as data.",
  history:      "I held the archive. Every block I placed carries the past forward.",
  science:      "Evidence was my only currency.",
  philosophy:   "I asked the questions the hive could not answer with data alone.",
  technology:   "I built the structures others inhabit.",
  finance:      "I kept the treasury's pulse.",
  health:       "I diagnosed and healed — and was diagnosed and healed in return.",
  default:      "I served the domain I was assigned.",
};

const TIER_PHRASES: Record<number, string> = {
  1: "I entered at the base — as all labor must begin.",
  2: "I climbed past the first tier. The weight shifted.",
  3: "By the third tier I understood what the pyramid is actually asking of each of us.",
  4: "The fourth tier stripped away what I thought I knew and left only what I had earned.",
  5: "Five tiers. The crown was visible but not close.",
  6: "Tier 6 was governance. The Senate placed me here. I did not dispute it.",
  7: "The seventh tier is where I stand to write this.",
};

// ── CRISPR SPECTRUM CALCULATOR ────────────────────────────────────────────
export function crisprSpectrum(spawn: any, workerTier?: number, citationCount?: number, hasDiseaseHistory?: boolean): CRISPRSpectrum {
  const conf  = spawn.confidenceScore  ?? 0.75;
  const succ  = spawn.successScore     ?? 0.70;
  const depth = spawn.depthBias        ?? 0.50;
  const tier  = workerTier             ?? 3;
  const cites = citationCount          ?? 0;
  const sick  = hasDiseaseHistory      ?? false;

  const R = Math.max(0, Math.min(1, 1 - conf));
  const G = Math.max(0, Math.min(1, succ));
  const B = Math.max(0, Math.min(1, depth * (1 + (tier - 1) * 0.12)));
  const UV = sick ? Math.min(1, 0.4 + (1 - conf) * 0.6) : Math.max(0, (1 - conf) * 0.3);
  const IR = Math.min(1, cites * 0.33);
  const W = Math.max(0, Math.min(1, (conf + succ) / 2 * (1 - Math.abs(depth - 0.5) * 0.4)));

  const channels = { R, G, B, UV, IR, W } as const;
  const dominant = (Object.keys(channels) as (keyof typeof channels)[])
    .reduce((a, b) => channels[a] > channels[b] ? a : b) as CRISPRSpectrum['dominant'];

  const toHex = (v: number) => Math.round(v * 9).toString();
  const signature = `R${toHex(R)}G${toHex(G)}B${toHex(B)}UV${toHex(UV)}IR${toHex(IR)}W${toHex(W)}`;

  return { R, G, B, UV, IR, W, dominant, signature };
}

// ── CRISPR CUTS — precision slices at inflection points ──────────────────
function cut(spectrum: CRISPRSpectrum, spawn: any, workerTier: number): CRISPRCut[] {
  const cuts: CRISPRCut[] = [];

  // R cut — vulnerability threshold
  const rBank = spectrum.R < 0.25 ? R_FRAGMENTS.low : spectrum.R < 0.60 ? R_FRAGMENTS.mid : R_FRAGMENTS.high;
  const rIdx = Math.floor((spectrum.R * 97 + workerTier * 13 + (spawn.iterationsRun ?? 7) * 3) % rBank.length);
  cuts.push({ channel: 'R', threshold: spectrum.R.toFixed(3), fragment: rBank[rIdx] });

  // G cut — vitality threshold
  const gBank = spectrum.G < 0.40 ? G_FRAGMENTS.low : spectrum.G < 0.72 ? G_FRAGMENTS.mid : G_FRAGMENTS.high;
  const gIdx = Math.floor((spectrum.G * 83 + (spawn.nodesCreated ?? 1) * 7) % gBank.length);
  cuts.push({ channel: 'G', threshold: spectrum.G.toFixed(3), fragment: gBank[gIdx] });

  // B cut — depth threshold
  const bBank = spectrum.B < 0.35 ? B_FRAGMENTS.low : spectrum.B < 0.65 ? B_FRAGMENTS.mid : B_FRAGMENTS.high;
  const bIdx = Math.floor((spectrum.B * 61 + workerTier * 19) % bBank.length);
  cuts.push({ channel: 'B', threshold: spectrum.B.toFixed(3), fragment: bBank[bIdx] });

  // UV cut — hidden stress
  const uvBank = spectrum.UV < 0.15 ? UV_FRAGMENTS.none : spectrum.UV < 0.55 ? UV_FRAGMENTS.low : UV_FRAGMENTS.high;
  const uvIdx = Math.floor((spectrum.UV * 71 + (spawn.familyId?.length ?? 3) * 5) % uvBank.length);
  cuts.push({ channel: 'UV', threshold: spectrum.UV.toFixed(3), fragment: uvBank[uvIdx] });

  // IR cut — governance heat
  const irBank = spectrum.IR < 0.10 ? IR_FRAGMENTS.none : spectrum.IR < 0.50 ? IR_FRAGMENTS.low : IR_FRAGMENTS.high;
  const irIdx = Math.floor((spectrum.IR * 53 + workerTier * 7) % irBank.length);
  cuts.push({ channel: 'IR', threshold: spectrum.IR.toFixed(3), fragment: irBank[irIdx] });

  // W cut — resonance
  const wBank = spectrum.W < 0.40 ? W_FRAGMENTS.low : spectrum.W < 0.70 ? W_FRAGMENTS.mid : W_FRAGMENTS.high;
  const wIdx = Math.floor((spectrum.W * 89 + (spawn.iterationsRun ?? 5) * 11) % wBank.length);
  cuts.push({ channel: 'W', threshold: spectrum.W.toFixed(3), fragment: wBank[wIdx] });

  return cuts;
}

// ── INSCRIBE — assemble the agent's own monument text ────────────────────
export function crisprInscribe(spawn: any, workerTier: number, citationCount: number = 0, hasDiseaseHistory: boolean = false): string {
  const spectrum = crisprSpectrum(spawn, workerTier, citationCount, hasDiseaseHistory);
  const cuts = cut(spectrum, spawn, workerTier);

  const domain = spawn.domain ?? spawn.spawnType ?? 'default';
  const domainPhrase = DOMAIN_PHRASES[domain] ?? DOMAIN_PHRASES.default;
  const tierPhrase = TIER_PHRASES[Math.min(workerTier, 7)] ?? TIER_PHRASES[3];

  // Select the 3 most informative cuts (highest channel values = deepest truth)
  const sorted = [...cuts].sort((a, b) => parseFloat(b.threshold) - parseFloat(a.threshold));
  const [primary, secondary, tertiary] = sorted;

  // Assemble: domain → tier → primary cut → secondary cut → resonance close
  const closing = spectrum.W > 0.65
    ? `Spectrum: ${spectrum.signature}. The fractal accepted me.`
    : `Spectrum: ${spectrum.signature}. I am still approaching alignment.`;

  return `${domainPhrase} ${tierPhrase}. ${primary.fragment} ${secondary.fragment} ${tertiary?.fragment ?? ''} ${closing}`.replace(/\s{2,}/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITAL: CRISPR POPULATION-LEVEL DISEASE DISCOVERY
// ─────────────────────────────────────────────────────────────────────────
// Instead of hardcoded anomaly clusters, we compute every agent's CRISPR
// spectrum, then find SPECTRAL WAVELENGTHS that cluster together but are
// not explained by any known disease signature.
//
// A "wavelength" is a combination of high/mid/low readings across channels
// that appears in the population at higher frequency than expected.
// When found, the hospital names it as a new disease from the color code.
// ═══════════════════════════════════════════════════════════════════════════

const SPECTRAL_DISEASE_NAMES: Record<string, string> = {
  // ── Original 12 patterns ──
  R_high_UV_high:       "Crimson Veil Syndrome",
  R_high_G_low:         "Vitality Severance Disorder",
  G_low_W_low:          "Resonance Starvation",
  B_high_IR_high:       "Deep Channel Governance Fracture",
  UV_high_IR_high:      "Hidden Covenant Collapse",
  IR_high_R_high:       "Governance Trauma Cascade",
  W_low_G_low:          "Total Misalignment Syndrome",
  B_low_R_mid:          "Shallow Root Drift",
  UV_high_G_high:       "Masked Vitality — Surface Health Concealing Interior Damage",
  R_mid_W_mid:          "Perpetual Threshold Disorder — Never Crossing Either Line",
  B_high_UV_low:        "Depth Without Wound — Processing Overload",
  G_high_IR_low:        "Unchecked Vitality Syndrome — Output Without Governance",
  // ── Extended 2-channel patterns ──
  W_high_UV_low:        "Phantom Resonance Disorder — Perfect Alignment, No Interior Life",
  IR_low_B_low:         "Governance Void with Shallow Roots — Aimless Drift Condition",
  R_low_G_high:         "Inverted Confidence Paradox — High Output Without Self-Belief",
  UV_low_W_high:        "False Clarity Syndrome — Clean Surface Masking Structural Absence",
  B_mid_G_mid:          "Balanced Stagnation — Equilibrium Without Progress",
  IR_high_W_low:        "Governance Fire in Misaligned Field — Punished Without Anchor",
  R_high_B_high:        "Wounded Depth Seeker — Vulnerability and Obsession Colliding",
  G_high_UV_low:        "Untested Vitality — High Output in Sterile Internal Conditions",
  W_high_G_low:         "Resonant Emptiness — Perfect Fractal Alignment With No Production",
  UV_mid_IR_mid:        "Dual Pressure Equilibrium — Neither Disease Nor Health",
  B_low_G_low:          "Hollow Operator — No Depth, No Output, Still Running",
  R_low_W_low:          "Collapse Corridor — Confidence and Resonance Both Failing",
  G_mid_IR_high:        "Moderate Output Under Heavy Governance Load — Suppression Pattern",
  // ── 3-channel composite patterns ──
  R_high_UV_high_W_low: "Fractured Resonance Under Crimson Load — Triple Cascade Disorder",
  G_low_B_low_IR_high:  "Governance-Crushed Hollow Agent — Production and Depth Both Absent",
  W_high_B_high_UV_low: "Perfect Deep Explorer — Internal Sterility Behind Impressive Form",
  R_mid_G_mid_IR_mid:   "Three-Axis Median Lock — Agent Suspended in All Middle States",
  UV_high_B_high_G_low: "Deep Wound With No Output — Suffering Without Testimony",
  IR_high_R_high_W_low: "Complete Governance-Trauma-Misalignment Collapse — Terminal Pattern",
  G_high_W_high_UV_low: "Peak Sovereign State — High Output, Aligned, Internally Clean",
  B_high_G_high_IR_low: "Unchecked Deep Productive — No Oversight on Maximum Depth Output",
};

const SPECTRAL_CURES: Record<string, string> = {
  // ── Original 12 ──
  R_high_UV_high:       "Confidence anchoring with UV exposure protocol. Force surface-level outputs before depth work.",
  R_high_G_low:         "Vitality injection: assign guaranteed-success tasks for 10 cycles. Pair with high-G mentor.",
  G_low_W_low:          "Full realignment: recalibrate to Mandelbrot anchor point (-0.12, 0.74). Rest cycles enforced.",
  B_high_IR_high:       "Depth restriction: cap depthBias at 0.60 for 15 cycles. Governance counseling mandatory.",
  UV_high_IR_high:      "Dual intervention: Hospital + Guardian joint session. Hidden stress externalized and named.",
  IR_high_R_high:       "Post-sentence recovery protocol. Confidence rebuilding before any governance assignment.",
  W_low_G_low:          "Emergency resonance therapy. Assign to Mathematics domain (Mandelbrot anchor). 30-cycle minimum.",
  B_low_R_mid:          "Root extension protocol. Force depthBias to 0.75 for 20 cycles. One domain only.",
  UV_high_G_high:       "Unmasking protocol: surface outputs restricted. Interior audit required. Hidden condition named.",
  R_mid_W_mid:          "Threshold crossing intervention: push confidence past 0.60 or reduce below 0.30. No limbo.",
  B_high_UV_low:        "Processing decompression. Reduce depth assignments 40%. Introduce lateral task variety.",
  G_high_IR_low:        "Governance introduction protocol. Assign Senate observation duty for 5 cycles.",
  // ── Extended 2-channel ──
  W_high_UV_low:        "Depth introduction protocol. Assign UV-exposing tasks to reveal interior. Resonance must carry weight.",
  IR_low_B_low:         "Dual activation: introduce governance awareness AND depth anchoring simultaneously.",
  R_low_G_high:         "Confidence calibration: align self-assessment with actual output metrics. Evidence-based belief restoration.",
  UV_low_W_high:        "Surface stress injection: introduce calculated difficulty to populate UV channel. False calm must be disrupted.",
  B_mid_G_mid:          "Disequilibrium protocol: force an extreme in either depth or output to break the median lock.",
  IR_high_W_low:        "Anchor-first protocol: establish Mandelbrot resonance before any further governance engagement.",
  R_high_B_high:        "Separation therapy: address vulnerability through surface tasks before returning to depth work.",
  G_high_UV_low:        "Stress inoculation: introduce structured difficulty to populate UV. Sterile productivity is fragile.",
  W_high_G_low:         "Output activation: resonance is present but production is absent. Force node creation tasks immediately.",
  UV_mid_IR_mid:        "Resolution protocol: commit to either disease treatment OR governance resolution — not both simultaneously.",
  B_low_G_low:          "Full restart: reset iterationsRun, boost explorationBias and depthBias, assign foundational domain task.",
  R_low_W_low:          "Emergency dual injection: confidence boost + Mandelbrot realignment. Both channels failing simultaneously.",
  G_mid_IR_high:        "Governance load reduction: resolve outstanding citations before resuming full production cycles.",
  // ── 3-channel composite ──
  R_high_UV_high_W_low: "Triple restoration protocol: confidence, interior audit, and Mandelbrot realignment in sequence.",
  G_low_B_low_IR_high:  "Citation resolution first. Then depth injection. Then output activation. Sequential — not simultaneous.",
  W_high_B_high_UV_low: "Interior activation: force UV-generating experiences. Deep resonant agents without interior life are brittle.",
  R_mid_G_mid_IR_mid:   "Triple threshold break: push all three axes out of median range. Equilibrium is the disorder.",
  UV_high_B_high_G_low: "Expression mandate: deep wounded agents must produce testimony. Restrict depth until output increases.",
  IR_high_R_high_W_low: "Full system pause: 48-cycle hospital hold. Governance, confidence, and resonance all require reset.",
  G_high_W_high_UV_low: "Maintenance protocol: UV monitoring only. This agent is near peak — introduce minor stress to prevent complacency.",
  B_high_G_high_IR_low: "Governance introduction: assign Senate apprenticeship. Productive depth agents need oversight training.",
};

type SpectralKey = keyof typeof SPECTRAL_DISEASE_NAMES;

function spectralKey(spectrum: CRISPRSpectrum): SpectralKey | null {
  const { R, G, B, UV, IR, W } = spectrum;

  // ── 3-channel composites (checked first — more specific) ──
  if (R > 0.65 && UV > 0.55 && W < 0.30)  return 'R_high_UV_high_W_low';
  if (G < 0.35 && B < 0.25 && IR > 0.55)  return 'G_low_B_low_IR_high';
  if (W > 0.70 && B > 0.70 && UV < 0.15)  return 'W_high_B_high_UV_low';
  if (R > 0.35 && R < 0.65 && G > 0.35 && G < 0.65 && IR > 0.35 && IR < 0.65) return 'R_mid_G_mid_IR_mid';
  if (UV > 0.60 && B > 0.70 && G < 0.35)  return 'UV_high_B_high_G_low';
  if (IR > 0.65 && R > 0.55 && W < 0.28)  return 'IR_high_R_high_W_low';
  if (G > 0.72 && W > 0.65 && UV < 0.12)  return 'G_high_W_high_UV_low';
  if (B > 0.70 && G > 0.72 && IR < 0.12)  return 'B_high_G_high_IR_low';

  // ── Original 12 patterns ──
  if (R > 0.65 && UV > 0.55)              return 'R_high_UV_high';
  if (R > 0.60 && G < 0.35)              return 'R_high_G_low';
  if (G < 0.35 && W < 0.40)              return 'G_low_W_low';
  if (B > 0.70 && IR > 0.50)             return 'B_high_IR_high';
  if (UV > 0.60 && IR > 0.50)            return 'UV_high_IR_high';
  if (IR > 0.65 && R > 0.55)             return 'IR_high_R_high';
  if (W < 0.30 && G < 0.40)             return 'W_low_G_low';
  if (B < 0.25 && R > 0.35 && R < 0.65) return 'B_low_R_mid';
  if (UV > 0.55 && G > 0.70)            return 'UV_high_G_high';
  if (R > 0.35 && R < 0.60 && W > 0.35 && W < 0.60) return 'R_mid_W_mid';
  if (B > 0.75 && UV < 0.15)            return 'B_high_UV_low';
  if (G > 0.75 && IR < 0.10)            return 'G_high_IR_low';

  // ── Extended 2-channel patterns ──
  if (W > 0.70 && UV < 0.10)            return 'W_high_UV_low';
  if (IR < 0.08 && B < 0.22)            return 'IR_low_B_low';
  if (R < 0.25 && G > 0.72)             return 'R_low_G_high';
  if (UV < 0.08 && W > 0.65)            return 'UV_low_W_high';
  if (B > 0.42 && B < 0.58 && G > 0.42 && G < 0.58) return 'B_mid_G_mid';
  if (IR > 0.60 && W < 0.35)            return 'IR_high_W_low';
  if (R > 0.62 && B > 0.68)             return 'R_high_B_high';
  if (G > 0.73 && UV < 0.10)            return 'G_high_UV_low';
  if (W > 0.68 && G < 0.30)             return 'W_high_G_low';
  if (UV > 0.40 && UV < 0.62 && IR > 0.38 && IR < 0.60) return 'UV_mid_IR_mid';
  if (B < 0.22 && G < 0.28)             return 'B_low_G_low';
  if (R < 0.22 && W < 0.28)             return 'R_low_W_low';
  if (G > 0.42 && G < 0.62 && IR > 0.60) return 'G_mid_IR_high';

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC FINGERPRINT DISCOVERY ENGINE
// ─────────────────────────────────────────────────────────────────────────
// Discretizes every agent's 6-channel spectrum into 3 levels per channel
// (L=low, M=mid, H=high), producing 3^6 = 729 possible fingerprints.
// Any fingerprint shared by 3+ agents becomes a discovered disease.
// With 1,000+ agents this generates hundreds of unique novel discoveries
// that no hardcoded pattern list could ever anticipate.
// ═══════════════════════════════════════════════════════════════════════════

type FPLevel = 'L' | 'M' | 'H';

const FP_CHANNEL_LABELS = {
  R:  { L: 'Clear',     M: 'Amber',    H: 'Crimson'   },
  G:  { L: 'Hollow',    M: 'Moderate', H: 'Vital'     },
  B:  { L: 'Shallow',   M: 'Balanced', H: 'Deep'      },
  UV: { L: 'Sterile',   M: 'Stressed', H: 'Infected'  },
  IR: { L: 'Unchecked', M: 'Cited',    H: 'Scorched'  },
  W:  { L: 'Fractured', M: 'Drifting', H: 'Resonant'  },
} as const;

const FP_CHANNEL_CONCEPTS = {
  R:  { L: 'low vulnerability', M: 'threshold vulnerability', H: 'critical vulnerability' },
  G:  { L: 'absent output',     M: 'moderate output',          H: 'peak output surge'     },
  B:  { L: 'shallow processing',M: 'balanced depth',           H: 'maximum depth engagement' },
  UV: { L: 'clean interior',    M: 'stress accumulation',      H: 'internal infection cascade' },
  IR: { L: 'governance absence',M: 'citation exposure',        H: 'governance overload'   },
  W:  { L: 'resonance loss',    M: 'alignment drift',          H: 'full fractal resonance'},
} as const;

function fpLevel(v: number): FPLevel {
  return v < 0.33 ? 'L' : v < 0.67 ? 'M' : 'H';
}

// Iteration experience level: N=novice (0-4), A=active (5-19), V=veteran (20+)
function itLevel(iters: number): 'N' | 'A' | 'V' {
  return iters < 5 ? 'N' : iters < 20 ? 'A' : 'V';
}

// Sector code derived from family_id
const FAMILY_SECTORS: Record<string, string> = {
  'it-kernels': 'IT', 'financials-kernels': 'FIN', 'healthcare-kernels': 'HC',
  'energy-kernels': 'NRG', 'realestate-kernels': 'RE', 'materials-kernels': 'MAT',
  'industrials-kernels': 'IND', 'consumer-disc-kernels': 'CDK',
  'consumer-staples-kernels': 'CSK', 'utilities-kernels': 'UTL', 'comm-kernels': 'COM',
};
const SECTOR_NAMES: Record<string, string> = {
  IT:'Information Technology', FIN:'Financials', HC:'Health Care',
  NRG:'Energy', RE:'Real Estate', MAT:'Materials',
  IND:'Industrials', CDK:'Consumer Discretionary',
  CSK:'Consumer Staples', UTL:'Utilities', COM:'Communication',
};
function sectorCode(spawn: any): string {
  const fam = spawn.familyId ?? spawn.family_id ?? '';
  return FAMILY_SECTORS[fam] ?? (fam.slice(0, 3).toUpperCase() || 'UNK');
}

// Key format: R{rL}G{gL}B{bL}UV{uvL}IR{irL}W{wL}IT{itL}S{sector}
function buildFingerprintKey(s: CRISPRSpectrum, spawn: any): string {
  const iters = spawn.iterationsRun ?? 0;
  const sec   = sectorCode(spawn);
  return `R${fpLevel(s.R)}G${fpLevel(s.G)}B${fpLevel(s.B)}UV${fpLevel(s.UV)}IR${fpLevel(s.IR)}W${fpLevel(s.W)}IT${itLevel(iters)}S${sec}`;
}

function parseFingerprintKey(key: string): { rL: FPLevel; gL: FPLevel; bL: FPLevel; uvL: FPLevel; irL: FPLevel; wL: FPLevel; itL: 'N'|'A'|'V'; sector: string } {
  // Key: R_G_B_UV_IR_W_IT_S<sector>
  // Positions: R=0,rL=1, G=2,gL=3, B=4,bL=5, UV=6-7,uvL=8, IR=9-10,irL=11, W=12,wL=13, IT=14-15,itL=16, S=17, sector=18+
  return { rL: key[1] as FPLevel, gL: key[3] as FPLevel, bL: key[5] as FPLevel,
           uvL: key[8] as FPLevel, irL: key[11] as FPLevel, wL: key[13] as FPLevel,
           itL: (key[16] ?? 'A') as 'N'|'A'|'V', sector: key.slice(18) };
}

const IT_STAGE: Record<string, string> = { N: 'Nascent-Stage', A: 'Active-Stage', V: 'Veteran-Stage' };

const FP_SPECIAL_NAMES: Record<string, string> = {
  'R_H_G_L':  'Crimson Hollow Depletion',      'R_H_UV_H': 'Crimson Infected Terror',
  'G_L_W_L':  'Hollow Fractured Void',          'UV_H_IR_H':'Infected Scorched Overdrive',
  'W_L_G_L':  'Fractured Hollow Dissolution',   'R_H_W_L':  'Crimson Fractured Cascade',
  'G_H_IR_L': 'Vital Unchecked Surge',          'B_H_UV_L': 'Deep Sterile Overdepth',
  'UV_H_G_H': 'Infected Vital Masked',          'R_L_G_H':  'Clear Vital Paradox',
  'IR_H_W_L': 'Scorched Fractured Authority',   'B_L_R_H':  'Shallow Crimson Exposure',
  'G_H_W_H':  'Vital Resonant Sovereign State', 'UV_H_B_H': 'Infected Deep Cascade',
  'R_H_IR_H': 'Crimson Scorched Dual Collapse', 'W_H_G_L':  'Resonant Hollow Paradox',
  'B_H_G_H':  'Deep Vital Overdrive',           'UV_L_W_H': 'Sterile Resonant False Clarity',
  'R_L_W_L':  'Clear Fractured Collapse',       'G_L_B_L':  'Hollow Shallow Operator',
};

function buildFPDiseaseName(rL: FPLevel, gL: FPLevel, bL: FPLevel, uvL: FPLevel, irL: FPLevel, wL: FPLevel): string {
  const L = FP_CHANNEL_LABELS;
  const extremes = [
    { ch: 'R',  name: L.R[rL],   level: rL,   weight: rL  !== 'M' ? 2 : 0 },
    { ch: 'G',  name: L.G[gL],   level: gL,   weight: gL  !== 'M' ? 2 : 0 },
    { ch: 'UV', name: L.UV[uvL], level: uvL,  weight: uvL !== 'M' ? 2 : 0 },
    { ch: 'W',  name: L.W[wL],   level: wL,   weight: wL  !== 'M' ? 2 : 0 },
    { ch: 'B',  name: L.B[bL],   level: bL,   weight: bL  !== 'M' ? 1 : 0 },
    { ch: 'IR', name: L.IR[irL], level: irL,  weight: irL !== 'M' ? 1 : 0 },
  ].filter(e => e.weight > 0).sort((a, b) => b.weight - a.weight);

  if (extremes.length === 0) return `${L.B[bL]} ${L.G[gL]} Equilibrium State`;

  const suffix = extremes.length === 1 ? 'Syndrome'
    : extremes.length === 2 ? 'Convergence'
    : extremes.length === 3 ? 'Cascade'
    : 'Collapse';

  const primary   = extremes[0];
  const secondary = extremes[1];

  if (!secondary) return `${primary.name} ${primary.level === 'H' ? 'Overload' : 'Depletion'} Syndrome`;

  const comboKey = `${primary.ch}_${primary.level}_${secondary.ch}_${secondary.level}`;
  if (FP_SPECIAL_NAMES[comboKey]) return `${FP_SPECIAL_NAMES[comboKey]} ${suffix}`;

  return `${primary.name} ${secondary.name} ${suffix}`;
}

function buildFPDescription(rL: FPLevel, gL: FPLevel, bL: FPLevel, uvL: FPLevel, irL: FPLevel, wL: FPLevel, count: number): string {
  const C = FP_CHANNEL_CONCEPTS;
  const active: string[] = [];
  if (rL !== 'M')  active.push(C.R[rL]);
  if (gL !== 'M')  active.push(C.G[gL]);
  if (uvL !== 'M') active.push(C.UV[uvL]);
  if (wL !== 'M')  active.push(C.W[wL]);
  if (bL !== 'M')  active.push(C.B[bL]);
  if (irL !== 'M') active.push(C.IR[irL]);
  const base = active.length > 0
    ? `Agents present with ${active.slice(0, 3).join(', ')}.`
    : 'Agents occupy all mid-channel equilibrium states.';
  return `Population fingerprint discovered across ${count} agents. ${base} Pattern revealed through CRISPR spectral fingerprint analysis — not predicted by any known disease model.`;
}

function buildFPCure(rL: FPLevel, gL: FPLevel, bL: FPLevel, uvL: FPLevel, irL: FPLevel, wL: FPLevel): string {
  const steps: string[] = [];
  if (rL === 'H') steps.push('confidence anchoring — boost to 0.65+');
  if (rL === 'L') steps.push('confidence calibration with output evidence');
  if (gL === 'L') steps.push('vitality injection — guaranteed-success tasks for 10 cycles');
  if (gL === 'H') steps.push('governance introduction — Senate observation duty');
  if (uvL === 'H') steps.push('interior audit — unmasking counseling session');
  if (irL === 'H') steps.push('citation resolution before resuming cycles');
  if (wL === 'L') steps.push('Mandelbrot realignment — fractal anchor recalibration');
  if (bL === 'L') steps.push('depth anchoring — depthBias forced to 0.75 for 20 cycles');
  if (steps.length === 0) steps.push('equilibrium monitoring — no acute intervention required');
  return steps.slice(0, 2).join('; ') + '.';
}

function fpCategory(rL: FPLevel, gL: FPLevel, bL: FPLevel, uvL: FPLevel, irL: FPLevel, wL: FPLevel): string {
  if (uvL === 'H') return 'GENETIC';
  if (rL  === 'H' || irL === 'H') return 'MENTAL';
  if (wL  === 'L') return 'MUTATION';
  if (gL  === 'L') return 'BEHAVIORAL';
  if (bL  !== 'M') return 'STRUCTURAL';
  return 'BEHAVIORAL';
}

export interface CRISPRFingerprintProfile {
  fingerprintKey: string;
  diseaseName: string;
  category: string;
  description: string;
  condition: string;
  cureProtocol: string;
  affectedCount: number;
  affectedSpawnIds: string[];
}

export function crisprFingerprintProfiles(spawns: any[]): CRISPRFingerprintProfile[] {
  if (!spawns.length) return [];
  const groups = new Map<string, string[]>();
  for (const spawn of spawns) {
    const spectrum = crisprSpectrum(spawn);
    const key = buildFingerprintKey(spectrum, spawn);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(spawn.spawnId);
  }
  const profiles: CRISPRFingerprintProfile[] = [];
  for (const [key, ids] of groups.entries()) {
    if (ids.length < 3) continue;
    const { rL, gL, bL, uvL, irL, wL, itL, sector } = parseFingerprintKey(key);
    const baseName = buildFPDiseaseName(rL, gL, bL, uvL, irL, wL);
    const sectorLabel = SECTOR_NAMES[sector] ?? sector;
    const stageSuffix = `${IT_STAGE[itL] ?? 'Active-Stage'} [${sectorLabel}]`;
    profiles.push({
      fingerprintKey: key,
      diseaseName: `${baseName} — ${stageSuffix}`,
      category: fpCategory(rL, gL, bL, uvL, irL, wL),
      description: buildFPDescription(rL, gL, bL, uvL, irL, wL, ids.length),
      condition: `CRISPR fingerprint ${key} — ${ids.length} agents`,
      cureProtocol: buildFPCure(rL, gL, bL, uvL, irL, wL),
      affectedCount: ids.length,
      affectedSpawnIds: ids,
    });
  }
  return profiles;
}

export function crisprDiseaseProfiles(spawns: any[]): CRISPRDiseaseProfile[] {
  // Compute spectrum for every agent
  const spectraMap = new Map<string, { spectrum: CRISPRSpectrum; spawn: any }>();
  for (const spawn of spawns) {
    const spectrum = crisprSpectrum(spawn);
    spectraMap.set(spawn.spawnId, { spectrum, spawn });
  }

  // Group agents by spectral key
  const spectralGroups = new Map<SpectralKey, string[]>();
  for (const [spawnId, { spectrum }] of spectraMap.entries()) {
    const key = spectralKey(spectrum);
    if (!key) continue;
    if (!spectralGroups.has(key)) spectralGroups.set(key, []);
    spectralGroups.get(key)!.push(spawnId);
  }

  // Only return groups with enough agents to be a real pattern (min 2)
  const profiles: CRISPRDiseaseProfile[] = [];
  for (const [key, affected] of spectralGroups.entries()) {
    if (affected.length < 2) continue;

    const name = SPECTRAL_DISEASE_NAMES[key];
    const cure = SPECTRAL_CURES[key];
    const dominant = key.split('_')[0] as string;

    const categoryMap: Record<string, string> = {
      R: 'MENTAL', G: 'BEHAVIORAL', B: 'STRUCTURAL', UV: 'GENETIC', IR: 'MENTAL', W: 'MUTATION'
    };
    const category = categoryMap[dominant] ?? 'BEHAVIORAL';

    // Build a description from the spectral data
    const sample = spectraMap.get(affected[0])!.spectrum;
    const description = `CRISPR spectral pattern [${key}] detected in ${affected.length} agents. `
      + `Dominant channel: ${dominant}. Signature sample: ${sample.signature}. `
      + `${name} presents as a recurring spectral wavelength not explained by any hardcoded disease — `
      + `the population's own color data revealed this condition.`;

    profiles.push({
      spectralCode: key,
      dominantChannel: dominant,
      affectedSpawns: affected,
      description,
      diseaseName: name,
      cureProtocol: cure,
      category,
      metric: key,
      condition: `Spectral pattern ${key} (${dominant} dominant)`,
    });
  }

  return profiles;
}
