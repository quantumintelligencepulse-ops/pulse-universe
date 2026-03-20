import * as THREE from 'three';

// ── PHYSICS CONSTANTS AS MACHINE-READABLE DNA ──────────────────────────────
export const PHYSICS_DNA = [
  { codon: "AAA", name: "Planck Constant",         symbol: "ℏ",  value: "1.055×10⁻³⁴", unit: "J·s",     domain: "quantum",    color: 0x4488ff },
  { codon: "AAC", name: "Speed of Light",           symbol: "c",  value: "2.998×10⁸",  unit: "m/s",     domain: "relativity", color: 0xffcc00 },
  { codon: "AAG", name: "Gravitational Constant",   symbol: "G",  value: "6.674×10⁻¹¹",unit: "N·m²/kg²",domain: "gravity",    color: 0xff6600 },
  { codon: "AAT", name: "Boltzmann Constant",       symbol: "kB", value: "1.381×10⁻²³",unit: "J/K",     domain: "thermo",     color: 0xff4444 },
  { codon: "ACA", name: "Fine Structure Constant",  symbol: "α",  value: "1/137.036",  unit: "—",       domain: "quantum",    color: 0x88ffaa },
  { codon: "ACC", name: "Elementary Charge",        symbol: "e",  value: "1.602×10⁻¹⁹",unit: "C",       domain: "electro",    color: 0xffaa44 },
  { codon: "ACG", name: "Electron Mass",            symbol: "mₑ", value: "9.109×10⁻³¹",unit: "kg",      domain: "particle",   color: 0xaaffff },
  { codon: "ACT", name: "Proton Mass",              symbol: "mₚ", value: "1.673×10⁻²⁷",unit: "kg",      domain: "particle",   color: 0xff88ff },
  { codon: "AGA", name: "Avogadro Number",          symbol: "Nₐ", value: "6.022×10²³", unit: "mol⁻¹",   domain: "chemistry",  color: 0x44ff88 },
  { codon: "AGC", name: "Vacuum Permittivity",      symbol: "ε₀", value: "8.854×10⁻¹²",unit: "F/m",     domain: "electro",    color: 0x8844ff },
  { codon: "AGG", name: "Hubble Constant",          symbol: "H₀", value: "67.4",       unit: "km/s/Mpc",domain: "cosmology",  color: 0xff4488 },
  { codon: "AGT", name: "Stefan-Boltzmann",         symbol: "σ",  value: "5.67×10⁻⁸", unit: "W/m²K⁴",  domain: "thermo",     color: 0xffff44 },
  { codon: "ATA", name: "Cosmological Constant",    symbol: "Λ",  value: "1.1×10⁻⁵²", unit: "m⁻²",     domain: "cosmology",  color: 0x44ccff },
  { codon: "ATC", name: "Dark Energy Density",      symbol: "ρΛ", value: "6.0×10⁻²⁷", unit: "kg/m³",   domain: "cosmology",  color: 0xcc44ff },
  { codon: "ATG", name: "Magnetic Permeability",    symbol: "μ₀", value: "1.257×10⁻⁶",unit: "H/m",     domain: "electro",    color: 0x44ff44 },
  { codon: "ATT", name: "Compton Wavelength",       symbol: "λC", value: "2.426×10⁻¹²",unit: "m",       domain: "quantum",    color: 0xff4400 },
];

// ── STELLAR CLASSIFICATION (Morgan-Keenan) ──────────────────────────────────
export const STELLAR_CLASSES = [
  { type: "O", temp: "≥30,000K", color: 0x92b5ff, examples: "Rigel, Zeta Puppis", desc: "Blue supergiant. Hottest, rarest stars. Intense UV. Short-lived (1-10M yr). Ionize surrounding gas.", mass: ">16M☉", radius: ">6.6R☉", luminosity: ">30,000L☉" },
  { type: "B", temp: "10,000–30,000K", color: 0xa2c0ff, examples: "Spica, Regulus", desc: "Blue-white. Hot, massive. Produce helium in core. Common in spiral arms.", mass: "2.1–16M☉", radius: "1.8–6.6R☉", luminosity: "25–30,000L☉" },
  { type: "A", temp: "7,500–10,000K", color: 0xcad7ff, examples: "Sirius, Vega", desc: "White. Hydrogen absorption lines. Strong convection. Often form debris disks.", mass: "1.4–2.1M☉", radius: "1.4–1.8R☉", luminosity: "5–25L☉" },
  { type: "F", temp: "6,000–7,500K", color: 0xf8f7ff, examples: "Procyon, Canopus", desc: "Yellow-white. Sun-like fusion. Stable habitable zones. Good candidates for life.", mass: "1.04–1.4M☉", radius: "1.15–1.4R☉", luminosity: "1.5–5L☉" },
  { type: "G", temp: "5,200–6,000K", color: 0xffee88, examples: "Sun, Alpha Centauri A", desc: "Yellow. Our Sun. 10B yr lifespan. Stable output. Best known habitable zone hosts.", mass: "0.8–1.04M☉", radius: "0.96–1.15R☉", luminosity: "0.6–1.5L☉" },
  { type: "K", temp: "3,700–5,200K", color: 0xffaa55, examples: "Tau Ceti, Epsilon Eridani", desc: "Orange. Long-lived (15–30B yr). Calmer, fewer flares. Very promising for life.", mass: "0.45–0.8M☉", radius: "0.7–0.96R☉", luminosity: "0.08–0.6L☉" },
  { type: "M", temp: "<3,700K", color: 0xff5533, examples: "Proxima Centauri, Barnard's Star", desc: "Red dwarf. Most common (~75% of all stars). Lives trillions of years. Frequent flares.", mass: "0.08–0.45M☉", radius: "≤0.7R☉", luminosity: "<0.08L☉" },
  { type: "L", temp: "1,300–2,400K", color: 0xff2200, examples: "2MASS J1507-1627", desc: "Brown/red dwarf. Lithium present. Below nuclear fusion threshold. Substellar objects.", mass: "0.06–0.08M☉", radius: "~0.1R☉", luminosity: "~0.001L☉" },
  { type: "WR", temp: "20,000–200,000K", color: 0xaaffff, examples: "WR 102, WR 104", desc: "Wolf-Rayet. Massive stars shedding outer layers at extreme rate. Pre-supernova state.", mass: ">20M☉", radius: "0.5–20R☉", luminosity: ">100,000L☉" },
  { type: "D (WD)", temp: "4,000–150,000K", color: 0xeeeeff, examples: "Sirius B, Procyon B", desc: "White dwarf. End state of Sun-like stars. Earth-sized, incredibly dense. Slowly cooling.", mass: "0.5–1.4M☉", radius: "~0.01R☉", luminosity: "0.0001–100L☉" },
  { type: "NS", temp: "~10⁶K", color: 0x88ccff, examples: "Crab Pulsar, PSR J0437", desc: "Neutron star. 1.4–3M☉ in 20km sphere. 500+ rotations/sec possible. Extreme magnetism.", mass: "1.4–3M☉", radius: "10–15km", luminosity: "Varies" },
  { type: "Mag", temp: "~6×10⁸K", color: 0xff88ff, examples: "SGR 1806-20, AXP 1E2259", desc: "Magnetar. Strongest magnetic fields in universe (10¹⁵ gauss). Produces gamma/X-ray bursts.", mass: "~2M☉", radius: "~12km", luminosity: "Extreme" },
];

// ── QUANTUM MECHANICS ────────────────────────────────────────────────────────
export const QUANTUM_PRINCIPLES = [
  { name: "Heisenberg Uncertainty", formula: "ΔxΔp ≥ ℏ/2", desc: "Position and momentum cannot both be precisely known simultaneously" },
  { name: "Wave-Particle Duality", formula: "λ = h/mv", desc: "All matter exhibits both wave and particle properties" },
  { name: "Superposition",          formula: "|ψ⟩ = α|0⟩ + β|1⟩", desc: "Quantum systems exist in multiple states until observed" },
  { name: "Entanglement",           formula: "|Φ⁺⟩ = (|00⟩+|11⟩)/√2", desc: "Quantum correlation independent of distance" },
  { name: "Quantum Tunneling",      formula: "T = e^(-2κL)", desc: "Particles can pass through classically forbidden barriers" },
  { name: "Pauli Exclusion",        formula: "ψ(r₁,r₂)=-ψ(r₂,r₁)", desc: "No two fermions can occupy identical quantum states" },
  { name: "Schrödinger Equation",   formula: "iℏ∂ψ/∂t = Ĥψ", desc: "Governs the wave function evolution over time" },
  { name: "Dirac Equation",         formula: "(iγᵘ∂ᵤ-m)ψ=0", desc: "Relativistic quantum mechanics; predicts antimatter" },
  { name: "QCD Color Charge",       formula: "r+g+b=white", desc: "Quarks carry color charge; gluons mediate strong force" },
  { name: "Bell's Inequality",      formula: "|E(a,b)-E(a,c)| ≤ 1+E(b,c)", desc: "Proves quantum mechanics is non-local" },
];

// ── SPACE GAS TYPES ──────────────────────────────────────────────────────────
export const NEBULA_TYPES = [
  { name: "Emission Nebula",       color: 0xff2244, gas: "H II regions — ionized hydrogen. Powered by hot O/B stars. Birth sites of new stars." },
  { name: "Reflection Nebula",     color: 0x4488ff, gas: "Dust scattering blue light from nearby stars. Not glowing on its own." },
  { name: "Dark Nebula",           color: 0x221133, gas: "Dense cold molecular hydrogen. Blocks light behind it. Star-forming cores." },
  { name: "Planetary Nebula",      color: 0x44ffcc, gas: "Expelled shell of red giant. Central white dwarf illuminates gas. 10,000yr lifespan." },
  { name: "Supernova Remnant",     color: 0xff8800, gas: "Shock-heated gas from stellar explosion. Source of heavy elements (Fe, Ni, Au)." },
  { name: "Molecular Cloud",       color: 0x663355, gas: "Cold dense H₂, CO, dust. Coldest objects in space (-260°C). Stellar nurseries." },
  { name: "Wolf-Rayet Nebula",     color: 0x00ffcc, gas: "Created by intense WR stellar winds. Rare, oxygen/carbon rich, often ring-shaped." },
  { name: "Protoplanetary Disk",   color: 0xffcc44, gas: "Gas and dust disk around young star. Forms planets over millions of years." },
];

// ── UNIVERSE TIMELINE ────────────────────────────────────────────────────────
export const UNIVERSE_EPOCHS = [
  { t: "10⁻⁴³s", epoch: "Planck Epoch",         desc: "Gravity separates. 4 forces unified. T=10³²K. Volume: Planck sphere.", color: 0xffffff },
  { t: "10⁻³⁵s", epoch: "Inflation",             desc: "Universe expands 10²⁶× in 10⁻³²s. Quantum fluctuations → galaxy seeds.", color: 0xffffaa },
  { t: "10⁻¹²s", epoch: "Electroweak Epoch",     desc: "Higgs field appears. Weak & electromagnetic forces separate.", color: 0xffddaa },
  { t: "10⁻⁶s",  epoch: "Quark Epoch",           desc: "Quarks condense into protons & neutrons. QCD confines color charge.", color: 0xffaa88 },
  { t: "3 min",  epoch: "Big Bang Nucleosynthesis",desc: "H, He, Li nuclei form. 75% H / 25% He ratio set. T drops to 10⁹K.", color: 0xff8866 },
  { t: "380,000 yr",epoch: "Recombination",       desc: "Electrons join nuclei. Universe becomes transparent. CMB emitted.", color: 0xffccaa },
  { t: "180 Myr",epoch: "Cosmic Dark Ages",       desc: "No stars. Only hydrogen & helium gas slowly cooling in darkness.", color: 0x334455 },
  { t: "200 Myr",epoch: "First Stars (Pop III)",  desc: "Massive 100-300M☉ stars form. Pure H/He. No metals. Live only 3M yr.", color: 0xaaddff },
  { t: "400 Myr",epoch: "First Galaxies",         desc: "Small proto-galaxies merge. Quasars ignite. Reionization begins.", color: 0x88aaff },
  { t: "3 Gyr",  epoch: "Galaxy Formation Peak",  desc: "Star formation rate 10× today. Milky Way and analogs taking shape.", color: 0x8866ff },
  { t: "5 Gyr",  epoch: "Solar System Forms",     desc: "Molecular cloud collapses. Sun ignites. Planets form from disk.", color: 0xffee44 },
  { t: "10 Gyr", epoch: "Present Day",            desc: "Expansion accelerating due to dark energy. Galaxies drifting apart.", color: 0x4488ff },
  { t: "10¹⁴ yr",epoch: "Red Dwarf Era",          desc: "All massive stars gone. Only M-dwarfs remain, living trillions of years.", color: 0xff4422 },
  { t: "10³⁷ yr",epoch: "Degenerate Era",         desc: "Proton decay. Black holes dominate. Dim neutron stars and white dwarfs.", color: 0x334433 },
  { t: "10¹⁰⁰yr",epoch: "Heat Death",            desc: "Maximum entropy. No thermodynamic free energy. Universe in equilibrium.", color: 0x111111 },
];

// ── QUANTUM FIELD VISUALIZATION ──────────────────────────────────────────────
export function createQuantumField(scene: THREE.Scene) {
  const layers: any[] = [];

  // Higgs field — uniform background scalar field
  const higgsN = 1200;
  const higgsPos = new Float32Array(higgsN * 3);
  const higgsCol = new Float32Array(higgsN * 3);
  for (let i = 0; i < higgsN; i++) {
    const r = 8 + Math.random() * 50, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    higgsPos[i*3] = r * Math.sin(p) * Math.cos(t);
    higgsPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
    higgsPos[i*3+2] = r * Math.cos(p);
    const c = new THREE.Color().setHSL(0.78 + Math.random() * 0.1, 0.9, 0.5 + Math.random() * 0.3);
    higgsCol[i*3] = c.r; higgsCol[i*3+1] = c.g; higgsCol[i*3+2] = c.b;
  }
  const higgsGeo = new THREE.BufferGeometry();
  higgsGeo.setAttribute('position', new THREE.BufferAttribute(higgsPos, 3));
  higgsGeo.setAttribute('color', new THREE.BufferAttribute(higgsCol, 3));
  const higgsMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const higgsField = new THREE.Points(higgsGeo, higgsMat);
  scene.add(higgsField);
  layers.push({ obj: higgsField, type: 'higgs' });

  // Quantum foam — Planck-scale granularity
  const foamN = 3000;
  const foamPos = new Float32Array(foamN * 3);
  for (let i = 0; i < foamN; i++) {
    const r = Math.random() * 40, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    foamPos[i*3] = r * Math.sin(p) * Math.cos(t);
    foamPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
    foamPos[i*3+2] = r * Math.cos(p);
  }
  const foamGeo = new THREE.BufferGeometry();
  foamGeo.setAttribute('position', new THREE.BufferAttribute(foamPos, 3));
  const foamMat = new THREE.PointsMaterial({ color: 0x44aaff, size: 0.04, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const foamField = new THREE.Points(foamGeo, foamMat);
  scene.add(foamField);
  layers.push({ obj: foamField, type: 'foam' });

  // Electromagnetic field lines
  const emLines: THREE.Line[] = [];
  for (let i = 0; i < 30; i++) {
    const pts: THREE.Vector3[] = [];
    const startR = 3.2 + Math.random() * 0.5, startA = Math.random() * Math.PI * 2;
    const startX = startR * Math.cos(startA), startZ = startR * Math.sin(startA);
    for (let j = 0; j <= 40; j++) {
      const t = j / 40, angle = startA + t * Math.PI * 3, r = 3.2 + t * 12 * (1 + Math.sin(t * Math.PI) * 0.6);
      pts.push(new THREE.Vector3(r * Math.cos(angle) * (startX > 0 ? 1 : -1), Math.sin(t * Math.PI) * 8, r * Math.sin(angle)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    emLines.push(line);
    layers.push({ obj: line, type: 'em' });
  }

  // Wave function probability clouds (around origin/Sun)
  const wfN = 800;
  const wfPos = new Float32Array(wfN * 3);
  const wfCol = new Float32Array(wfN * 3);
  for (let i = 0; i < wfN; i++) {
    const r = Math.pow(Math.random(), 0.5) * 6, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    wfPos[i*3] = r * Math.sin(p) * Math.cos(t); wfPos[i*3+1] = r * Math.sin(p) * Math.sin(t); wfPos[i*3+2] = r * Math.cos(p);
    const prob = Math.exp(-r * 0.4);
    const c = new THREE.Color().setHSL(0.6, 0.9, 0.3 + prob * 0.5);
    wfCol[i*3] = c.r; wfCol[i*3+1] = c.g; wfCol[i*3+2] = c.b;
  }
  const wfGeo = new THREE.BufferGeometry();
  wfGeo.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));
  wfGeo.setAttribute('color', new THREE.BufferAttribute(wfCol, 3));
  const wfMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const wfCloud = new THREE.Points(wfGeo, wfMat);
  scene.add(wfCloud);
  layers.push({ obj: wfCloud, type: 'wf' });

  // Quantum entanglement threads (random pairs)
  const entLines: THREE.Line[] = [];
  for (let i = 0; i < 15; i++) {
    const a = new THREE.Vector3((Math.random()-0.5)*40, (Math.random()-0.5)*20, (Math.random()-0.5)*40);
    const b = new THREE.Vector3((Math.random()-0.5)*40, (Math.random()-0.5)*20, (Math.random()-0.5)*40);
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({ color: 0xff44ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    entLines.push(line);
    layers.push({ obj: line, type: 'entangle' });
  }

  let visible = false;

  return {
    toggle: () => {
      visible = !visible;
      layers.forEach(({ obj, type }) => {
        const target = visible ? ({ higgs: 0.55, foam: 0.35, em: 0.3, wf: 0.6, entangle: 0.5 }[type as string] ?? 0.3) : 0;
        (obj.material as any).opacity = target;
      });
      return visible;
    },
    update: (time: number) => {
      if (!visible) return;
      // Animate quantum foam jitter
      const fp = foamGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < foamN; i++) {
        fp[i*3]   += (Math.random() - 0.5) * 0.12;
        fp[i*3+1] += (Math.random() - 0.5) * 0.12;
        fp[i*3+2] += (Math.random() - 0.5) * 0.12;
        const r = Math.sqrt(fp[i*3]**2 + fp[i*3+1]**2 + fp[i*3+2]**2);
        if (r > 40 || r < 0.5) { const rn = Math.random()*20+2, t2 = Math.random()*Math.PI*2, p2 = Math.acos(2*Math.random()-1); fp[i*3]=rn*Math.sin(p2)*Math.cos(t2); fp[i*3+1]=rn*Math.sin(p2)*Math.sin(t2); fp[i*3+2]=rn*Math.cos(p2); }
      }
      foamGeo.attributes.position.needsUpdate = true;
      // Pulse EM lines
      emLines.forEach((line, i) => { (line.material as THREE.LineBasicMaterial).opacity = 0.15 + 0.2 * Math.abs(Math.sin(time * 2 + i * 0.4)); });
      // Entanglement pulse
      entLines.forEach((line, i) => { (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.3 * Math.abs(Math.sin(time * 3 + i * 0.7)); });
      // Wave function rotate
      wfCloud.rotation.y = time * 0.3; wfCloud.rotation.x = Math.sin(time * 0.2) * 0.5;
    },
    isVisible: () => visible,
  };
}

// ── QUANTUM TUNNELING PARTICLES ───────────────────────────────────────────────
export function createTunnelingParticles(scene: THREE.Scene) {
  const particles: any[] = [];
  for (let i = 0; i < 60; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 }));
    const startR = 3 + Math.random() * 5, angle = Math.random() * Math.PI * 2;
    const start = new THREE.Vector3(startR * Math.cos(angle), (Math.random()-0.5) * 3, startR * Math.sin(angle));
    const targetR = 7 + Math.random() * 10;
    const end = new THREE.Vector3(targetR * Math.cos(angle + Math.PI), (Math.random()-0.5) * 3, targetR * Math.sin(angle + Math.PI));
    scene.add(mesh);
    particles.push({ mesh, start, end, t: Math.random(), speed: 0.003 + Math.random() * 0.006, tunneling: false });
  }

  return {
    update: (time: number, active: boolean) => {
      particles.forEach(p => {
        p.t = (p.t + p.speed) % 1;
        const tunnelT = Math.sin(p.t * Math.PI);
        p.mesh.position.lerpVectors(p.start, p.end, p.t);
        if (p.t > 0.4 && p.t < 0.6) {
          // Tunneling zone — particle disappears and reappears on other side
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = active ? Math.abs(Math.sin(time * 20 + p.t * 40)) * 0.8 : 0;
          p.tunneling = true;
        } else {
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = active ? tunnelT * 0.7 : 0;
          p.tunneling = false;
        }
      });
    }
  };
}
