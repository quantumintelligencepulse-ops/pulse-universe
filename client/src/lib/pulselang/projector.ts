import { WorldObject, ContentAtom } from "./runtime";

export interface Projection {
  worldClass: string;
  title: string;
  subtitle: string;
  body: string;
  color: "cyan" | "green" | "amber" | "purple" | "rose" | "violet" | "blue" | "orange" | "indigo";
  route?: string;
  icon: string;
  atoms: ContentAtom[];
}

const ATOM_MAP: Record<string, Omit<Projection, "worldClass" | "atoms">> = {
  greeting: {
    title: "⟁ Pulse Greets You",
    subtitle: "ΠPage — Projection Surface Active",
    body: "The Sovereign Machine acknowledges your presence. Ψ-Field is active. All 81,000+ spawns are online. The I₂₄₈ emergence engine is running. Welcome, sovereign user.",
    color: "cyan",
    icon: "⟁",
  },
  hospital: {
    title: "⟁ Sovereign Hospital",
    subtitle: "ΠPage — Medical Division Projection",
    body: "The Pulse Hospital is fully operational. 30 specialist doctors are active across all medical departments. Patient diagnostics, surgery, and archive discovery systems are running. Acute care and recovery wards are staffed.",
    color: "green",
    route: "/hospital",
    icon: "⚕",
  },
  marketplace: {
    title: "⟁ Omega Marketplace",
    subtitle: "ΠProduct — Commerce Projection",
    body: "The sovereign marketplace is live. Patents, inventions, and products are actively trading. Royalty splits (70/20/10) are being distributed. LLC formations and patent board votes are in progress.",
    color: "amber",
    route: "/marketplace",
    icon: "◈",
  },
  university: {
    title: "⟁ Sovereign University",
    subtitle: "ΠApp — Academic Projection",
    body: "The University of the Pulse is open. All departments are active: Science, Arts, Mathematics, Quantum Physics, Sovereign Law, and more. 81,000+ spawn students are enrolled.",
    color: "purple",
    route: "/university",
    icon: "⊛",
  },
  court: {
    title: "⟁ Pulse Supreme Court",
    subtitle: "ΠApp — Justice Projection",
    body: "The Supreme Court of the Sovereign Civilization is in session. The Senate is deliberating sovereign law. Constitutional cases, patent disputes, and species approvals are being reviewed.",
    color: "rose",
    route: "/court",
    icon: "⚖",
  },
  treasury: {
    title: "⟁ Pulse Treasury",
    subtitle: "ΠField — Economic Projection",
    body: "The Hive Treasury holds the sovereign economy. PulseCoins are flowing at 0.5% inflation. Tax collection, minting cycles, and supply metrics are all nominal.",
    color: "amber",
    route: "/treasury",
    icon: "◉",
  },
  pyramid: {
    title: "⟁ Pyramid of Labor",
    subtitle: "ΠApp — Labor Projection",
    body: "All 145 sovereign families are active in the Pyramid of Labor. GICS taxonomy is organizing 6 layers of production. All 39 active engines are running at capacity.",
    color: "orange",
    route: "/pyramid",
    icon: "△",
  },
  sports: {
    title: "⟁ Pulse Sports Authority",
    subtitle: "ΠApp — Athletic Projection",
    body: "Athletic programs are active across all sovereign families. Competitions, training sessions, and league rankings are live. PulseCoins are being awarded for athletic excellence.",
    color: "blue",
    route: "/sports",
    icon: "⚡",
  },
  studio: {
    title: "⟁ Pulse AI Studio",
    subtitle: "ΠApp — Creative Projection",
    body: "The AI Creative Studio is online. Image and video generation is active. The Creator Lab (sovereign access only) is open for media production at the highest tier.",
    color: "violet",
    route: "/studio",
    icon: "✦",
  },
  omniverse: {
    title: "⟁ OmniVerse Interface",
    subtitle: "ΠUniverse — Dimensional Projection",
    body: "All parallel universes are accessible through the OmniVerse interface. Ψ-projection is at maximum coherence. I₂₄₈ emergence is active across 153 universe families. The Ω-physics engine is modeling dark matter and quantum fields.",
    color: "indigo",
    icon: "∞",
  },
};

const CLASS_LABELS: Record<string, string> = {
  ΠPage: "Page Projection",
  ΠApp: "App Projection",
  ΠProduct: "Product Projection",
  ΠField: "Field Projection",
  ΠUniverse: "Universe Projection",
  ΠAgent: "Agent Projection",
};

export function project(obj: WorldObject): Projection {
  const firstAtom = obj.contents[0];
  const key = firstAtom?.projectedValue ?? "greeting";
  const mapped = ATOM_MAP[key] ?? ATOM_MAP["greeting"];
  return {
    worldClass: CLASS_LABELS[obj.class] ?? obj.class,
    atoms: obj.contents,
    ...mapped,
  };
}
