import { useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";
import { PLANET_DATA, MOON_DATA, MAIN_PLANETS } from "./planetData";
import { createSpaceEnvironment } from "./SpaceEnvironment";

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl"));
  } catch { return false; }
}

const TEX = 'https://www.solarsystemscope.com/textures/download';

function makeLabel(text: string, size = 26) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = `300 ${size}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(80,140,255,0.6)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, 256, 80);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

function buildOrbitLine(a: number, e = 0, opacity = 0.10, inclination = 0) {
  const b = a * Math.sqrt(1 - e * e);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    pts.push(new THREE.Vector3(a * Math.cos(t), 0, b * Math.sin(t)));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x5588ff, transparent: true, opacity })
  );
  if (inclination) line.rotation.x = inclination;
  return line;
}

function makeLensFlare() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,240,180,1)'); grad.addColorStop(0.1, 'rgba(255,210,120,0.8)');
  grad.addColorStop(0.4, 'rgba(255,140,40,0.3)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
  sprite.scale.set(18, 18, 1);
  return sprite;
}

function makeGlowSprite(color: number, size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(color);
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.6)`);
  grad.addColorStop(0.5, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.15)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sprite.scale.set(size, size, 1);
  return sprite;
}

function buildSunCorona(radius: number) {
  const group = new THREE.Group();
  const spikeCounts = [18, 10, 7];
  const configs = [
    { innerR: radius * 1.08, outerR: radius * 1.7,  opacity: 0.45, color: 0xffcc55 },
    { innerR: radius * 1.12, outerR: radius * 2.5,  opacity: 0.22, color: 0xff9922 },
    { innerR: radius * 1.15, outerR: radius * 3.8,  opacity: 0.10, color: 0xff6600 },
  ];
  configs.forEach(({ innerR, outerR, opacity, color }, ci) => {
    const count = spikeCounts[ci];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + ci * 0.3, spread = 0.08;
      const pts = [
        new THREE.Vector3(Math.cos(angle - spread) * innerR, Math.sin(angle - spread) * innerR, 0),
        new THREE.Vector3(Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0),
        new THREE.Vector3(Math.cos(angle + spread) * innerR, Math.sin(angle + spread) * innerR, 0),
      ];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
    }
  });
  return group;
}

const ATMO_COLORS: Record<string, { color: number; opacity: number; scale: number }> = {
  Mercury: { color: 0xbbbbaa, opacity: 0.06, scale: 1.06 },
  Venus:   { color: 0xffddaa, opacity: 0.20, scale: 1.10 },
  Earth:   { color: 0x4488ff, opacity: 0.15, scale: 1.05 },
  Mars:    { color: 0xff6644, opacity: 0.10, scale: 1.07 },
  Jupiter: { color: 0xddaa66, opacity: 0.18, scale: 1.06 },
  Saturn:  { color: 0xeedd99, opacity: 0.15, scale: 1.05 },
  Uranus:  { color: 0x88ddee, opacity: 0.18, scale: 1.07 },
  Neptune: { color: 0x3366ff, opacity: 0.20, scale: 1.07 },
  Pluto:   { color: 0xaaaacc, opacity: 0.07, scale: 1.06 },
};

interface Props {
  onPlanetClick: (name: string) => void;
  selectedPlanet: string | null;
  onDeselect: () => void;
  timeScale?: number;
}

export default function SolarScene({ onPlanetClick, selectedPlanet, onDeselect, timeScale = 1 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>({});
  const timeScaleRef = useRef(timeScale);
  const animFrameRef = useRef<number>();
  const selectedRef = useRef(selectedPlanet);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => { timeScaleRef.current = timeScale; }, [timeScale]);
  useEffect(() => { selectedRef.current = selectedPlanet; }, [selectedPlanet]);

  const handlePlanetClick = useCallback(onPlanetClick, [onPlanetClick]);
  const handleDeselect = useCallback(onDeselect, [onDeselect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (!isWebGLSupported()) { setWebglError(true); return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.01, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    scene.add(new THREE.AmbientLight(0x222233, 0.6));
    const sunLight = new THREE.PointLight(0xffddaa, 3.0, 500);
    scene.add(sunLight);

    const spaceEnv = createSpaceEnvironment(scene);

    const lensFlare = makeLensFlare();
    lensFlare.position.set(0, 0, 0);
    scene.add(lensFlare);

    const planets: Record<string, any> = {};
    const clickables: THREE.Mesh[] = [];

    Object.keys(PLANET_DATA).forEach((name) => {
      const data = PLANET_DATA[name];
      const isMain = MAIN_PLANETS.includes(name);

      if (data.semiMajor > 0) {
        scene.add(buildOrbitLine(data.semiMajor, data.eccentricity || 0, isMain ? 0.10 : 0.04, data.inclination || 0));
      }

      const group = new THREE.Group();
      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = (data.axialTilt || 0) * Math.PI / 180;

      const geo = new THREE.SphereGeometry(data.radius, 64, 64);
      const mat = name === 'Sun'
        ? new THREE.MeshBasicMaterial({ color: data.color })
        : new THREE.MeshStandardMaterial({ color: data.color, emissive: new THREE.Color(data.emissive || 0), emissiveIntensity: 0.12, roughness: 0.8, metalness: 0.05 });
      if (data.texture) loader.load(data.texture, (tex) => { (mat as any).map = tex; mat.needsUpdate = true; });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { name, isPlanet: true };
      tiltGroup.add(mesh);
      group.add(tiltGroup);
      scene.add(group);
      clickables.push(mesh);

      const atmo = ATMO_COLORS[name];
      if (atmo) {
        const atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius * atmo.scale, 32, 32), new THREE.MeshBasicMaterial({ color: atmo.color, transparent: true, opacity: atmo.opacity, side: THREE.BackSide }));
        tiltGroup.add(atmoMesh);
        const glowSprite = makeGlowSprite(atmo.color, data.radius * 5);
        group.add(glowSprite);
      }

      if (name === 'Sun') {
        [[1.4, 0xffaa33, 0.20], [2.0, 0xff8800, 0.10], [3.0, 0xff5500, 0.04]].forEach(([s, c, o]) => {
          tiltGroup.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius * (s as number), 32, 32), new THREE.MeshBasicMaterial({ color: c as number, transparent: true, opacity: o as number, side: THREE.BackSide })));
        });
        const corona = buildSunCorona(data.radius);
        tiltGroup.add(corona);
        planets._sunCorona = corona;
        const sunGlow = makeGlowSprite(0xffaa22, data.radius * 14);
        group.add(sunGlow);
        planets._sunGlow = sunGlow;
      }

      if (name === 'Earth') {
        const nightMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.0 });
        loader.load(`${TEX}/2k_earth_nightmap.jpg`, (tex) => { nightMat.map = tex; nightMat.needsUpdate = true; nightMat.opacity = 0.35; });
        tiltGroup.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.001, 64, 64), nightMat));
      }

      if (name === 'Saturn') {
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xddcc88, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
        loader.load(`${TEX}/2k_saturn_ring_alpha.png`, (tex) => { ringMat.map = tex; ringMat.alphaMap = tex; ringMat.color.set(0xffffff); ringMat.needsUpdate = true; });
        const ring = new THREE.Mesh(new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.4, 128), ringMat);
        ring.rotation.x = -Math.PI / 2.5;
        tiltGroup.add(ring);
      }

      if (name === 'Uranus') {
        const uranusRing = new THREE.Mesh(new THREE.RingGeometry(data.radius * 1.5, data.radius * 1.85, 64), new THREE.MeshBasicMaterial({ color: 0x88ccdd, side: THREE.DoubleSide, transparent: true, opacity: 0.28 }));
        uranusRing.rotation.x = Math.PI / 2;
        tiltGroup.add(uranusRing);
      }

      if (name === 'Neptune') {
        const ring = new THREE.Mesh(new THREE.RingGeometry(data.radius * 1.6, data.radius * 1.95, 64), new THREE.MeshBasicMaterial({ color: 0x3366ff, side: THREE.DoubleSide, transparent: true, opacity: 0.18 }));
        ring.rotation.x = -Math.PI / 2;
        tiltGroup.add(ring);
      }

      const label = makeLabel(name, name === 'Sun' ? 32 : isMain ? 26 : 20);
      label.position.y = data.radius + 1.4;
      group.add(label);

      planets[name] = { group, tiltGroup, mesh, data, label };
    });

    // Moons
    const moonObjects: Record<string, any[]> = {};
    Object.keys(MOON_DATA).forEach((planetName) => {
      moonObjects[planetName] = MOON_DATA[planetName].map((md) => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(md.radius, 16, 16), new THREE.MeshStandardMaterial({ color: md.color, roughness: 0.9 }));
        if (md.texture) loader.load(md.texture, (tex) => { (mesh.material as any).map = tex; mesh.material.needsUpdate = true; });
        const group = new THREE.Group();
        group.add(mesh);
        const label = makeLabel(md.name, 17);
        label.position.y = md.radius + 0.5;
        group.add(label);
        if (md.volcanic) {
          group.add(new THREE.Mesh(new THREE.SphereGeometry(md.radius * 1.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.22, side: THREE.BackSide })));
        }
        if (md.geyser) {
          const n = 80, pts = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            const t = i / n;
            pts[i*3] = (Math.random()-0.5)*t*0.25; pts[i*3+1] = t*md.radius*5; pts[i*3+2] = (Math.random()-0.5)*t*0.25;
          }
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
          group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xeeeeff, size: 0.04, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })));
        }
        scene.add(group);
        return { group, mesh, data: md };
      });
    });

    // Asteroid belt (visual inside scene)
    const aPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const a = Math.random()*Math.PI*2, r = 18+Math.random()*3.5, h=(Math.random()-0.5)*0.8;
      aPos[i*3]=r*Math.cos(a); aPos[i*3+1]=h; aPos[i*3+2]=r*Math.sin(a);
    }
    const aGeo = new THREE.BufferGeometry(); aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    scene.add(new THREE.Points(aGeo, new THREE.PointsMaterial({ color: 0x998877, size: 0.13, transparent: true, opacity: 0.65, depthWrite: false })));

    // Hover ring
    const hoverRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 8, 128), new THREE.MeshBasicMaterial({ color: 0xffee55, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
    hoverRing.rotation.x = Math.PI / 2; scene.add(hoverRing);

    // Selection rings
    const selectionRings = [0.9, 1.2, 1.6].map((scale, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 8, 128), new THREE.MeshBasicMaterial({ color: [0x88aaff, 0x4466ff, 0x2233cc][i], transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
      ring.rotation.x = Math.PI / 2; scene.add(ring);
      return { mesh: ring, scale, phase: i * 0.5 };
    });

    // Camera state
    const cam = {
      radius: 55, theta: 0.4, phi: 0.45,
      targetRadius: 55, targetTheta: 0.4, targetPhi: 0.45,
      lookAt: new THREE.Vector3(), targetLookAt: new THREE.Vector3(),
    };
    sceneRef.current = { cam, planets, moonObjects };

    // Input
    const drag = { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0 };
    let hoveredName: string | null = null;

    const getRayHit = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const m = new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1, -((clientY-rect.top)/rect.height)*2+1);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(m, camera);
      return rc.intersectObjects(clickables);
    };

    const onMouseDown = (e: MouseEvent) => {
      drag.active = true; drag.startX = drag.lastX = e.clientX; drag.startY = drag.lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.active) {
        const hits = getRayHit(e.clientX, e.clientY);
        hoveredName = hits.length > 0 ? (hits[0].object.userData.name as string) : null;
        renderer.domElement.style.cursor = hoveredName ? 'pointer' : 'grab';
        return;
      }
      const dx = e.clientX-drag.lastX, dy = e.clientY-drag.lastY;
      drag.lastX = e.clientX; drag.lastY = e.clientY;
      cam.targetTheta -= dx * 0.005;
      cam.targetPhi = Math.max(0.05, Math.min(Math.PI-0.05, cam.targetPhi - dy * 0.005));
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!drag.active) return;
      drag.active = false;
      renderer.domElement.style.cursor = 'grab';
      if (Math.abs(e.clientX-drag.startX) < 5 && Math.abs(e.clientY-drag.startY) < 5) {
        const hits = getRayHit(e.clientX, e.clientY);
        if (hits.length > 0) handlePlanetClick(hits[0].object.userData.name as string);
        else handleDeselect();
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.targetRadius = Math.max(2.5, cam.targetRadius * (e.deltaY > 0 ? 1.12 : 0.89));
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length===1) { drag.active=true; drag.startX=drag.lastX=e.touches[0].clientX; drag.startY=drag.lastY=e.touches[0].clientY; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drag.active||e.touches.length!==1) return;
      const dx=e.touches[0].clientX-drag.lastX, dy=e.touches[0].clientY-drag.lastY;
      drag.lastX=e.touches[0].clientX; drag.lastY=e.touches[0].clientY;
      cam.targetTheta -= dx*0.005; cam.targetPhi = Math.max(0.05, Math.min(Math.PI-0.05, cam.targetPhi - dy*0.005));
    };
    const onTouchEnd = () => { drag.active = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const ts = timeScaleRef.current;
      time += 0.003 * ts;

      // Planet orbits + rotation
      Object.keys(PLANET_DATA).forEach((name) => {
        const p = planets[name];
        if (!p) return;
        const d = p.data;
        if (d.semiMajor > 0) {
          const a = d.semiMajor, e = d.eccentricity || 0;
          const b = a * Math.sqrt(1 - e * e);
          const angle = time * d.speed;
          const x = a * Math.cos(angle), z = b * Math.sin(angle);
          const y = d.inclination ? Math.sin(d.inclination) * z : 0;
          p.group.position.set(x, y, z);
        }
        p.mesh.rotation.y += (d.rotationSpeed || 0.005) * ts;
      });

      // Moon orbits
      Object.keys(moonObjects).forEach((planetName) => {
        const pPos = planets[planetName]?.group.position;
        if (!pPos) return;
        moonObjects[planetName].forEach(({ group, data: md }: any) => {
          const angle = time * md.speed;
          const inc = md.inclination || 0;
          group.position.set(
            pPos.x + md.distance * Math.cos(angle),
            pPos.y + md.distance * Math.sin(inc) * Math.sin(angle),
            pPos.z + md.distance * Math.sin(angle) * Math.cos(inc),
          );
        });
      });

      // Space environment
      if (spaceEnv) spaceEnv.update(time);

      // Sun effects
      if (planets._sunCorona) planets._sunCorona.rotation.z = time * 0.05;
      if (planets._sunGlow) {
        const sunPulse = 0.95 + Math.sin(time * 2) * 0.05;
        planets._sunGlow.scale.setScalar(sunPulse);
      }
      if (planets['Sun']) planets['Sun'].mesh.rotation.y += 0.002 * ts;

      // Lens flare
      lensFlare.lookAt(camera.position);

      // Hover ring
      if (hoveredName && planets[hoveredName]) {
        const p = planets[hoveredName];
        hoverRing.position.copy(p.group.position);
        hoverRing.scale.setScalar(p.data.radius + 0.3);
        (hoverRing.material as THREE.MeshBasicMaterial).opacity = 0.7;
      } else {
        (hoverRing.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Selection rings
      const sel = selectedRef.current;
      selectionRings.forEach(({ mesh, scale, phase }) => {
        if (sel && planets[sel]) {
          const p = planets[sel];
          mesh.position.copy(p.group.position);
          mesh.scale.setScalar((p.data.radius + 0.5) * scale);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(time * 3 + phase) * 0.25;
        } else {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      });

      // Camera easing
      cam.radius   += (cam.targetRadius - cam.radius) * 0.06;
      cam.theta    += (cam.targetTheta - cam.theta) * 0.06;
      cam.phi      += (cam.targetPhi - cam.phi) * 0.06;
      cam.lookAt.lerp(cam.targetLookAt, 0.05);

      camera.position.set(
        cam.lookAt.x + cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta),
        cam.lookAt.y + cam.radius * Math.cos(cam.phi),
        cam.lookAt.z + cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta),
      );
      camera.lookAt(cam.lookAt);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [handlePlanetClick, handleDeselect]);

  // Camera focus on selected planet
  useEffect(() => {
    const { cam, planets } = sceneRef.current;
    if (!cam) return;
    if (selectedPlanet) {
      const p = planets?.[selectedPlanet];
      if (!p) return;
      const update = () => {
        cam.targetLookAt.copy(p.group.position);
        cam.targetRadius = p.data.radius * 5 + 4;
      };
      update();
      const id = setInterval(update, 16);
      return () => clearInterval(id);
    } else {
      cam.targetLookAt.set(0, 0, 0);
    }
  }, [selectedPlanet]);

  if (webglError) {
    return (
      <div data-testid="solar-webgl-fallback" className="w-full h-full flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-4">🌌</div>
        <div className="text-white/70 text-lg font-bold mb-2 tracking-widest uppercase">Real Solar System</div>
        <div className="text-white/30 text-sm mb-4 font-mono">Three.js WebGL — GPU required for full 3D experience</div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {["Sun ☀️","Mercury","Venus","Earth 🌍","Mars","Jupiter","Saturn 🪐","Uranus","Neptune"].map(p => (
            <button
              key={p}
              data-testid={`planet-btn-${p.split(' ')[0].toLowerCase()}`}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 text-xs font-mono transition-all"
              onClick={() => onPlanetClick(p.split(' ')[0])}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
}
