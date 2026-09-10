'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Compass, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { batchStaticScene } from '@/src/scene';
import {
  AGENTS,
  MISSIONS,
  TRAVEL_MS,
  unlocked,
  type Game,
  type MissionId,
} from '@/src/game';
export function World({
  game,
  selected,
  onSelect,
}: {
  game: Game;
  selected: MissionId;
  onSelect: (id: MissionId) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef({ game, selected }),
    buttons = useRef<Partial<Record<MissionId, HTMLButtonElement | null>>>({}),
    api = useRef<{ reset: () => void; zoom: (n: number) => void } | null>(null);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = { game, selected };
  }, [game, selected]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stopped = false,
      frame = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => {
        if (!stopped) setFailed(true);
      });
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      '길드 섬 3D 지도. 드래그로 회전하고 스크롤로 확대할 수 있습니다.',
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(15, 17, 23);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.enableDamping = true;
    controls.minDistance = 19;
    controls.maxDistance = 42;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = 1.15;
    controls.enablePan = false;
    api.current = {
      reset: () => {
        camera.position.set(15, 17, 23);
        controls.target.set(0, 0.1, 0);
      },
      zoom: (n) => {
        camera.position.multiplyScalar(n);
      },
    };
    scene.add(new THREE.HemisphereLight(0xbce4ef, 0x233328, 2.5));
    const sun = new THREE.DirectionalLight(0xffdfac, 3.3);
    sun.position.set(-8, 15, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -11,
      right: 11,
      top: 11,
      bottom: -11,
      near: 0.5,
      far: 50,
    });
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x69b4d5, 2);
    rim.position.set(6, 8, -8);
    scene.add(rim);
    const pawns: THREE.Group[] = [];
    const rings: THREE.Mesh[] = [];
    const loader = new GLTFLoader();
    function dispose(obj: THREE.Object3D) {
      obj.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
        }
      });
    }
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const ringGeometry = new THREE.RingGeometry(0.47, 0.53, 32);
    for (const m of Object.values(MISSIONS)) {
      const ring = new THREE.Mesh(
        ringGeometry,
        new THREE.MeshBasicMaterial({
          color: m.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(m.position[0], 0.21, m.position[2]);
      scene.add(ring);
      rings.push(ring);
    }
    let backdrop: THREE.Group | undefined;
    const upgrades: THREE.Group[] = [];
    Promise.all(
      [
        '/assets/guild-island.glb',
        ...Object.keys(AGENTS).map((_, i) => `/assets/agent-${i}.glb`),
        '/assets/hall-level-2.glb',
        '/assets/hall-level-3.glb',
      ].map((url) => loader.loadAsync(url)),
    )
      .then((models) => {
        if (stopped) {
          models.forEach((m) => dispose(m.scene));
          return;
        }
        backdrop = batchStaticScene(models[0].scene);
        backdrop.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        scene.add(backdrop);
        models.slice(1, 5).forEach((m) => {
          m.scene.scale.setScalar(1.25);
          scene.add(m.scene);
          pawns.push(m.scene);
        });
        models.slice(5).forEach((m) => {
          const upgrade = batchStaticScene(m.scene);
          upgrade.visible = false;
          scene.add(upgrade);
          upgrades.push(upgrade);
        });
        setReady(true);
      })
      .catch(() => {
        if (!stopped) setFailed(true);
      });
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    });
    resize.observe(el);
    function draw() {
      if (stopped) return;
      frame = requestAnimationFrame(draw);
      const { game: g, selected: s } = latest.current,
        t = Date.now();
      controls.update();
      pawns.forEach((pawn, i) => {
        const id = Object.keys(AGENTS)[i] as keyof typeof AGENTS;
        pawn.visible = g.agents.some((a) => a.id === id);
        let x = -1.7 + i * 0.65,
          z = 2.8;
        const r = g.run;
        if (r && r.team.includes(id)) {
          const dest = MISSIONS[r.mission].position;
          let p = Math.min(1, Math.max(0, (t - r.startedAt) / TRAVEL_MS));
          if (g.phase === 'event') p = 1;
          if (g.phase === 'report') p = 0;
          if (g.phase === 'returning') p = 1 - p;
          const midX = dest[0],
            midZ = 4;
          if (p < 0.45) {
            x = THREE.MathUtils.lerp(x, midX, p / 0.45);
            z = THREE.MathUtils.lerp(z, midZ, p / 0.45);
          } else {
            x = midX;
            z = THREE.MathUtils.lerp(midZ, dest[2], (p - 0.45) / 0.55);
          }
          x += r.team.indexOf(id) * 0.45;
          pawn.rotation.y = g.phase === 'returning' ? Math.PI : 0;
        }
        pawn.position.set(
          x,
          0.16 +
            (!reduced &&
            g.run?.team.includes(id) &&
            ['outbound', 'returning'].includes(g.phase)
              ? Math.abs(Math.sin(t * 0.008 + i)) * 0.08
              : 0),
          z,
        );
      });
      Object.values(MISSIONS).forEach((m, i) => {
        const pos = new THREE.Vector3(...m.position);
        pos.y = 1.1;
        pos.project(camera);
        const button = buttons.current[m.id];
        if (button) {
          button.style.left = `${(pos.x * 0.5 + 0.5) * 100}%`;
          button.style.top = `${(-pos.y * 0.5 + 0.5) * 100}%`;
          button.style.visibility = pos.z < 1 ? 'visible' : 'hidden';
        }
        rings[i].scale.setScalar(m.id === s ? 1.3 : 1);
        (rings[i].material as THREE.MeshBasicMaterial).opacity = unlocked(
          g,
          m.id,
        )
          ? 0.65
          : 0.15;
      });
      upgrades.forEach((upgrade, i) => {
        upgrade.visible = g.hall >= i + 2;
      });
      renderer.render(scene, camera);
    }
    draw();
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      dispose(scene);
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);
  return (
    <div className="world-stage">
      <div className="world-orbit" aria-hidden="true" />
      <Image
        width={1400}
        height={1000}
        unoptimized
        className={`world-fallback ${ready && !failed ? 'hidden' : ''}`}
        src="/assets/guild-island.png"
        alt="숲과 폐광, 파수탑 사이에 자리한 길드 하우스"
      />
      <div
        ref={host}
        className={`world-canvas ${!ready || failed ? 'invisible' : ''}`}
      />
      {ready &&
        !failed &&
        Object.values(MISSIONS).map((m, i) => (
          <button
            key={m.id}
            ref={(el) => {
              buttons.current[m.id] = el;
            }}
            className={`map-pin ${selected === m.id ? 'selected' : ''} ${!unlocked(game, m.id) ? 'locked' : ''}`}
            onClick={() => onSelect(m.id)}
            aria-label={`${m.name}${unlocked(game, m.id) ? ' 선택' : ' · 아직 잠긴 지역'}`}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            <b>{m.name}</b>
          </button>
        ))}
      <div className="map-caption">
        <Compass size={16} />
        <span>여명의 섬</span>
        <small>THE FIRST LIGHT</small>
      </div>
      <div className="camera-controls">
        <button
          onClick={() => api.current?.zoom(0.9)}
          aria-label="지도 확대"
          disabled={!ready || failed}
        >
          <ZoomIn size={17} />
        </button>
        <button
          onClick={() => api.current?.zoom(1.1)}
          aria-label="지도 축소"
          disabled={!ready || failed}
        >
          <ZoomOut size={17} />
        </button>
        <button
          onClick={() => api.current?.reset()}
          aria-label="시점 초기화"
          disabled={!ready || failed}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="map-hint">
        {failed
          ? '3D 표시를 사용할 수 없어 지도로 표시합니다. 원정은 계속할 수 있습니다.'
          : ready
            ? '드래그하여 둘러보기 · 지역을 눌러 원정 선택'
            : '섬을 불러오는 중…'}
      </p>
    </div>
  );
}
