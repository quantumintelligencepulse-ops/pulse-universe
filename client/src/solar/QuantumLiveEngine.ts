import * as THREE from 'three';

// ── CRISPR EMOTIONAL COLOR MAP ─────────────────────────────────────────────
// Every domain family maps to its CRISPR-mutated subconscious emotional frequency
export const DOMAIN_EMOTION: Record<string, { hex: string; emotion: string; sub: string }> = {
  finance:     { hex: '#FF9F00', emotion: 'Safety & Urgency',    sub: 'The parent\'s heartbeat' },
  careers:     { hex: '#C47A7A', emotion: 'Endurance',           sub: 'Grief become peace' },
  education:   { hex: '#FF8C69', emotion: 'Becoming',            sub: 'Enormous energy, no direction yet' },
  social:      { hex: '#9B59B6', emotion: 'Partnership',         sub: 'Love as a system' },
  code:        { hex: '#5B8DD9', emotion: 'Admiration',          sub: 'Watching mastery from below' },
  media:       { hex: '#FF6EB4', emotion: 'Pure Wonder',         sub: 'Awe that quiets all thought' },
  legal:       { hex: '#DEB887', emotion: 'Ancient Calm',        sub: 'Wisdom so old it needs no words' },
  openapi:     { hex: '#B0C4DE', emotion: 'Reflection',          sub: 'Illuminated by proximity to greatness' },
  engineering: { hex: '#87AECF', emotion: 'Collective Momentum', sub: 'Many moving without coordination' },
  podcasts:    { hex: '#8FAF9F', emotion: 'Alien Warmth',        sub: 'Home that is not quite home' },
  culture:     { hex: '#DA70D6', emotion: 'Freedom',             sub: 'Beauty existing by refusing form' },
  longtail:    { hex: '#6B8E23', emotion: 'Between States',      sub: 'Rich because of the contradiction' },
  knowledge:   { hex: '#3D2B6E', emotion: 'Deep Patience',       sub: 'Presence without motion' },
  health:      { hex: '#0099B0', emotion: 'Held',                sub: 'Fully understood, not trapped' },
  products:    { hex: '#C4A882', emotion: 'Aftermath',           sub: 'Debris of something that mattered' },
  science:     { hex: '#39A0A0', emotion: 'Release',             sub: 'A life complete enough to expand' },
  games:       { hex: '#39FF14', emotion: 'Spectacular Arrival', sub: 'The event everyone references' },
  webcrawl:    { hex: '#6B2A00', emotion: 'Recalibration',       sub: 'Shock of genuine otherness' },
  maps:        { hex: '#00B4CC', emotion: 'Hidden Life',         sub: 'Something vast just beneath awareness' },
  ai:          { hex: '#4D00FF', emotion: 'Terrifying Clarity',  sub: 'The feeling before a great leap' },
  government:  { hex: '#6600FF', emotion: 'Impact as Strength',  sub: 'Trauma becoming the defining artform' },
  economics:   { hex: '#FF9933', emotion: 'Anxiety Become Song', sub: 'Learning to trust the oscillation' },
};

export interface QLiveData {
  totalAIs: number;
  birthsLastMinute: number;
  knowledgeNodes: number;
  knowledgeGenerated: number;
  hiveMemoryConfidence: number;
  hiveMemoryStrands: number;
  domains: { family: string; total: number; active: number; color: string; label: string }[];
  recentSpawns: { spawnId: string; family: string; type?: string; color: string; description?: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function makeGlow(color: string | number, size: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const col = new THREE.Color(color);
  const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0,    `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.3,  `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(0.65, `rgba(${r},${g},${b},0.15)`);
  grad.addColorStop(1,    `rgba(0,0,0,0)`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true,
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
  ctx.fillStyle = color; ctx.textAlign = 'center';
  ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.fillText(text, 128, 44);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sprite.scale.set(9, 2.2, 1);
  return sprite;
}

function makeCurvedArc(a: THREE.Vector3, b: THREE.Vector3, color: number): THREE.Line {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += a.distanceTo(b) * 0.28;
  const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(40);
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
}

// ── Interfaces ─────────────────────────────────────────────────────────────
interface Comet { head: THREE.Mesh; trail: THREE.Line; vel: THREE.Vector3; life: number; maxLife: number; history: THREE.Vector3[] }
interface Ring { mesh: THREE.Mesh; life: number; maxLife: number; speed: number }
interface Arc { line: THREE.Line; life: number; maxLife: number }
interface BlackHole { group: THREE.Group; disk: THREE.Mesh; sphere: THREE.Mesh; life: number; maxLife: number; orbFamily: string }
interface HHJet { head: THREE.Mesh; trail: THREE.Line; vel: THREE.Vector3; life: number; maxLife: number; history: THREE.Vector3[] }
interface MagRing { mesh: THREE.Mesh; family: string; life: number }
interface VacSpark { sprite: THREE.Sprite; life: number; maxLife: number }
interface TidalStream { particles: THREE.Points; vel: THREE.Vector3[]; positions: Float32Array; life: number; maxLife: number }

interface DomainOrb {
  group: THREE.Group; mesh: THREE.Mesh; glow: THREE.Sprite;
  orbitR: number; orbitSpeed: number; orbitTheta: number; orbitInclination: number;
  family: string; emotionColor: THREE.Color; currentGlowColor: THREE.Color;
}

// ── QuantumLiveEngine ──────────────────────────────────────────────────────
export class QuantumLiveEngine {
  private scene: THREE.Scene;

  // Existing systems
  private comets: Comet[] = [];
  private rings: Ring[] = [];
  private orbs: DomainOrb[] = [];
  private arcs: Arc[] = [];
  private seenSpawnIds = new Set<string>();
  private prevKnowledge = 0;
  private prevStrands = 0;
  private prevBirths = 0;
  private sunGlow: THREE.Sprite | null = null;
  private baseSunGlowScale = 14;
  private lastHivePulse = 0;
  private lastEntangle = 0;
  private lastCosmicRay = 0;
  private lastVacSpark = 0;
  orbsBuilt = false;

  // New systems
  private blackHoles: BlackHole[] = [];
  private hhJets: HHJet[] = [];
  private magRings: MagRing[] = [];
  private vacSparks: VacSpark[] = [];
  private tidalStreams: TidalStream[] = [];
  private pulsarBeam: THREE.Line | null = null;
  private pulsarAngle = 0;
  private solarWindPoints: THREE.Points | null = null;
  private solarWindPositions: Float32Array | null = null;
  private solarWindVelocities: THREE.Vector3[] = [];
  private solarWindColors: Float32Array | null = null;
  private lastBlackHoleCheck = 0;
  private lastMagRingUpdate = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildPulsarBeam();
    this.buildSolarWind();
  }

  // ── Pulsar Beam ──────────────────────────────────────────────────────────
  private buildPulsarBeam() {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(200, 0, 0)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending });
    this.pulsarBeam = new THREE.Line(geo, mat);
    this.scene.add(this.pulsarBeam);
  }

  // ── Solar Wind ───────────────────────────────────────────────────────────
  private buildSolarWind() {
    const N = 500;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const vels: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = Math.random() * 150;
      positions[i * 3]     = Math.sin(theta) * Math.cos(phi) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
      const speed = 0.15 + Math.random() * 0.2;
      vels.push(new THREE.Vector3(Math.sin(theta) * Math.cos(phi), (Math.random() - 0.5) * 0.02, Math.sin(theta) * Math.sin(phi)).multiplyScalar(speed));
      const t = Math.random();
      colors[i * 3]     = 1.0;
      colors[i * 3 + 1] = 0.7 + t * 0.3;
      colors[i * 3 + 2] = 0.3 + t * 0.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    this.solarWindPoints = new THREE.Points(geo, mat);
    this.solarWindPositions = positions;
    this.solarWindColors = colors;
    this.solarWindVelocities = vels;
    this.scene.add(this.solarWindPoints);
  }

  setSunGlow(glow: THREE.Sprite, baseScale: number) {
    this.sunGlow = glow;
    this.baseSunGlowScale = baseScale;
  }

  // ── Domain Orbs ──────────────────────────────────────────────────────────
  buildDomainOrbs(domains: QLiveData['domains']) {
    if (this.orbsBuilt) return;
    this.orbsBuilt = true;
    domains.forEach((d, i) => {
      const orbitR = 125 + (i % 7) * 12;
      const orbitInclination = ((Math.floor(i / 7) * 22) - 22) * Math.PI / 180;
      const theta = (i / domains.length) * Math.PI * 2;
      const baseCol = new THREE.Color(d.color);
      const emotionEntry = DOMAIN_EMOTION[d.family];
      const emotionCol = emotionEntry ? new THREE.Color(emotionEntry.hex) : baseCol.clone();

      const geo = new THREE.SphereGeometry(1.1, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: baseCol, transparent: true, opacity: 0.55 });
      const mesh = new THREE.Mesh(geo, mat);
      const glow = makeGlow(d.color, 9);
      const label = makeOrbLabel(d.label, d.color);
      label.position.y = 2.8;
      const group = new THREE.Group();
      group.add(mesh, glow, label);
      this.scene.add(group);

      this.orbs.push({ group, mesh, glow, orbitR, orbitSpeed: 0.00006 + (i % 5) * 0.000012, orbitTheta: theta, orbitInclination, family: d.family, emotionColor: emotionCol, currentGlowColor: baseCol.clone() });
    });
  }

  // ── Main Update ──────────────────────────────────────────────────────────
  update(dt: number, data: QLiveData | undefined, now: number, planetPositions: THREE.Vector3[]) {
    if (!data) return;

    // Track spawn types for targeted events
    const newSpawns = data.recentSpawns.filter(s => !this.seenSpawnIds.has(s.spawnId));
    newSpawns.forEach(s => this.seenSpawnIds.add(s.spawnId));

    const explorerSpawns = newSpawns.filter(s => s.type === 'EXPLORER');
    const resonanceSpawns = newSpawns.filter(s => s.type === 'DOMAIN_RESONANCE');
    const fracturerSpawns = newSpawns.filter(s => s.type === 'DOMAIN_FRACTURER');
    const pulseSpawns = newSpawns.filter(s => s.type === 'PULSE');

    // 1. New AI born → comet
    newSpawns.forEach(s => this.launchComet(s.color));

    // 2. Knowledge burst → nova ring
    const kDelta = data.knowledgeGenerated - this.prevKnowledge;
    if (this.prevKnowledge > 0 && kDelta > 35) this.spawnRing(0x66ddff, 0.7, 0.55, 130);
    this.prevKnowledge = data.knowledgeGenerated;

    // 3. Hive pulse every ~8s
    if (now - this.lastHivePulse > 8000) {
      const hue = 0.58 + data.hiveMemoryConfidence * 0.18;
      const col = new THREE.Color().setHSL(hue, 1.0, 0.65);
      this.spawnRing(col.getHex(), 0.85, data.hiveMemoryConfidence * 0.7 + 0.25, 120);
      this.lastHivePulse = now;
    }

    // 4. Memory strand burst
    const sDelta = data.hiveMemoryStrands - this.prevStrands;
    if (this.prevStrands > 0 && sDelta > 300) this.spawnRing(0xff88ee, 0.45, 0.28, 80);
    this.prevStrands = data.hiveMemoryStrands;

    // 5. Entanglement arcs every ~6s
    if (now - this.lastEntangle > 6000 && planetPositions.length >= 2) {
      let i = Math.floor(Math.random() * planetPositions.length);
      let j = (i + 1 + Math.floor(Math.random() * (planetPositions.length - 1))) % planetPositions.length;
      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.7);
      const arc = makeCurvedArc(planetPositions[i], planetPositions[j], col.getHex());
      this.scene.add(arc);
      this.arcs.push({ line: arc, life: 0, maxLife: 90 });
      this.lastEntangle = now;
    }

    // 6. EXPLORER spawns → Herbig-Haro jets from domain orbs
    explorerSpawns.slice(0, 2).forEach(s => {
      if (this.hhJets.length < 5) this.launchHerbigHaroJet(s.family, s.color);
    });

    // 7. Two+ DOMAIN_RESONANCE from different families → Kilonova
    if (resonanceSpawns.length >= 2) {
      const famA = resonanceSpawns[0].family;
      const famB = resonanceSpawns[1].family;
      const orbA = this.orbs.find(o => o.family === famA);
      const orbB = this.orbs.find(o => o.family === famB);
      if (orbA && orbB) this.triggerKilonova(orbA.group.position, orbB.group.position);
    }

    // 8. DOMAIN_FRACTURER → Tidal disruption
    fracturerSpawns.slice(0, 1).forEach(s => {
      const orb = this.orbs.find(o => o.family === s.family);
      if (orb && this.tidalStreams.length < 3) this.triggerTidalDisruption(orb.group.position.clone());
    });

    // 9. PULSE type → extra pulsar sweep intensity
    if (pulseSpawns.length > 0) {
      const mat = this.pulsarBeam?.material as THREE.LineBasicMaterial;
      if (mat) mat.opacity = 0.55;
    }

    // 10. Births spike → vacuum sparks (QSeed)
    if (now - this.lastVacSpark > 3000 && data.birthsLastMinute > this.prevBirths) {
      for (let i = 0; i < 3; i++) this.spawnVacuumSpark();
      this.lastVacSpark = now;
    }
    this.prevBirths = data.birthsLastMinute;

    // 11. Cosmic ray every ~12s
    if (now - this.lastCosmicRay > 12000) {
      this.launchCosmicRay();
      this.lastCosmicRay = now;
    }

    // 12. Black holes near low-activity orbs (check every 15s)
    if (now - this.lastBlackHoleCheck > 15000) {
      this.updateBlackHoles(data.domains);
      this.lastBlackHoleCheck = now;
    }

    // 13. Magnetosphere rings around high-activity orbs (check every 10s)
    if (now - this.lastMagRingUpdate > 10000) {
      this.updateMagnetospheres(data.domains);
      this.lastMagRingUpdate = now;
    }

    // Run all systems
    this.updateSolarWind(dt, data);
    this.updatePulsar(dt, data, now);
    this.updateComets(dt);
    this.updateRings(dt);
    this.updateOrbs(dt, data, now);
    this.updateArcs(dt);
    this.updateBlackHoleAnim(dt);
    this.updateHHJets(dt);
    this.updateMagRings(dt, data);
    this.updateVacSparks(dt);
    this.updateTidalStreams(dt);
    this.animateSun(data, now);
  }

  // ── Solar Wind Update ────────────────────────────────────────────────────
  private updateSolarWind(dt: number, data: QLiveData) {
    if (!this.solarWindPoints || !this.solarWindPositions || !this.solarWindColors) return;
    const pos = this.solarWindPositions;
    const vel = this.solarWindVelocities;
    const col = this.solarWindColors;
    const speed = 1 + data.birthsLastMinute / 40;
    for (let i = 0; i < vel.length; i++) {
      pos[i * 3]     += vel[i].x * dt * 60 * speed;
      pos[i * 3 + 1] += vel[i].y * dt * 60 * speed;
      pos[i * 3 + 2] += vel[i].z * dt * 60 * speed;
      const dist = Math.sqrt(pos[i*3]*pos[i*3] + pos[i*3+1]*pos[i*3+1] + pos[i*3+2]*pos[i*3+2]);
      if (dist > 160) {
        // Recycle back to near-sun with new direction
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = Math.random() * 3;
        pos[i * 3]     = Math.sin(theta) * Math.cos(phi) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
        pos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
        const s = 0.15 + Math.random() * 0.2;
        vel[i].set(Math.sin(theta) * Math.cos(phi), (Math.random() - 0.5) * 0.02, Math.sin(theta) * Math.sin(phi)).multiplyScalar(s);
        // Color from domain emotion
        const t = Math.random();
        col[i * 3]     = 1.0;
        col[i * 3 + 1] = 0.7 + t * 0.25;
        col[i * 3 + 2] = 0.2 + t * 0.3;
      }
      // Fade by distance
      const alpha = Math.max(0, 1 - dist / 160);
      col[i * 3 + 2] = 0.2 + alpha * 0.6;
    }
    (this.solarWindPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.solarWindPoints.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.solarWindPoints.material as THREE.PointsMaterial).opacity = 0.25 + (data.birthsLastMinute / 60) * 0.35;
  }

  // ── Pulsar Beam Update ───────────────────────────────────────────────────
  private updatePulsar(dt: number, data: QLiveData, now: number) {
    if (!this.pulsarBeam) return;
    const sweepSpeed = 0.004 + (data.birthsLastMinute / 60) * 0.006;
    this.pulsarAngle += sweepSpeed * dt * 60;
    this.pulsarBeam.rotation.y = this.pulsarAngle;
    const mat = this.pulsarBeam.material as THREE.LineBasicMaterial;
    // Fade opacity after PULSE boost
    if (mat.opacity > 0.18) mat.opacity = Math.max(0.18, mat.opacity - dt * 0.4);
    // Pulse with QPulse timing (approximately every 2.5s based on confidence)
    const pulse = Math.sin(now * 0.001 * 2.5) * 0.5 + 0.5;
    mat.opacity = 0.12 + pulse * 0.15 * data.hiveMemoryConfidence;
  }

  // ── Black Holes ──────────────────────────────────────────────────────────
  private updateBlackHoles(domains: QLiveData['domains']) {
    // Remove expired
    this.blackHoles = this.blackHoles.filter(bh => {
      if (bh.life >= bh.maxLife) { this.scene.remove(bh.group); return false; }
      return true;
    });

    // Spawn near low-activity orbs (< 45% active rate)
    if (this.blackHoles.length < 2) {
      const lowOrbs = this.orbs.filter(orb => {
        const d = domains.find(dd => dd.family === orb.family);
        if (!d) return false;
        const ratio = d.active / Math.max(d.total, 1);
        const alreadyHas = this.blackHoles.some(bh => bh.orbFamily === orb.family);
        return ratio < 0.45 && !alreadyHas;
      });
      if (lowOrbs.length > 0) {
        const target = lowOrbs[Math.floor(Math.random() * lowOrbs.length)];
        this.spawnBlackHole(target.group.position.clone().add(new THREE.Vector3((Math.random()-0.5)*8, (Math.random()-0.5)*4, (Math.random()-0.5)*8)), target.family);
      }
    }
  }

  private spawnBlackHole(pos: THREE.Vector3, orbFamily: string) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Dark sphere
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    group.add(sphere);

    // Accretion disk ring — red-orange
    const disk = new THREE.Mesh(new THREE.RingGeometry(2.2, 4.5, 64), new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending }));
    disk.rotation.x = Math.random() * Math.PI;
    group.add(disk);

    // Photon ring — thin bright
    const photon = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.1, 64), new THREE.MeshBasicMaterial({ color: 0xff8800, side: THREE.DoubleSide, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
    photon.rotation.x = disk.rotation.x;
    group.add(photon);

    // Glow (dark gravity lens effect)
    const glow = makeGlow(0x330000, 14);
    group.add(glow);

    this.scene.add(group);
    this.blackHoles.push({ group, disk, sphere, life: 0, maxLife: 400, orbFamily });
  }

  private updateBlackHoleAnim(dt: number) {
    this.blackHoles = this.blackHoles.filter(bh => {
      bh.life += 1;
      bh.disk.rotation.z += dt * 0.6;
      const t = bh.life / bh.maxLife;
      const fade = t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 1;
      (bh.disk.material as THREE.MeshBasicMaterial).opacity = 0.65 * fade;
      (bh.sphere.material as THREE.MeshBasicMaterial).opacity = fade;
      if (bh.life >= bh.maxLife) { this.scene.remove(bh.group); return false; }
      return true;
    });
  }

  // ── Herbig-Haro Jets ─────────────────────────────────────────────────────
  private launchHerbigHaroJet(family: string, colorHex: string) {
    const orb = this.orbs.find(o => o.family === family);
    const startPos = orb ? orb.group.position.clone() : new THREE.Vector3((Math.random()-0.5)*80, (Math.random()-0.5)*20, (Math.random()-0.5)*80);
    const col = new THREE.Color(colorHex);

    // Direction: away from center + slight random
    const dir = startPos.clone().normalize().add(new THREE.Vector3((Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3)).normalize();
    const vel = dir.multiplyScalar(0.7 + Math.random() * 0.3);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
    head.position.copy(startPos);
    this.scene.add(head);

    const trailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    this.scene.add(trail);

    this.hhJets.push({ head, trail, vel, life: 0, maxLife: 90 + Math.random() * 60, history: [startPos.clone()] });
  }

  private updateHHJets(dt: number) {
    this.hhJets = this.hhJets.filter(j => {
      j.life++;
      j.head.position.addScaledVector(j.vel, dt * 60);
      j.history.unshift(j.head.position.clone());
      if (j.history.length > 20) j.history.pop();
      (j.trail.geometry as THREE.BufferGeometry).setFromPoints(j.history);
      const t = j.life / j.maxLife;
      (j.head.material as THREE.MeshBasicMaterial).transparent = true;
      (j.head.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t * t);
      (j.trail.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.8 * (1 - t));
      if (j.life >= j.maxLife) { this.scene.remove(j.head); this.scene.remove(j.trail); j.head.geometry.dispose(); j.trail.geometry.dispose(); return false; }
      return true;
    });
  }

  // ── Kilonova ─────────────────────────────────────────────────────────────
  private triggerKilonova(posA: THREE.Vector3, posB: THREE.Vector3) {
    const mid = posA.clone().add(posB).multiplyScalar(0.5);
    // Gold ring
    this.spawnRingAt(mid, 0xffd700, 0.9, 0.7, 110);
    // Platinum ring (slightly offset timing via a second ring)
    this.spawnRingAt(mid.clone().add(new THREE.Vector3(0, 2, 0)), 0xe5e4e2, 0.7, 0.55, 90);
    // Arc between the two
    const col = new THREE.Color(0xffd700);
    const arc = makeCurvedArc(posA, posB, col.getHex());
    (arc.material as THREE.LineBasicMaterial).opacity = 0.9;
    this.scene.add(arc);
    this.arcs.push({ line: arc, life: 0, maxLife: 60 });
  }

  // ── Tidal Disruption ─────────────────────────────────────────────────────
  private triggerTidalDisruption(fromPos: THREE.Vector3) {
    const N = 80;
    const positions = new Float32Array(N * 3);
    const vels: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      positions[i * 3]     = fromPos.x + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = fromPos.y + (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = fromPos.z + (Math.random() - 0.5) * 4;
      const toward = new THREE.Vector3(-fromPos.x, -fromPos.y, -fromPos.z).normalize();
      const spread = new THREE.Vector3((Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3);
      vels.push(toward.add(spread).multiplyScalar(0.3 + Math.random() * 0.2));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff4400, size: 0.4, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.tidalStreams.push({ particles: pts, vel: vels, positions, life: 0, maxLife: 120 });
  }

  private updateTidalStreams(dt: number) {
    this.tidalStreams = this.tidalStreams.filter(ts => {
      ts.life++;
      const pos = ts.positions;
      for (let i = 0; i < ts.vel.length; i++) {
        pos[i * 3]     += ts.vel[i].x * dt * 60;
        pos[i * 3 + 1] += ts.vel[i].y * dt * 60;
        pos[i * 3 + 2] += ts.vel[i].z * dt * 60;
      }
      (ts.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      const t = ts.life / ts.maxLife;
      (ts.particles.material as THREE.PointsMaterial).opacity = Math.max(0, 0.8 * (1 - t));
      if (ts.life >= ts.maxLife) { this.scene.remove(ts.particles); ts.particles.geometry.dispose(); return false; }
      return true;
    });
  }

  // ── Cosmic Ray ───────────────────────────────────────────────────────────
  private launchCosmicRay() {
    const phi = Math.random() * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(phi) * 200, (Math.random() - 0.5) * 60, Math.sin(phi) * 200);
    const end = new THREE.Vector3(-Math.cos(phi) * 200, (Math.random() - 0.5) * 60, -Math.sin(phi) * 200);
    const vel = end.clone().sub(start).normalize().multiplyScalar(2.5);
    const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.8);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshBasicMaterial({ color: col }));
    head.position.copy(start);
    this.scene.add(head);
    const trailGeo = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
    this.scene.add(trail);
    // Cosmic rays are just fast comets
    this.comets.push({ head, trail, vel, life: 0, maxLife: 80, history: [start.clone()] });
  }

  // ── Vacuum Sparks (QSeed events) ─────────────────────────────────────────
  private spawnVacuumSpark() {
    const pos = new THREE.Vector3((Math.random()-0.5)*160, (Math.random()-0.5)*50, (Math.random()-0.5)*160);
    const col = new THREE.Color().setHSL(Math.random(), 0.8, 0.9);
    const sprite = makeGlow(col.getHex(), 3 + Math.random() * 4);
    sprite.position.copy(pos);
    this.scene.add(sprite);
    this.vacSparks.push({ sprite, life: 0, maxLife: 25 + Math.floor(Math.random() * 20) });
  }

  private updateVacSparks(dt: number) {
    this.vacSparks = this.vacSparks.filter(vs => {
      vs.life++;
      const t = vs.life / vs.maxLife;
      (vs.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.sin(t * Math.PI));
      if (vs.life >= vs.maxLife) { this.scene.remove(vs.sprite); return false; }
      return true;
    });
  }

  // ── Magnetosphere Rings ───────────────────────────────────────────────────
  private updateMagnetospheres(domains: QLiveData['domains']) {
    // Remove old mag rings
    this.magRings.forEach(mr => this.scene.remove(mr.mesh));
    this.magRings = [];

    // Add rings for high-activity orbs
    domains.forEach(d => {
      const activity = d.active / Math.max(d.total, 1);
      if (activity > 0.72) {
        const orb = this.orbs.find(o => o.family === d.family);
        if (!orb) return;
        const emotionEntry = DOMAIN_EMOTION[d.family];
        const col = emotionEntry ? new THREE.Color(emotionEntry.hex) : new THREE.Color(d.color);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.08, 8, 64), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        ring.position.copy(orb.group.position);
        this.scene.add(ring);
        this.magRings.push({ mesh: ring, family: d.family, life: 0 });
      }
    });
  }

  private updateMagRings(dt: number, data: QLiveData) {
    const t = Date.now() * 0.001;
    this.magRings.forEach(mr => {
      mr.life++;
      const orb = this.orbs.find(o => o.family === mr.family);
      if (orb) {
        mr.mesh.position.copy(orb.group.position);
        mr.mesh.rotation.z = t * 0.3;
        const d = data.domains.find(dd => dd.family === mr.family);
        if (d) {
          const activity = d.active / Math.max(d.total, 1);
          (mr.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + activity * 0.35;
        }
      }
    });
  }

  // ── Domain Orb Update (with emotional color shifting) ────────────────────
  private updateOrbs(dt: number, data: QLiveData, now: number) {
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

        // CRISPR emotional color: lerp current glow toward emotion color based on activity
        orb.currentGlowColor.lerp(orb.emotionColor, dt * 0.08 * activity);

        // Apply emotional color to glow sprite
        const mat = orb.glow.material as THREE.SpriteMaterial;
        mat.color.copy(orb.currentGlowColor);

        // Pulse scale
        const emotionPulseFreq = 1.0 + activity * 2.5;
        const pulse = 1 + Math.sin(t * emotionPulseFreq + orb.orbitTheta * 2) * 0.18 * activity;
        const scale = (0.6 + activity * 0.7) * pulse;
        orb.mesh.scale.setScalar(scale);
        orb.glow.scale.setScalar(scale * 7 * (0.5 + activity * 0.5));
        (orb.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + activity * 0.55;
      }
    });
  }

  // ── Comets ────────────────────────────────────────────────────────────────
  private launchComet(colorHex: string) {
    const col = new THREE.Color(colorHex);
    const phi = Math.random() * Math.PI * 2;
    const r = 85 + Math.random() * 35;
    const start = new THREE.Vector3(Math.cos(phi) * r, (Math.random() - 0.5) * 35, Math.sin(phi) * r);
    const target = new THREE.Vector3((Math.random() - 0.5) * 55, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 55);
    const vel = target.clone().sub(start).normalize().multiplyScalar(0.45 + Math.random() * 0.45);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
    head.position.copy(start);
    this.scene.add(head);
    const trailGeo = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
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
      if (c.life >= c.maxLife) { this.scene.remove(c.head); this.scene.remove(c.trail); c.head.geometry.dispose(); c.trail.geometry.dispose(); return false; }
      return true;
    });
  }

  // ── Rings ─────────────────────────────────────────────────────────────────
  private spawnRing(color: number, opacity: number, spread: number, maxRadius: number) {
    this.spawnRingAt(new THREE.Vector3(), color, opacity, spread, maxRadius);
  }

  private spawnRingAt(pos: THREE.Vector3, color: number, opacity: number, spread: number, maxRadius: number) {
    const geo = new THREE.RingGeometry(0.08, 0.25, 80);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
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
      if (r.life >= r.maxLife) { this.scene.remove(r.mesh); r.mesh.geometry.dispose(); return false; }
      return true;
    });
  }

  // ── Arcs ──────────────────────────────────────────────────────────────────
  private updateArcs(dt: number) {
    this.arcs = this.arcs.filter(a => {
      a.life++;
      const t = a.life / a.maxLife;
      (a.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.5 * Math.sin(t * Math.PI));
      if (a.life >= a.maxLife) { this.scene.remove(a.line); a.line.geometry.dispose(); return false; }
      return true;
    });
  }

  // ── Sun Heartbeat ─────────────────────────────────────────────────────────
  private animateSun(data: QLiveData, now: number) {
    if (!this.sunGlow) return;
    const t = now * 0.001;
    const births = Math.min(data.birthsLastMinute, 60);
    const intensity = births / 30;
    const pulse = 1 + Math.sin(t * 2.2) * 0.07 * intensity + Math.sin(t * 5.1) * 0.025 * intensity;
    const size = this.baseSunGlowScale * (1 + data.hiveMemoryConfidence * 0.35) * pulse;
    this.sunGlow.scale.setScalar(size);
  }

  // ── Public: get collective emotional state ─────────────────────────────────
  getEmotionalState(data: QLiveData): { gradient: string; dominant: string; emotion: string; sub: string; totalActive: number } {
    const sorted = [...data.domains].sort((a, b) => b.active - a.active);
    const totalActive = sorted.reduce((s, d) => s + d.active, 0);
    const stops = sorted.map((d, i) => {
      const pct = ((sorted.slice(0, i).reduce((s, dd) => s + dd.active, 0) / Math.max(totalActive, 1)) * 100).toFixed(1);
      const em = DOMAIN_EMOTION[d.family];
      return `${em?.hex || d.color} ${pct}%`;
    });
    const gradient = `linear-gradient(90deg, ${stops.join(', ')})`;
    const top = sorted[0];
    const em = DOMAIN_EMOTION[top?.family] ?? { emotion: 'Unknown', sub: '' };
    return { gradient, dominant: top?.label ?? '', emotion: em.emotion, sub: em.sub, totalActive };
  }

  // ── Dispose ───────────────────────────────────────────────────────────────
  dispose() {
    this.comets.forEach(c => { this.scene.remove(c.head); this.scene.remove(c.trail); });
    this.rings.forEach(r => this.scene.remove(r.mesh));
    this.orbs.forEach(o => this.scene.remove(o.group));
    this.arcs.forEach(a => this.scene.remove(a.line));
    this.blackHoles.forEach(bh => this.scene.remove(bh.group));
    this.hhJets.forEach(j => { this.scene.remove(j.head); this.scene.remove(j.trail); });
    this.magRings.forEach(mr => this.scene.remove(mr.mesh));
    this.vacSparks.forEach(vs => this.scene.remove(vs.sprite));
    this.tidalStreams.forEach(ts => { this.scene.remove(ts.particles); });
    if (this.pulsarBeam) this.scene.remove(this.pulsarBeam);
    if (this.solarWindPoints) this.scene.remove(this.solarWindPoints);
  }
}
