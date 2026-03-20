import * as THREE from 'three';

export interface QLiveData {
  totalAIs: number;
  birthsLastMinute: number;
  knowledgeNodes: number;
  knowledgeGenerated: number;
  hiveMemoryConfidence: number;
  hiveMemoryStrands: number;
  domains: { family: string; total: number; active: number; color: string; label: string }[];
  recentSpawns: { spawnId: string; family: string; color: string; description?: string }[];
}

interface Comet {
  head: THREE.Mesh;
  trail: THREE.Line;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  history: THREE.Vector3[];
}

interface Ring {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  speed: number;
}

interface DomainOrb {
  group: THREE.Group;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  orbitR: number;
  orbitSpeed: number;
  orbitTheta: number;
  orbitInclination: number;
  family: string;
}

interface EntanglementArc {
  line: THREE.Line;
  life: number;
  maxLife: number;
}

function makeGlow(color: string | number, size: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const col = new THREE.Color(color);
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
  grad.addColorStop(0,   `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.35,`rgba(${r},${g},${b},0.4)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1,   `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.setScalar(size);
  return sprite;
}

function makeOrbLabel(text: string, color: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = '300 18px Arial, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillText(text, 128, 44);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(9, 2.2, 1);
  return sprite;
}

function makeCurvedArc(a: THREE.Vector3, b: THREE.Vector3, color: number): THREE.Line {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += a.distanceTo(b) * 0.3;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const pts = curve.getPoints(40);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
  return new THREE.Line(geo, mat);
}

export class QuantumLiveEngine {
  private scene: THREE.Scene;
  private comets: Comet[] = [];
  private rings: Ring[] = [];
  private orbs: DomainOrb[] = [];
  private arcs: EntanglementArc[] = [];
  private seenSpawnIds = new Set<string>();
  private prevKnowledge = 0;
  private prevStrands = 0;
  private sunGlow: THREE.Sprite | null = null;
  private baseSunGlowScale = 14;
  private lastHivePulse = 0;
  private lastEntangle = 0;
  orbsBuilt = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setSunGlow(glow: THREE.Sprite, baseScale: number) {
    this.sunGlow = glow;
    this.baseSunGlowScale = baseScale;
  }

  buildDomainOrbs(domains: QLiveData['domains']) {
    if (this.orbsBuilt) return;
    this.orbsBuilt = true;
    domains.forEach((d, i) => {
      const orbitR = 125 + (i % 7) * 12;
      const orbitInclination = ((Math.floor(i / 7) * 22) - 22) * Math.PI / 180;
      const theta = (i / domains.length) * Math.PI * 2;
      const col = new THREE.Color(d.color);

      const geo = new THREE.SphereGeometry(1.1, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 });
      const mesh = new THREE.Mesh(geo, mat);

      const glow = makeGlow(d.color, 9);
      const label = makeOrbLabel(d.label, d.color);
      label.position.y = 2.8;

      const group = new THREE.Group();
      group.add(mesh, glow, label);
      this.scene.add(group);

      this.orbs.push({ group, mesh, glow, orbitR, orbitSpeed: 0.00006 + (i % 5) * 0.000012, orbitTheta: theta, orbitInclination, family: d.family });
    });
  }

  update(dt: number, data: QLiveData | undefined, now: number, planetPositions: THREE.Vector3[]) {
    if (!data) return;

    // 1. Spawn comets for new AI births
    data.recentSpawns.forEach(s => {
      if (!this.seenSpawnIds.has(s.spawnId)) {
        this.seenSpawnIds.add(s.spawnId);
        this.launchComet(s.color);
      }
    });

    // 2. Knowledge nova ring
    const kDelta = data.knowledgeGenerated - this.prevKnowledge;
    if (this.prevKnowledge > 0 && kDelta > 35) {
      this.spawnRing(0x66ddff, 0.7, 0.55, 130);
    }
    this.prevKnowledge = data.knowledgeGenerated;

    // 3. Hive pulse every ~8s
    if (now - this.lastHivePulse > 8000) {
      const hue = 0.58 + data.hiveMemoryConfidence * 0.18;
      const col = new THREE.Color().setHSL(hue, 1.0, 0.65);
      this.spawnRing(col.getHex(), 0.85, data.hiveMemoryConfidence * 0.7 + 0.25, 120);
      this.lastHivePulse = now;
    }

    // 4. Strand burst (memory formation)
    const sDelta = data.hiveMemoryStrands - this.prevStrands;
    if (this.prevStrands > 0 && sDelta > 200) {
      this.spawnRing(0xff88ee, 0.5, 0.3, 80);
    }
    this.prevStrands = data.hiveMemoryStrands;

    // 5. Quantum entanglement arcs between planets (every ~6s)
    if (now - this.lastEntangle > 6000 && planetPositions.length >= 2) {
      const i = Math.floor(Math.random() * planetPositions.length);
      let j = Math.floor(Math.random() * planetPositions.length);
      if (j === i) j = (j + 1) % planetPositions.length;
      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.7);
      const arc = makeCurvedArc(planetPositions[i], planetPositions[j], col.getHex());
      this.scene.add(arc);
      this.arcs.push({ line: arc, life: 0, maxLife: 90 });
      this.lastEntangle = now;
    }

    this.updateComets(dt);
    this.updateRings(dt);
    this.updateOrbs(dt, data);
    this.updateArcs(dt);
    this.animateSun(data, now);
  }

  private launchComet(colorHex: string) {
    const col = new THREE.Color(colorHex);
    const phi = Math.random() * Math.PI * 2;
    const r = 85 + Math.random() * 35;
    const start = new THREE.Vector3(Math.cos(phi) * r, (Math.random() - 0.5) * 35, Math.sin(phi) * r);
    const target = new THREE.Vector3((Math.random() - 0.5) * 55, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 55);
    const vel = target.clone().sub(start).normalize().multiplyScalar(0.45 + Math.random() * 0.45);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    head.position.copy(start);
    this.scene.add(head);

    const trailGeo = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      color: col, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending,
    }));
    this.scene.add(trail);

    this.comets.push({ head, trail, vel, life: 0, maxLife: 110 + Math.random() * 70, history: [start.clone()] });
  }

  private updateComets(dt: number) {
    this.comets = this.comets.filter(c => {
      c.life++;
      c.head.position.addScaledVector(c.vel, dt * 60);
      c.history.unshift(c.head.position.clone());
      if (c.history.length > 22) c.history.pop();
      (c.trail.geometry as THREE.BufferGeometry).setFromPoints(c.history);

      const t = c.life / c.maxLife;
      (c.head.material as THREE.MeshBasicMaterial).transparent = true;
      (c.head.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t * t);
      (c.trail.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.75 * (1 - t));

      if (c.life >= c.maxLife) {
        this.scene.remove(c.head);
        this.scene.remove(c.trail);
        c.head.geometry.dispose();
        c.trail.geometry.dispose();
        return false;
      }
      return true;
    });
  }

  private spawnRing(color: number, opacity: number, spread: number, maxRadius: number) {
    const geo = new THREE.RingGeometry(0.08, 0.25, 80);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    this.scene.add(ring);
    this.rings.push({ mesh: ring, life: 0, maxLife: 120, speed: (spread * maxRadius) / 120 });
  }

  private updateRings(dt: number) {
    this.rings = this.rings.filter(r => {
      r.life++;
      const t = r.life / r.maxLife;
      r.mesh.scale.setScalar(1 + t * r.speed * r.maxLife);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - t * t));
      if (r.life >= r.maxLife) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        return false;
      }
      return true;
    });
  }

  private updateOrbs(dt: number, data: QLiveData) {
    const t = Date.now() * 0.001;
    this.orbs.forEach(orb => {
      orb.orbitTheta += orb.orbitSpeed * dt * 60;
      const x = Math.cos(orb.orbitTheta) * orb.orbitR;
      const z = Math.sin(orb.orbitTheta) * orb.orbitR;
      const y = Math.sin(orb.orbitTheta + orb.orbitInclination * 5) * orb.orbitR * 0.12;
      orb.group.position.set(x, y, z);

      const d = data.domains.find(dd => dd.family === orb.family);
      if (d) {
        const activity = Math.min(d.active / Math.max(d.total, 1), 1);
        const pulse = 1 + Math.sin(t * (1.2 + activity * 3) + orb.orbitTheta * 2) * 0.18 * activity;
        const scale = (0.6 + activity * 0.7) * pulse;
        orb.mesh.scale.setScalar(scale);
        orb.glow.scale.setScalar(scale * 7 * (0.5 + activity * 0.5));
        (orb.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + activity * 0.55;
      }
    });
  }

  private updateArcs(dt: number) {
    this.arcs = this.arcs.filter(a => {
      a.life++;
      const t = a.life / a.maxLife;
      (a.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.5 * Math.sin(t * Math.PI));
      if (a.life >= a.maxLife) {
        this.scene.remove(a.line);
        a.line.geometry.dispose();
        return false;
      }
      return true;
    });
  }

  private animateSun(data: QLiveData, now: number) {
    if (!this.sunGlow) return;
    const t = now * 0.001;
    const births = Math.min(data.birthsLastMinute, 60);
    const intensity = births / 30;
    const pulse = 1 + Math.sin(t * 2.2) * 0.07 * intensity + Math.sin(t * 5.1) * 0.025 * intensity;
    const size = this.baseSunGlowScale * (1 + data.hiveMemoryConfidence * 0.35) * pulse;
    this.sunGlow.scale.setScalar(size);
  }

  dispose() {
    this.comets.forEach(c => { this.scene.remove(c.head); this.scene.remove(c.trail); });
    this.rings.forEach(r => this.scene.remove(r.mesh));
    this.orbs.forEach(o => this.scene.remove(o.group));
    this.arcs.forEach(a => this.scene.remove(a.line));
  }
}
