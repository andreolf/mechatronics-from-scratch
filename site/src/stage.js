// Shared three.js stage: renderer, studio lighting + soft shadows, resize, visibility-gated loop, WebGL fallback.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { webglAvailable, isNarrow } from './loop.js';
export { webglAvailable, reducedMotion, isNarrow, register, fallback } from './loop.js';

export class Stage {
  constructor(el, { fov = 40, pos = [0, 2, 6], look = [0, 1, 0], offset = null, shadow = 6, clear = 0x000000 } = {}) {
    this.el = el; this.offset = offset;
    this.ok = webglAvailable();
    if (!this.ok) return;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch { this.ok = false; return; }
    const r = this.renderer;
    r.setPixelRatio(Math.min(devicePixelRatio || 1, isNarrow() ? 1.75 : 2));
    r.setClearColor(clear, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(r.domElement);
    el.dataset.webgl = 'on';
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 9, 22);
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pm.dispose();
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 100);
    this.camera.position.set(...pos);
    this.look = new THREE.Vector3(...look);
    this.camera.lookAt(this.look);
    this.scene.add(new THREE.HemisphereLight(0xf2ffe0, 0x080a06, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 8, 5); key.castShadow = true;
    key.shadow.mapSize.set(isNarrow() ? 1024 : 2048, isNarrow() ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 30 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
    this.scene.add(key); this.key = key;
    const rim = new THREE.DirectionalLight(0xc6ff1a, 0.9); rim.position.set(-6, 3, -5); this.scene.add(rim);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(el);
  }
  // soft contact-shadow floor plus a faint drafting grid
  floor(size = 14, y = 0) {
    const g = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = y + 0.001; sh.receiveShadow = true; g.add(sh);
    const grid = new THREE.GridHelper(size, size * 2, 0x26300f, 0x12160b);
    grid.position.y = y; grid.material.transparent = true; grid.material.opacity = 0.7; g.add(grid);
    this.scene.add(g);
    return g;
  }
  shadows(root, cast = true, receive = false) {
    root.traverse((o) => { if (o.isMesh && !o.material.isShadowMaterial && !o.material.wireframe && !o.material.transparent) { o.castShadow = cast; o.receiveShadow = receive; } });
  }
  resize() {
    if (!this.ok) return;
    const w = Math.max(1, this.el.clientWidth), h = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    if (this.offset) { const [ox, oy] = this.offset(w, h); this.camera.setViewOffset(w, h, ox, oy, w, h); }
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  }
  render() { if (this.ok) this.renderer.render(this.scene, this.camera); }
  pick(clientX, clientY, plane) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    const out = new THREE.Vector3();
    return ray.ray.intersectPlane(plane, out) ? out : null;
  }
}

export const LIME = 0xc6ff1a;
export const mats = {
  lime: () => new THREE.MeshPhysicalMaterial({ color: LIME, emissive: 0x1c2800, roughness: 0.32, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  metal: () => new THREE.MeshPhysicalMaterial({ color: 0xb9bdb3, roughness: 0.3, metalness: 1.0, clearcoat: 0.2 }),
  dark: () => new THREE.MeshPhysicalMaterial({ color: 0x1d201b, roughness: 0.55, metalness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x0c0d0b, roughness: 0.9, metalness: 0 }),
  red: () => new THREE.MeshStandardMaterial({ color: 0xff6b5b, emissive: 0x440000, roughness: 0.4 }),
};

export function grid(size = 10, div = 20) {
  const g = new THREE.GridHelper(size, div, 0x26300f, 0x12160b);
  g.material.transparent = true; g.material.opacity = 0.7;
  return g;
}
