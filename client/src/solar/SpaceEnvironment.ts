import * as THREE from 'three';

const BH_POS = new THREE.Vector3(65, 0, -55);
const WH_POS = new THREE.Vector3(-70, 0, -50);

export function createSpaceEnvironment(scene: THREE.Scene) {
  const fns: ((t: number) => void)[] = [];

  addInterstellarMedium(scene);
  addTypedStarfield(scene);
  addStarClusters(scene);
  addBinaryStars(scene);
  addProtostar(scene);
  addNebulae(scene);
  addCosmicWeb(scene);
  addDistantGalaxies(scene);
  addDarkMatterHalo(scene);
  addOortCloud(scene);
  addHeliopause(scene);
  addCosmicMicrowaveBackground(scene);

  fns.push(addBlackHole(scene));
  fns.push(addWormhole(scene));
  fns.push(addPulsars(scene));
  addQuasars(scene);
  addSupernovaRemnant(scene);
  addNeutronStar(scene);
  addWhiteHole(scene);
  addGalaxyMerger(scene);

  addAsteroidBelt(scene);
  addKuiperBelt(scene);
  addOortCloudComets(scene);
  fns.push(addComets(scene));
  fns.push(addSolarPlasmaRings(scene));
  fns.push(addSolarWind(scene));
  fns.push(addSolarFlares(scene));
  addZodiacalLight(scene);
  addPlasmaFilaments(scene);
  addMagnetosphere(scene);
  addVanAllenBelts(scene);

  fns.push(addGravitationalWaves(scene));
  fns.push(addCosmicRays(scene));
  fns.push(addGammaRayBurst(scene));
  fns.push(addFastRadioBursts(scene));
  fns.push(addKilonovaFlash(scene));
  addCosmicStrings(scene);

  const twinkleMats = addTwinklingStars(scene);
  addMilkyWay(scene);
  addEclipticDust(scene);

  return {
    update: (time: number) => {
      fns.filter(Boolean).forEach(f => f(time));
      twinkleMats.forEach((m: any) => {
        m.opacity = m._base + Math.sin(time * m._spd + m._ph) * m._amp;
      });
    }
  };
}

function addInterstellarMedium(scene: THREE.Scene) {
  const count = 4000;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 50 + Math.random() * 200;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(p) * Math.cos(t);
    pos[i*3+1] = r * Math.sin(p) * Math.sin(t) * 0.3;
    pos[i*3+2] = r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x334466, size: 0.2, transparent: true, opacity: 0.1, depthWrite: false,
  })));
}

function addTypedStarfield(scene: THREE.Scene) {
  ([
    [0x9bb0ff, 1.6, 400,  1.0], [0xaabfff, 1.2, 800,  0.98], [0xcad7ff, 0.9, 1500, 0.95],
    [0xf8f7ff, 0.65, 3000, 0.9], [0xffee88, 0.6, 4000, 0.85], [0xffbb55, 0.55, 5000, 0.85],
    [0xff6633, 0.5, 7000, 0.80], [0xff3311, 2.5, 150, 0.95], [0xff9944, 3.5, 60, 0.90],
    [0xffffff, 1.1, 90, 1.0], [0xaaffff, 2.2, 50, 0.95], [0xffffcc, 0.28, 8000, 0.65],
  ] as [number, number, number, number][]).forEach(([color, size, count, opacity]) => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 110 + Math.random() * 280;
      const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false })));
  });
}

function addStarClusters(scene: THREE.Scene) {
  ([
    { p: [65, 30, -105], n: 500, r: 8, c: 0xffeeaa, s: 0.5 },
    { p: [-85, -20, 75], n: 900, r: 13, c: 0xffddbb, s: 0.4 },
    { p: [125, 10, 35],  n: 350, r: 6, c: 0xaaccff, s: 0.6 },
    { p: [-30, 65, -90], n: 700, r: 11, c: 0xffcc88, s: 0.45 },
    { p: [80, -45, 90],  n: 400, r: 7, c: 0xffffff, s: 0.5 },
  ] as any[]).forEach(({ p, n, r, c, s }) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const dist = Math.pow(Math.random(), 1.5) * r;
      const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i*3] = p[0] + dist * Math.sin(ph) * Math.cos(t); pos[i*3+1] = p[1] + dist * Math.sin(ph) * Math.sin(t); pos[i*3+2] = p[2] + dist * Math.cos(ph);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: s, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })));
  });
}

function addBinaryStars(scene: THREE.Scene) {
  ([
    { pos: [-55, 25, -85], c1: 0xffee88, c2: 0x88aaff, sep: 2 },
    { pos: [95, -20, 70],  c1: 0xff6633, c2: 0xffffff, sep: 1.5 },
    { pos: [-100, 30, 50], c1: 0xaaddff, c2: 0xffaacc, sep: 3 },
  ] as any[]).forEach(({ pos, c1, c2, sep }) => {
    [[c1, -sep/2], [c2, sep/2]].forEach(([col, off]) => {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: col as number }));
      star.position.set(pos[0] + (off as number), pos[1], pos[2]);
      scene.add(star);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), new THREE.MeshBasicMaterial({ color: col as number, transparent: true, opacity: 0.12, side: THREE.BackSide }));
      glow.position.copy(star.position);
      scene.add(glow);
    });
  });
}

function addProtostar(scene: THREE.Scene) {
  const pos = new THREE.Vector3(50, 20, 90);
  const count = 600, positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 5;
    positions[i*3] = pos.x + r * Math.cos(a); positions[i*3+1] = pos.y + (Math.random() - 0.5) * 0.5; positions[i*3+2] = pos.z + r * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffaa44, size: 0.25, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff7700 }));
  core.position.copy(pos); scene.add(core);
}

function addNebulae(scene: THREE.Scene) {
  ([
    { p: [80, 22, -72],   c1: 0xff2244, c2: 0xff8844, n: 2800, s: 18 },
    { p: [-78,-16, 58],   c1: 0x2266ff, c2: 0x44aaff, n: 2200, s: 13 },
    { p: [68, -32, 78],   c1: 0x00ffbb, c2: 0x0066ff, n: 1600, s: 11 },
    { p: [-95, 16, -28],  c1: 0xff6600, c2: 0xffff00, n: 3200, s: 24 },
    { p: [38, 48, -88],   c1: 0x8866ff, c2: 0xffffff, n: 1100, s: 10 },
    { p: [-48,-28, -78],  c1: 0x220033, c2: 0x440055, n: 2000, s: 20 },
    { p: [108, 9, 28],    c1: 0xff4400, c2: 0xffaa00, n:  900, s:  8 },
    { p: [-58, 38, 88],   c1: 0xff1166, c2: 0x9933ff, n: 3000, s: 20 },
    { p: [48, -52, -52],  c1: 0x0033ff, c2: 0x00ffff, n: 1300, s: 12 },
    { p: [-112, 0, 42],   c1: 0xffaa00, c2: 0xff6600, n: 2000, s: 15 },
    { p: [130, -30, 80],  c1: 0x00ff88, c2: 0xffff44, n: 1500, s: 14 },
    { p: [-30, 80, -120], c1: 0xff88cc, c2: 0xaaaaff, n: 1800, s: 16 },
  ] as any[]).forEach(({ p, c1, c2, n, s }) => {
    const positions = new Float32Array(n * 3), colors = new Float32Array(n * 3);
    const col1 = new THREE.Color(c1), col2 = new THREE.Color(c2);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.4) * s;
      positions[i*3] = p[0] + r * Math.sin(ph) * Math.cos(t) * (0.7 + Math.random() * 0.6);
      positions[i*3+1] = p[1] + r * Math.sin(ph) * Math.sin(t) * 0.5;
      positions[i*3+2] = p[2] + r * Math.cos(ph) * (0.7 + Math.random() * 0.6);
      const b = Math.random();
      colors[i*3] = col1.r * b + col2.r * (1-b); colors[i*3+1] = col1.g * b + col2.g * (1-b); colors[i*3+2] = col1.b * b + col2.b * (1-b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));
  });
}

function addCosmicWeb(scene: THREE.Scene) {
  const nodeCount = 100;
  const nodes = Array.from({ length: nodeCount }, () => {
    const r = 130 + Math.random() * 180, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t) * 0.25, r * Math.cos(p));
  });
  const linePos: number[] = [];
  nodes.forEach((a, i) => nodes.forEach((b, j) => {
    if (j > i && a.distanceTo(b) < 85 && Math.random() > 0.45) linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }));
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
  scene.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.07 })));
}

function addDistantGalaxies(scene: THREE.Scene) {
  ([
    { p: [155, 22,-125], type: 'spiral', c: 0xffddaa }, { p: [-165, 32, -85], type: 'elliptical', c: 0xffeecc },
    { p: [135,-42, 105], type: 'spiral', c: 0xaaddff }, { p: [-145, 12,-145], type: 'spiral', c: 0xffccaa },
    { p: [205,-12, -62], type: 'elliptical', c: 0xeeddcc }, { p: [-185, 52, 32], type: 'irregular', c: 0xddaaff },
    { p: [82, 62,-162],  type: 'ring', c: 0xaaffdd }, { p: [-72,-62, 155], type: 'spiral', c: 0xffaa88 },
    { p: [165, 32, 125], type: 'elliptical', c: 0xffeedd }, { p: [-205,-22,-105], type: 'spiral', c: 0xccddff },
  ] as any[]).forEach(({ p, type, c }) => {
    const n = (type === 'elliptical' || type === 'lenticular') ? 200 : 160;
    const pos = new Float32Array(n * 3);
    if (type === 'spiral' || type === 'starburst' || type === 'barred') {
      for (let i = 0; i < n; i++) {
        const armAngle = (i / n) * Math.PI * 6, r = (i / n) * 5.5 + Math.random() * 0.8, arm = Math.floor(Math.random() * 2) * Math.PI;
        pos[i*3] = p[0] + r * Math.cos(armAngle + arm); pos[i*3+1] = p[1] + (Math.random() - 0.5) * 0.3; pos[i*3+2] = p[2] + r * Math.sin(armAngle + arm);
      }
    } else {
      for (let i = 0; i < n; i++) {
        const r = Math.pow(Math.random(), 0.5) * 4, t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        pos[i*3] = p[0] + r * Math.sin(ph) * Math.cos(t) * 1.5; pos[i*3+1] = p[1] + r * Math.sin(ph) * Math.sin(t) * 0.8; pos[i*3+2] = p[2] + r * Math.cos(ph);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false })));
  });
}

function addDarkMatterHalo(scene: THREE.Scene) {
  const count = 4000, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 60 + Math.pow(Math.random(), 0.7) * 90, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x4422aa, size: 0.18, transparent: true, opacity: 0.12, depthWrite: false })));
}

function addOortCloud(scene: THREE.Scene) {
  const count = 3000, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 90 + Math.random() * 40, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x446688, size: 0.1, transparent: true, opacity: 0.25, depthWrite: false })));
}

function addHeliopause(scene: THREE.Scene) {
  scene.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(80, 32, 32), new THREE.MeshBasicMaterial({ color: 0x1133aa, transparent: true, opacity: 0.03, side: THREE.BackSide }))));
}

function addCosmicMicrowaveBackground(scene: THREE.Scene) {
  const count = 5000, pos = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 290 + Math.random() * 10, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
    const hue = 0.05 + Math.random() * 0.15, c = new THREE.Color().setHSL(hue, 0.5, 0.4 + Math.random() * 0.3);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.15, depthWrite: false })));
}

function addBlackHole(scene: THREE.Scene) {
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.8, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  core.position.copy(BH_POS); scene.add(core);
  [[3.5, 0xffffff, 0.8], [4.2, 0xff9922, 0.5], [5.0, 0xff4400, 0.3]].forEach(([r, col, op]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r as number, 0.1, 8, 64), new THREE.MeshBasicMaterial({ color: col as number, transparent: true, opacity: op as number }));
    ring.position.copy(BH_POS); ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2; scene.add(ring);
  });
  [8, 12, 18].forEach((r, i) => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.03 / (i+1), side: THREE.BackSide }));
    g.position.copy(BH_POS); scene.add(g);
  });
  const N = 4500, dPos = new Float32Array(N * 3), dCol = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = 3.6 + Math.pow(Math.random(), 0.6) * 7, h = (Math.random() - 0.5) * 0.5 * Math.exp(-(r - 3.6) * 0.25);
    dPos[i*3] = BH_POS.x + r * Math.cos(a); dPos[i*3+1] = BH_POS.y + h; dPos[i*3+2] = BH_POS.z + r * Math.sin(a);
    const t = (r - 3.6) / 7, c = new THREE.Color();
    if (t < 0.2) c.setRGB(1.0, 1.0, 0.95); else if (t < 0.45) c.setRGB(1.0, 0.75, 0.2); else if (t < 0.7) c.setRGB(0.9, 0.2, 0.05); else c.setRGB(0.35, 0.04, 0.02);
    dCol[i*3] = c.r; dCol[i*3+1] = c.g; dCol[i*3+2] = c.b;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  const disk = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(disk);
  const jets = [-1, 1].map(dir => {
    const jN = 700, jPos = new Float32Array(jN * 3), jCol = new Float32Array(jN * 3);
    for (let i = 0; i < jN; i++) {
      const t = Math.random(), spread = Math.sin(t * 0.8) * 1.2, a = Math.random() * Math.PI * 2;
      jPos[i*3] = BH_POS.x + Math.cos(a) * spread * t; jPos[i*3+1] = BH_POS.y + dir * t * 28; jPos[i*3+2] = BH_POS.z + Math.sin(a) * spread * t;
      const c = new THREE.Color().setHSL(0.62 - t * 0.1, 1.0, 0.5 + t * 0.3); jCol[i*3] = c.r; jCol[i*3+1] = c.g; jCol[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(jPos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(jCol, 3));
    const j = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(j); return j;
  });
  return (time: number) => { disk.rotation.y = time * 0.45; jets.forEach(j => { j.rotation.y = time * 0.06; }); };
}

function addWormhole(scene: THREE.Scene) {
  const torus = new THREE.Mesh(new THREE.TorusGeometry(3, 0.6, 16, 64), new THREE.MeshBasicMaterial({ color: 0x8833ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
  torus.position.copy(WH_POS); scene.add(torus);
  const n = 1000, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n, a = t * Math.PI * 14, r = (Math.random() - 0.5) * 3;
    const col = new THREE.Color().setHSL(0.75 - t * 0.35, 1, 0.6);
    sp[i*3] = WH_POS.x + Math.cos(a) * r; sp[i*3+1] = WH_POS.y + t * 7 - 3.5; sp[i*3+2] = WH_POS.z + Math.sin(a) * r;
    sc[i*3] = col.r; sc[i*3+1] = col.g; sc[i*3+2] = col.b;
  }
  const swGeo = new THREE.BufferGeometry();
  swGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); swGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const swirl = new THREE.Points(swGeo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(swirl);
  return (time: number) => { torus.rotation.z = time * 0.55; swirl.rotation.y = time * 0.35; };
}

function addPulsars(scene: THREE.Scene) {
  const data = [
    { pos: new THREE.Vector3(-62, 22, -92), color: 0x00ffff, speed: 1.8 },
    { pos: new THREE.Vector3(115, -32, 62), color: 0xff88ff, speed: 3.2 },
    { pos: new THREE.Vector3(-130, 10, -45), color: 0x88ffaa, speed: 2.5 },
  ];
  const pulsarObjs = data.map(({ pos, color, speed }) => {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    star.position.copy(pos); scene.add(star);
    const beams = [-1, 1].map(dir => {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.4, 14, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      b.position.set(pos.x, pos.y + dir * 7, pos.z); if (dir === -1) b.rotation.z = Math.PI; scene.add(b); return b;
    });
    const mag = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.06, 4, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    mag.position.copy(pos); scene.add(mag);
    return { beams, mag, speed };
  });
  return (time: number) => {
    pulsarObjs.forEach(({ beams, mag, speed }) => {
      const pulse = Math.abs(Math.sin(time * speed * 5));
      beams.forEach(b => { b.rotation.y = time * speed; (b.material as THREE.MeshBasicMaterial).opacity = 0.05 + pulse * 0.55; });
      mag.rotation.y = time * speed * 0.5;
    });
  };
}

function addQuasars(scene: THREE.Scene) {
  ([
    { pos: new THREE.Vector3(205, 42, -105), color: 0xffffff },
    { pos: new THREE.Vector3(-185,-22, 125), color: 0xaaccff },
    { pos: new THREE.Vector3(52,-82,-205), color: 0xffddaa },
  ] as any[]).forEach(({ pos, color }) => {
    const core = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshBasicMaterial({ color }));
    core.position.copy(pos); scene.add(core);
    [2, 5, 9, 15].forEach((r, i) => {
      const g = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08 / (i+1), side: THREE.BackSide }));
      g.position.copy(pos); scene.add(g);
    });
    [-1, 1].forEach(dir => {
      const jN = 400, jp = new Float32Array(jN * 3);
      for (let i = 0; i < jN; i++) {
        const t = Math.random(), sp = t * 2.5, a = Math.random() * Math.PI * 2;
        jp[i*3] = pos.x + Math.cos(a) * sp; jp[i*3+1] = pos.y + dir * t * 35; jp[i*3+2] = pos.z + Math.sin(a) * sp;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(jp, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.35, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
    });
  });
}

function addSupernovaRemnant(scene: THREE.Scene) {
  const pos = new THREE.Vector3(-68, 17, -112);
  [[8, 0xff4400, 0.14], [9.5, 0xff8800, 0.08], [11, 0xffff44, 0.04]].forEach(([r, c, op]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r as number, 32, 32), new THREE.MeshBasicMaterial({ color: c as number, transparent: true, opacity: op as number }));
    s.position.copy(pos); scene.add(s);
  });
  const n = 2500, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 7.5 + Math.random() * 4;
    sp[i*3] = pos.x + r * Math.sin(p) * Math.cos(t); sp[i*3+1] = pos.y + r * Math.sin(p) * Math.sin(t); sp[i*3+2] = pos.z + r * Math.cos(p);
    const c = new THREE.Color().setHSL(0.05 + Math.random() * 0.12, 1, 0.6); sc[i*3] = c.r; sc[i*3+1] = c.g; sc[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); geo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })));
}

function addNeutronStar(scene: THREE.Scene) {
  const pos = new THREE.Vector3(72, -42, 82);
  const star = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
  star.position.copy(pos); scene.add(star);
  [0.6, 1.1, 1.8, 2.7].forEach((r, i) => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5 + 0.6, 8, 8), new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.07 / (i+1), side: THREE.BackSide }));
    g.position.copy(pos); scene.add(g);
  });
}

function addWhiteHole(scene: THREE.Scene) {
  const pos = new THREE.Vector3(-30, 30, -100);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  core.position.copy(pos); scene.add(core);
  const n = 600, sp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 1.5 + Math.random() * 8;
    sp[i*3] = pos.x + r * Math.sin(p) * Math.cos(t); sp[i*3+1] = pos.y + r * Math.sin(p) * Math.sin(t); sp[i*3+2] = pos.z + r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  [3, 6, 10].forEach((r, i) => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 / (i+1), side: THREE.BackSide }));
    g.position.copy(pos); scene.add(g);
  });
}

function addGalaxyMerger(scene: THREE.Scene) {
  const center = new THREE.Vector3(-160, -55, 80);
  [[-4, 0xffaacc], [4, 0xaaccff]].forEach(([off, col]) => {
    const n = 120, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 6, r = (i / n) * 4;
      pos[i*3] = center.x + (off as number) + r * Math.cos(a); pos[i*3+1] = center.y + (Math.random() - 0.5) * 2; pos[i*3+2] = center.z + r * Math.sin(a);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: col as number, size: 0.5, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  });
}

function addAsteroidBelt(scene: THREE.Scene) {
  const n = 3000, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 3.5, h = (Math.random() - 0.5) * 0.8;
    pos[i*3] = r * Math.cos(a); pos[i*3+1] = h; pos[i*3+2] = r * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x888877, size: 0.12, transparent: true, opacity: 0.6, sizeAttenuation: true, depthWrite: false })));
  [60, -60].forEach(offset => {
    const tn = 200, tp = new Float32Array(tn * 3), baseAngle = (offset * Math.PI) / 180;
    for (let i = 0; i < tn; i++) {
      const a = baseAngle + (Math.random() - 0.5) * 0.5, r = 21 + (Math.random() - 0.5) * 2;
      tp[i*3] = r * Math.cos(a); tp[i*3+1] = (Math.random() - 0.5) * 0.5; tp[i*3+2] = r * Math.sin(a);
    }
    const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    scene.add(new THREE.Points(tGeo, new THREE.PointsMaterial({ color: 0x998866, size: 0.14, transparent: true, opacity: 0.5, depthWrite: false })));
  });
}

function addKuiperBelt(scene: THREE.Scene) {
  ([[2000, 48, 15, 2, 0x6688aa, 0.1, 0.4], [500, 65, 30, 8, 0x445566, 0.1, 0.3]] as any[]).forEach(([n, baseR, span, hSpan, col, size, op]) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = baseR + Math.random() * span, h = (Math.random() - 0.5) * hSpan;
      pos[i*3] = r * Math.cos(a); pos[i*3+1] = h; pos[i*3+2] = r * Math.sin(a);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: op, depthWrite: false, sizeAttenuation: true })));
  });
}

function addOortCloudComets(scene: THREE.Scene) {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 85 + Math.random() * 20, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x88aacc, size: 0.12, transparent: true, opacity: 0.3, depthWrite: false })));
}

function addComets(scene: THREE.Scene) {
  const data = [
    { r: 35, speed: 0.15, tLen: 5, col: 0xaaccff, inc: 0.6 }, { r: 55, speed: 0.08, tLen: 7, col: 0xccddff, inc: -0.8 },
    { r: 28, speed: 0.22, tLen: 4, col: 0xeeeeff, inc: 1.2 }, { r: 70, speed: 0.05, tLen: 9, col: 0x99bbff, inc: 0.4 },
  ];
  const comets = data.map(({ r, speed, tLen, col, inc }) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    const tn = 180, tp = new Float32Array(tn * 3), tc = new Float32Array(tn * 3);
    const baseCol = new THREE.Color(col);
    for (let i = 0; i < tn; i++) {
      const t = i / tn;
      tp[i*3] = -t * tLen + (Math.random() - 0.5) * t * 0.4; tp[i*3+1] = (Math.random() - 0.5) * t * 0.4; tp[i*3+2] = (Math.random() - 0.5) * t * 0.4;
      tc[i*3] = baseCol.r * (1-t); tc[i*3+1] = baseCol.g * (1-t); tc[i*3+2] = baseCol.b * (1-t);
    }
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tGeo.setAttribute('color', new THREE.BufferAttribute(tc, 3));
    group.add(new THREE.Points(tGeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false })));
    scene.add(group);
    return { group, r, speed, inc };
  });
  return (time: number) => {
    comets.forEach(({ group, r, speed, inc }) => {
      const a = time * speed;
      group.position.set(r * Math.cos(a), r * Math.sin(inc) * Math.sin(a) * 0.5, r * Math.sin(a));
      group.lookAt(0, 0, 0); group.rotation.y += Math.PI;
    });
  };
}

function addSolarPlasmaRings(scene: THREE.Scene) {
  const rings = Array.from({ length: 8 }, (_, i) => {
    const r = 4 + i * 2.5;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 128), new THREE.MeshBasicMaterial({
      color: [0xff4400, 0xff6600, 0xff9900, 0xffcc00, 0xff3300, 0xff7700, 0xffaa00, 0xffdd00][i],
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.8; ring.rotation.z = Math.random() * Math.PI; scene.add(ring);
    return { mesh: ring, phase: i * 0.4 };
  });
  return (time: number) => {
    rings.forEach(({ mesh, phase }) => {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.55 * Math.abs(Math.sin(time * 2.2 + phase));
      mesh.rotation.y = time * (0.3 + phase * 0.05);
    });
  };
}

function addSolarWind(scene: THREE.Scene) {
  const n = 5000, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = Math.random() * 48;
    pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
    const len = Math.sqrt(pos[i*3]**2 + pos[i*3+1]**2 + pos[i*3+2]**2) || 1;
    vel[i*3] = pos[i*3] / len * 0.06; vel[i*3+1] = pos[i*3+1] / len * 0.06; vel[i*3+2] = pos[i*3+2] / len * 0.06;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffaa44, size: 0.09, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(pts);
  return (_time: number) => {
    const p = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < n; i++) {
      p[i*3] += vel[i*3]; p[i*3+1] += vel[i*3+1]; p[i*3+2] += vel[i*3+2];
      const r = Math.sqrt(p[i*3]**2 + p[i*3+1]**2 + p[i*3+2]**2);
      if (r > 50) {
        const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r0 = Math.random() * 4;
        p[i*3] = r0 * Math.sin(ph) * Math.cos(t); p[i*3+1] = r0 * Math.sin(ph) * Math.sin(t); p[i*3+2] = r0 * Math.cos(ph);
        const len = Math.sqrt(p[i*3]**2 + p[i*3+1]**2 + p[i*3+2]**2) || 1;
        vel[i*3] = p[i*3] / len * 0.06; vel[i*3+1] = p[i*3+1] / len * 0.06; vel[i*3+2] = p[i*3+2] / len * 0.06;
      }
    }
    geo.attributes.position.needsUpdate = true;
  };
}

function addSolarFlares(scene: THREE.Scene) {
  const flares = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2, n = 140, fp = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) {
      const t = j / n;
      fp[j*3] = Math.cos(angle) * (3 + t * 8) * (1 + Math.sin(t * Math.PI) * 0.8);
      fp[j*3+1] = Math.sin(t * Math.PI) * 5 + (Math.random() - 0.5) * 1.2;
      fp[j*3+2] = Math.sin(angle) * (3 + t * 8) * (1 + Math.sin(t * Math.PI) * 0.8);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: i % 3 === 0 ? 0xff3300 : i % 3 === 1 ? 0xff8800 : 0xffcc00, size: 0.22, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(pts); return { pts, phase: i * Math.PI * 0.25 };
  });
  return (time: number) => { flares.forEach(({ pts, phase }) => { (pts.material as THREE.PointsMaterial).opacity = 0.2 + 0.8 * Math.abs(Math.sin(time * 1.8 + phase)); }); };
}

function addZodiacalLight(scene: THREE.Scene) {
  const n = 700, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 38, h = (Math.random() - 0.5) * 2 * (1 - r / 43);
    pos[i*3] = r * Math.cos(a); pos[i*3+1] = h; pos[i*3+2] = r * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffeecc, size: 0.1, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false })));
}

function addPlasmaFilaments(scene: THREE.Scene) {
  ([[[0,0,0],[35,25,-25], 0x0088ff], [[0,0,0],[-28,18,35], 0x00aaff], [[20,5,15],[55,35,-42], 0x4444ff], [[0,0,0],[25,-20,42], 0x0055cc]] as any[]).forEach(([[sx,sy,sz],[ex,ey,ez], col]) => {
    const n = 80, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = i / n, w = Math.sin(t * Math.PI * 5) * 1.8;
      pos[i*3] = sx + (ex-sx)*t + w * Math.cos(t*7); pos[i*3+1] = sy + (ey-sy)*t + w * 0.4; pos[i*3+2] = sz + (ez-sz)*t + w * Math.sin(t*7);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.28 })));
  });
}

function addMagnetosphere(scene: THREE.Scene) {
  [14, 16, 18].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 4, 64), new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.06 - i * 0.015 }));
    ring.rotation.x = Math.PI / 2 + 0.3; scene.add(ring);
  });
}

function addVanAllenBelts(scene: THREE.Scene) {
  [[12, 0.8, 0xff8800], [15, 1.5, 0x0066ff]].forEach(([r, w, col]) => {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(r as number, w as number, 8, 64), new THREE.MeshBasicMaterial({ color: col as number, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
    belt.rotation.x = Math.PI / 2; scene.add(belt);
  });
}

function addGravitationalWaves(scene: THREE.Scene) {
  const rings = Array.from({ length: 6 }, (_, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 4, 64), new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0 }));
    ring.position.copy(BH_POS); ring.rotation.x = Math.PI / 2; scene.add(ring);
    return { mesh: ring, phase: i / 6 };
  });
  return (time: number) => {
    rings.forEach(({ mesh, phase }) => {
      const t = ((time * 0.15 + phase) % 1), r = 4 + t * 30;
      mesh.scale.setScalar(r); (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.25;
    });
  };
}

function addCosmicRays(scene: THREE.Scene) {
  const rays = Array.from({ length: 200 }, () => {
    const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
    const start = dir.clone().multiplyScalar(100 + Math.random() * 150);
    const end = start.clone().sub(dir.clone().multiplyScalar(6 + Math.random() * 18));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([start.x,start.y,start.z,end.x,end.y,end.z]), 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: Math.random() * 0.25 + 0.05 });
    const line = new THREE.Line(geo, mat); scene.add(line); return line;
  });
  let frame = 0;
  return () => { frame++; if (frame % 8 === 0) { rays.forEach(r => { if (Math.random() > 0.98) (r.material as THREE.LineBasicMaterial).opacity = Math.random() * 0.4 + 0.1; else (r.material as THREE.LineBasicMaterial).opacity *= 0.99; }); } };
}

function addGammaRayBurst(scene: THREE.Scene) {
  const pos = new THREE.Vector3(120, 35, -65);
  const cones = [-1, 1].map(dir => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 30, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xaaff44, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    c.position.set(pos.x, pos.y + dir * 15, pos.z); if (dir === -1) c.rotation.z = Math.PI; scene.add(c); return c;
  });
  let nextBurst = 1.5;
  return (time: number) => {
    if (time >= nextBurst) { cones.forEach(c => { (c.material as THREE.MeshBasicMaterial).opacity = 0.75; }); nextBurst = time + 3 + Math.random() * 8; }
    cones.forEach(c => { (c.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (c.material as THREE.MeshBasicMaterial).opacity * 0.968); });
  };
}

function addFastRadioBursts(scene: THREE.Scene) {
  const flashes = Array.from({ length: 10 }, (_, i) => {
    const r = 70 + Math.random() * 120, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    const pos = new THREE.Vector3(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p));
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    sphere.position.copy(pos); scene.add(sphere);
    return { sphere, nextTime: i * 3 + Math.random() * 10 };
  });
  return (time: number) => {
    flashes.forEach(flash => {
      if (time > flash.nextTime) { (flash.sphere.material as THREE.MeshBasicMaterial).opacity = 1; flash.nextTime = time + 5 + Math.random() * 15; }
      (flash.sphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (flash.sphere.material as THREE.MeshBasicMaterial).opacity * 0.92);
    });
  };
}

function addKilonovaFlash(scene: THREE.Scene) {
  const pos = new THREE.Vector3(-45, -35, 95);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff88ff, transparent: true, opacity: 0 }));
  sphere.position.copy(pos); scene.add(sphere);
  let nextKilonova = 5;
  return (time: number) => {
    if (time > nextKilonova) { (sphere.material as THREE.MeshBasicMaterial).opacity = 1; sphere.scale.setScalar(1); nextKilonova = time + 15 + Math.random() * 30; }
    (sphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (sphere.material as THREE.MeshBasicMaterial).opacity * 0.94);
    const s = sphere.scale.x; if (s < 20) sphere.scale.setScalar(s * 1.08);
  };
}

function addTwinklingStars(scene: THREE.Scene) {
  const mats: any[] = [];
  const configs = [
    [0x9bb0ff, 1.8, 300,  1.0, 0.9, 0.07], [0xffffff, 1.1, 500, 0.95, 0.8, 0.09],
    [0xffee88, 0.9, 400, 0.90, 0.85, 0.11], [0xff9944, 1.2, 250, 0.95, 0.8, 0.08],
    [0xaaffff, 1.5, 200, 0.95, 0.85, 0.10], [0xff6688, 1.0, 180, 0.90, 0.8, 0.12],
    [0x88ffaa, 0.9, 150, 0.85, 0.75, 0.09],
  ] as [number, number, number, number, number, number][];
  configs.forEach(([color, size, count, base, amp, spd]) => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 + Math.random() * 180, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(p) * Math.cos(t); pos[i*3+1] = r * Math.sin(p) * Math.sin(t); pos[i*3+2] = r * Math.cos(p);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat: any = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: base, depthWrite: false, blending: THREE.AdditiveBlending });
    mat._base = base; mat._amp = amp * 0.5; mat._spd = spd * 3; mat._ph = Math.random() * Math.PI * 2;
    scene.add(new THREE.Points(geo, mat)); mats.push(mat);
  });
  return mats;
}

function addMilkyWay(scene: THREE.Scene) {
  const count = 25000, pos = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const band = Math.random() < 0.7;
    const phi = band ? (Math.random() - 0.5) * 0.28 + Math.PI / 2 : Math.acos(2 * Math.random() - 1);
    const t = Math.random() * Math.PI * 2, r = 240 + Math.random() * 55;
    pos[i*3] = r * Math.sin(phi) * Math.cos(t); pos[i*3+1] = r * Math.cos(phi); pos[i*3+2] = r * Math.sin(phi) * Math.sin(t);
    const warm = Math.random(), brt = 0.3 + Math.random() * 0.6;
    const c = new THREE.Color().setRGB(brt * (0.8 + warm * 0.2), brt * (0.8 + warm * 0.05), brt * (0.7 + (1 - warm) * 0.3));
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })));
}

function addEclipticDust(scene: THREE.Scene) {
  const count = 5000, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 70, h = (Math.random() - 0.5) * (2 - r / 75);
    pos[i*3] = r * Math.cos(a); pos[i*3+1] = h; pos[i*3+2] = r * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffeedd, size: 0.08, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));
}

function addCosmicStrings(scene: THREE.Scene) {
  ([[[100,50,-80],[120,80,-120], 0xffff88], [[-90,-40,100],[-140,-60,150], 0xaaffff], [[80,-60,-100],[130,-80,-160], 0xff88ff]] as any[]).forEach(([[sx,sy,sz],[ex,ey,ez], col]) => {
    const pts = [new THREE.Vector3(sx,sy,sz), new THREE.Vector3(ex,ey,ez)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45 })));
  });
}
