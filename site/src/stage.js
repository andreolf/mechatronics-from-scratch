// Shared three.js stage: renderer, resize handling, visibility-gated animation loop, WebGL fallback.
import * as THREE from 'three';

let glOk = null;
export function webglAvailable() {
  if (glOk !== null) return glOk;
  if (new URLSearchParams(location.search).has('nowebgl')) return (glOk = false);
  try {
    const c = document.createElement('canvas');
    glOk = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { glOk = false; }
  return glOk;
}

const items = new Set();
let last = 0, running = false;
function frame(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  for (const it of items) if (it.visible) {
    try { it.tick(dt); } catch (e) { console.warn('tick failed', e); items.delete(it); }
  }
  requestAnimationFrame(frame);
}
export function register(item) {
  items.add(item);
  if (!running) { running = true; requestAnimationFrame(frame); }
  const io = new IntersectionObserver((es) => { for (const e of es) item.visible = e.isIntersecting; }, { rootMargin: '80px' });
  io.observe(item.el);
}

export function fallback(el, what) {
  const d = document.createElement('div');
  d.className = 'nogl';
  d.innerHTML = `<div><b>3D view unavailable</b>WebGL is disabled or unsupported in this browser.<br/>${what}</div>`;
  el.appendChild(d);
  el.dataset.webgl = 'off';
}

export class Stage {
  constructor(el, { fov = 40, pos = [0, 2, 6], look = [0, 1, 0], alpha = false, offset = null } = {}) {
    this.el = el; this.offset = offset;
    this.ok = webglAvailable();
    if (!this.ok) return;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: 'high-performance' });
    } catch (e) { this.ok = false; return; }
    const mobile = matchMedia('(max-width: 760px)').matches;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
    this.renderer.setClearColor(0x050505, alpha ? 0 : 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(this.renderer.domElement);
    el.dataset.webgl = 'on';
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x050505, 12, 30);
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 100);
    this.camera.position.set(...pos);
    this.look = new THREE.Vector3(...look);
    this.camera.lookAt(this.look);
    this.scene.add(new THREE.HemisphereLight(0xe8ffd0, 0x0a0a08, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc6ff1a, 0.9); rim.position.set(-5, 3, -4); this.scene.add(rim);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(el);
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
  // Ray from client coords to plane (normal n through point p0)
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
  lime: () => new THREE.MeshStandardMaterial({ color: LIME, emissive: 0x3a5200, roughness: 0.35, metalness: 0.2 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0x9ba394, roughness: 0.35, metalness: 0.8 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x1b1e18, roughness: 0.6, metalness: 0.4 }),
  red: () => new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0x550000, roughness: 0.4 }),
};

export function grid(size = 10, div = 20) {
  const g = new THREE.GridHelper(size, div, 0x2f3a12, 0x161a10);
  g.material.transparent = true; g.material.opacity = 0.9;
  return g;
}
