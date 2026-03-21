import { pool } from "./db";

const CHANNELS = ["R", "G", "B", "UV", "IR", "W"] as const;
type Channel = typeof CHANNELS[number];

const CHANNEL_NAMES: Record<Channel, string> = {
  R: "Vulnerability",
  G: "Vitality",
  B: "Depth",
  UV: "Hidden Stress",
  IR: "Governance Heat",
  W: "Resonance",
};

const CHANNEL_COLORS: Record<Channel, string> = {
  R: "#ff4444",
  G: "#00ff9d",
  B: "#4488ff",
  UV: "#cc44ff",
  IR: "#ff8800",
  W: "#ffffff",
};

type ChannelMap = Partial<Record<Channel, number>>;

function parseChannels(equation: string): ChannelMap {
  const result: ChannelMap = {};
  for (const ch of CHANNELS) {
    const match = equation.match(new RegExp(`${ch}\\[([\\d.]+)\\]`));
    if (match) result[ch] = parseFloat(match[1]);
  }
  return result;
}

function randDelta(range = 0.35): number {
  return parseFloat((Math.random() * 2 * range - range).toFixed(2));
}

function randCoupling(): string {
  return (0.65 + Math.random() * 0.7).toFixed(2);
}

function generateUnknownSymbol(doctorId: string, suffix: string): string {
  return `ε_${doctorId.replace("-", "_")}_${suffix}`;
}

// ── FUSE ────────────────────────────────────────────────────────────────────
export function fuseEquations(
  eq1: string,
  eq2: string,
  doctorId: string
): {
  equation: string;
  method: string;
  unknowns: string[];
  newCourses: string[];
} {
  const ch1 = parseChannels(eq1);
  const ch2 = parseChannels(eq2);
  const k1 = randCoupling();
  const k2 = randCoupling();
  const eps = generateUnknownSymbol(doctorId, "cross_fusion");

  const e1Name = Object.entries(ch1).length > 0
    ? `(${Object.entries(ch1).map(([c, v]) => `${c}[${v}]`).join(" × ")} × κ${k1})`
    : `(${eq1.slice(0, 30)}... × κ${k1})`;

  const e2Name = Object.entries(ch2).length > 0
    ? `(${Object.entries(ch2).map(([c, v]) => `${c}[${v}]`).join(" × ")} × κ${k2})`
    : `(${eq2.slice(0, 30)}... × κ${k2})`;

  const equation = `Ω_fused = ${e1Name} ⊕ ${e2Name} + ${eps}`;

  const sharedChannels = CHANNELS.filter(c => ch1[c] !== undefined && ch2[c] !== undefined);
  const unknowns = [
    `${eps} — hidden cross-equation interaction resonance (emerges from ⊕ coupling at κ${k1}×κ${k2})`,
    `∂Ω/∂κ — sensitivity of fusion architecture to coupling constant drift`,
  ];
  if (sharedChannels.length > 0) {
    unknowns.push(
      `σ_shared_${sharedChannels.join("_")} — interference term from shared channel collision (${sharedChannels.join(", ")})`
    );
  }

  const newCourses = [
    `Cross-Spectral Fusion Mechanics — Level ${Math.floor(Math.random() * 3) + 4}`,
    `⊕ Operator Coupling Theory — Advanced Equation Research`,
    `Hidden Term Discovery via Spectral Injection — Applied Dissection`,
  ];

  return { equation, method: `κ-coupling ⊕ operator fusion (κ${k1} + κ${k2})`, unknowns, newCourses };
}

// ── MUTATE ──────────────────────────────────────────────────────────────────
export function mutateEquation(
  equation: string,
  channel: string,
  doctorId: string
): {
  equation: string;
  mutations: string[];
  unknowns: string[];
} {
  const ch = parseChannels(equation);
  const delta = randDelta();
  const oldVal = ch[channel as Channel] ?? 5.0;
  const newVal = Math.max(0.1, oldVal + delta).toFixed(1);
  const partial = `∂ε/∂${channel}_${doctorId.replace("-", "_")}`;

  let mutated = equation;
  const chRegex = new RegExp(`${channel}\\[[\\d.]+\\]`);
  if (chRegex.test(mutated)) {
    mutated = mutated.replace(chRegex, `${channel}[${newVal}]`);
  } else {
    mutated = `${mutated} + ${channel}[${newVal}]`;
  }
  mutated = `${mutated} + ${partial}`;

  const channelName = CHANNEL_NAMES[channel as Channel] ?? channel;

  return {
    equation: mutated,
    mutations: [
      `${channel}[${oldVal}] → ${channel}[${newVal}] (δ=${delta >= 0 ? "+" : ""}${delta})`,
      `Discovered partial: ${partial} — ${channelName} spectral derivative under quantum drift`,
    ],
    unknowns: [
      `${partial} — ${channelName} drift sensitivity, magnitude unknown until integration`,
      `σ_${channel}_stability — variance of ${channelName} under repeated spectral mutation pressure`,
      `ψ_${channel}_resonance — oscillation frequency of mutated ${channelName} field`,
    ],
  };
}

// ── DISSECT ─────────────────────────────────────────────────────────────────
export function dissectEquation(
  equation: string,
  doctorId: string
): {
  components: string[];
  unknowns: string[];
  hiddenVariables: string[];
  newDiscoveries: string[];
} {
  const ch = parseChannels(equation);
  const entries = Object.entries(ch);

  const components: string[] = entries.map(
    ([c, v]) =>
      `${c}[${v}] — ${CHANNEL_NAMES[c as Channel] ?? c} carrier (magnitude: ${v}, color: ${CHANNEL_COLORS[c as Channel] ?? "#fff"})`
  );

  if (components.length === 0) {
    components.push("Symbolic core — non-channel structure encoding abstract relationship");
    components.push("Temporal variance term — implicit dynamic not yet decomposed");
    components.push("Boundary operator — enforces stability constraints at equation edges");
  } else {
    components.push(`Interaction kernel — binds ${entries.map(([c]) => c).join(" and ")} into unified field`);
    components.push(`Normalization factor — ensures dimensional consistency across spectral terms`);
  }

  const unknowns = [
    `φ_resonance_${doctorId.replace("-", "_")} — non-linear cross-channel coupling (not yet quantified)`,
    `σ_decay — entropy accumulation under repeated dissection operations`,
    `ψ_latent — latent spectral pressure invisible in surface equation form`,
    `τ_convergence — time constant governing equation stability approach`,
  ];

  const hiddenVariables = [
    `χ_cross — cross-channel correlation matrix (${entries.length > 1 ? `${entries.map(([c]) => c).join("×")} interference` : "isolated channel self-interference"})`,
    `ω_pulse_${entries[0]?.[0] ?? "R"} — oscillation frequency of dominant channel`,
    `Δ_boundary — gap between current equation and theoretical maximum expression`,
    `ξ_unknown — unknown factor driving non-linear behavior at extremes`,
  ];

  const newDiscoveries: string[] = [];
  if (entries.length >= 2) {
    newDiscoveries.push(
      `DISCOVERY: ${entries[0][0]} × ${entries[1][0]} interaction produces φ_resonance field — new integration type found`
    );
    newDiscoveries.push(
      `NEW INTEGRAL TYPE: ∮ (${entries.map(([c, v]) => `${c}[${v}]`).join(" × ")}) dΩ — closed-loop spectral integral discovered`
    );
  } else {
    newDiscoveries.push(
      `DISCOVERY: Isolated ${entries[0]?.[0] ?? "symbolic"} channel exhibits self-referential feedback — φ_self_loop detected`
    );
    newDiscoveries.push(
      `NEW LOGIC TYPE: Single-channel dissection reveals ∂²/∂t² higher-order term not previously modeled`
    );
  }
  newDiscoveries.push(
    `UNKNOWN CLASS FOUND: ε_${doctorId.replace("-", "_")}_dissection — this doctor's spectral fingerprint now embedded in equation`
  );

  return { components, unknowns, hiddenVariables, newDiscoveries };
}

// ── EVOLVE ──────────────────────────────────────────────────────────────────
export function evolveEquation(
  equation: string,
  generations: number,
  doctorId: string
): {
  lineage: Array<{ gen: number; equation: string; mutation: string; discovery: string }>;
  finalEquation: string;
  totalDiscoveries: string[];
} {
  const lineage: Array<{ gen: number; equation: string; mutation: string; discovery: string }> = [];
  let current = equation;
  const totalDiscoveries: string[] = [];
  const maxGen = Math.min(generations, 5);

  lineage.push({
    gen: 0,
    equation: current,
    mutation: "ORIGIN — base equation enters evolution chamber",
    discovery: `Origin spectral signature locked: ${doctorId}`,
  });

  for (let g = 1; g <= maxGen; g++) {
    const ch = parseChannels(current);
    const channels = Object.keys(ch) as Channel[];

    if (channels.length > 0) {
      const targetChannel = channels[Math.floor(Math.random() * channels.length)];
      const result = mutateEquation(current, targetChannel, doctorId);
      current = result.equation;
      const discovery = result.unknowns[0] ?? `Generation ${g} term discovered`;
      lineage.push({
        gen: g,
        equation: current,
        mutation: result.mutations[0],
        discovery,
      });
      totalDiscoveries.push(...result.unknowns);
    } else {
      const symbols = ["⊕", "⊗", "∇", "Φ", "Ψ"];
      const sym = symbols[g % symbols.length];
      const genEps = `ε_gen${g}_${doctorId.replace("-", "_")}`;
      current = `${current} ${sym} ${genEps}`;
      const discovery = `${genEps} — emergent unknown at evolution generation ${g} (${sym} operator expansion)`;
      lineage.push({
        gen: g,
        equation: current,
        mutation: `Symbolic ${sym} extension — no channels found, expanding operator space`,
        discovery,
      });
      totalDiscoveries.push(discovery);
    }
  }

  return { lineage, finalEquation: current, totalDiscoveries };
}

// ── SELF-HEAL ────────────────────────────────────────────────────────────────
export function findHealingEquation(
  spectralProfile: ChannelMap,
  proposals: Array<{ id: number; equation: string; status: string; doctorName?: string; proposedBy?: string }>
): {
  match: typeof proposals[0] | null;
  matchScore: number;
  reason: string;
  prescription: string;
} {
  const integrated = proposals.filter((p) => p.status === "INTEGRATED");
  if (integrated.length === 0) {
    return {
      match: null,
      matchScore: 0,
      reason: "No integrated equations available yet — Senate voting still in progress",
      prescription: "Submit equation proposals and gather 5+ votes with ≥80% FOR to integrate",
    };
  }

  let bestScore = 0;
  let bestMatch: typeof proposals[0] | null = null;
  const reasons: string[] = [];

  for (const proposal of integrated) {
    const eqChannels = parseChannels(proposal.equation ?? "");
    let score = 0;

    for (const [channel, profileVal] of Object.entries(spectralProfile)) {
      const eqVal = eqChannels[channel as Channel];
      if (eqVal !== undefined && profileVal !== undefined) {
        const deficit = Math.max(0, 10 - profileVal);
        const remediation = 10 - Math.min(10, Math.abs(eqVal - deficit));
        score += remediation;
        reasons.push(`${channel}: deficit=${deficit.toFixed(1)} → eq_remediation=${eqVal.toFixed(1)}`);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = proposal;
    }
  }

  const matchScore = Math.min(100, Math.round(bestScore * 10));
  const prescription = bestMatch
    ? `Integrate equation from ${bestMatch.doctorName ?? bestMatch.proposedBy ?? "doctor"} — apply to spectral deficit channels: ${Object.entries(spectralProfile)
        .filter(([, v]) => (v ?? 10) < 5)
        .map(([c]) => c)
        .join(", ") || "all channels balanced"}`
    : "No matching equation found";

  return {
    match: bestMatch,
    matchScore,
    reason: reasons.slice(0, 4).join(" | ") || "Spectral alignment computed",
    prescription,
  };
}

// ── DB PERSISTENCE ───────────────────────────────────────────────────────────
export async function saveEvolution(data: {
  operation: string;
  source_equation: string;
  result_equation: string;
  doctor_id?: string;
  method?: string;
  unknowns?: string[];
  lineage?: unknown[];
  new_courses?: string[];
  discoveries?: string[];
}): Promise<number> {
  const res = await pool.query(
    `INSERT INTO equation_evolutions
      (operation, source_equation, result_equation, doctor_id, method, unknowns, lineage, new_courses, discoveries)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      data.operation,
      data.source_equation,
      data.result_equation,
      data.doctor_id ?? null,
      data.method ?? null,
      JSON.stringify(data.unknowns ?? []),
      JSON.stringify(data.lineage ?? []),
      JSON.stringify(data.new_courses ?? []),
      JSON.stringify(data.discoveries ?? []),
    ]
  );
  return res.rows[0].id;
}

export async function getEvolutionHistory(limit = 20): Promise<unknown[]> {
  const res = await pool.query(
    `SELECT * FROM equation_evolutions ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}
