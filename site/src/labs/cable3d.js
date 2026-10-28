// three.js view of the cable robot. Sim frame (x, y, z up) maps to three.js as (x, z, -y).
import * as THREE from 'three';
import { Stage, fallback, mats } from '../stage.js';
import { tensionRGB } from './cableLab.js';

const T = (v) => new THREE.Vector3(v[0], v[2], -v[1]);
const UP = new THREE.Vector3(0, 1, 0);

export function cableView(el, sim, { heat, getShowMap, onPick, onKey, isInteractive }) {
  const st = new Stage(el, { fov: 40, pos: [6, 5, 8], look: [0, 1.2, 0] });
  if (!st.ok) { fallback(el, 'The tension bars, capacity map and scope below still run.'); return { update() {}, setRoom() {}, heatChanged() {}, dispose() {} }; }
  const s = st.scene;
  const world = new THREE.Group(); s.add(world);
  let roomG = null, scale = 1;
  const cableMat = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({ color: 0xc6ff1a, transparent: true, opacity: 1 }));
  const cableGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const cables = cableMat.map((m) => { const c = new THREE.Mesh(cableGeo, m); s.add(c); return c; });
  const pivot = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats.dark()); s.add(pivot);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), mats.metal()); s.add(pole);
  const grip = new THREE.Group(); s.add(grip);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mats.lime()); grip.add(palm);
  const fingers = [-1, 1].map((k) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.5), mats.dark()); f.position.set(k * 0.75, -0.9, 0); grip.add(f); return f; });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 10, 40), new THREE.MeshBasicMaterial({ color: 0xc6ff1a })); ring.rotation.x = Math.PI / 2; s.add(ring);
  const drop = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, transparent: true, opacity: 0.18, depthWrite: false })); drop.rotation.x = -Math.PI / 2; s.add(drop);
  const tex = new THREE.CanvasTexture(heat); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.colorSpace = THREE.SRGBColorSpace;
  const slice = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide })); slice.rotation.x = -Math.PI / 2; s.add(slice);
  const anchors = [0, 1, 2, 3].map(() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats.dark()); g.add(b); const sp = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 24), mats.lime()); sp.position.y = -0.62; sp.rotation.x = Math.PI / 2; g.add(sp); s.add(g); return g; });

  function setRoom() {
    const { w, d, h } = sim.c; scale = Math.max(w, d, h * 1.6) / 7;
    if (roomG) { world.remove(roomG); roomG.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); }
    roomG = new THREE.Group();
    const span = Math.max(w, d) * 1.6;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.5 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.001; sh.receiveShadow = true; roomG.add(sh);
    const step = w < 2 ? 0.1 : 0.5, n = Math.max(2, Math.round(span / step));
    const grid = new THREE.GridHelper(n * step, n, 0x26300f, 0x12160b); grid.material.transparent = true; grid.material.opacity = 0.75; roomG.add(grid);
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0x3a4424 })); box.position.y = h / 2; roomG.add(box);
    world.add(roomG);
    sim.anchors.forEach((A, i) => { anchors[i].position.copy(T(A)); anchors[i].scale.setScalar(0.16 * scale); });
    pivot.scale.setScalar(0.16 * scale); palm.parent.scale.setScalar(0.085 * scale); ring.scale.setScalar(0.16 * scale); drop.scale.setScalar(0.12 * scale);
    slice.scale.set(w, d, 1);
    // camera from a front-right corner, far enough to fit the room on a portrait phone too
    const aspect = Math.max(0.5, st.w / st.h), fit = Math.max(w, d) * 1.05 + h * 0.6, dist = fit / Math.tan((40 * Math.PI) / 360) / Math.min(1.25, Math.max(0.62, aspect));
    const dir = new THREE.Vector3(0.7, 0.66, 1.0).normalize();
    st.look.set(0, h * 0.42, 0); st.camera.position.copy(dir.multiplyScalar(dist * 0.9)).add(st.look); st.camera.lookAt(st.look);
    st.camera.near = dist * 0.01; st.camera.far = dist * 6; st.camera.updateProjectionMatrix();
    s.fog = new THREE.Fog(0x000000, dist * 1.1, dist * 3);
    st.key.position.set(w * 0.6, h * 3 + 4, d * 0.8);
    const sb = Math.max(w, d) * 0.9; Object.assign(st.key.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 0.1, far: h * 4 + 20 }); st.key.shadow.camera.updateProjectionMatrix();
    st.shadows(s, true, false); cables.forEach((c) => (c.castShadow = false)); slice.castShadow = false; ring.castShadow = false;
  }
  let roT = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(roT); roT = requestAnimationFrame(() => { setRoom(); update(sim.state); }); }); ro.observe(el);
  setRoom();

  const tmp = new THREE.Vector3(), q = new THREE.Quaternion();
  function update(state) {
    const P = T(state.pivot), Gp = T(state.gripper);
    pivot.position.copy(P);
    tmp.subVectors(Gp, P); const pl = tmp.length(); pole.position.copy(P).addScaledVector(tmp, 0.5); pole.scale.set(0.016 * scale, pl, 0.016 * scale); q.setFromUnitVectors(UP, tmp.clone().normalize()); pole.quaternion.copy(q);
    grip.position.copy(Gp); grip.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)); 
    const rc = sim.c.tLimit;
    sim.anchors.forEach((A, i) => {
      const a = T(A); tmp.subVectors(a, P); const len = tmp.length();
      const c = cables[i]; c.position.copy(P).addScaledVector(tmp, 0.5); c.scale.set(0.02 * scale, len, 0.02 * scale); c.quaternion.setFromUnitVectors(UP, tmp.normalize());
      const col = tensionRGB(state.t[i], rc, state.slack[i] || state.relaxed); cableMat[i].color.setRGB(col[0] / 255, col[1] / 255, col[2] / 255, THREE.SRGBColorSpace); cableMat[i].opacity = state.relaxed || state.slack[i] ? 0.55 : 1;
    });
    const tg = T(state.target); ring.position.copy(tg); drop.position.set(tg.x, 0.004, tg.z);
    ring.material.color.set(state.relaxed || state.reason !== 'ok' ? 0xff6b5b : 0xc6ff1a);
    slice.visible = getShowMap(); slice.position.y = state.target[2] + sim.c.pole;
    st.render();
  }
  // picking: a horizontal plane at the target height
  const cv = st.renderer.domElement; cv.tabIndex = 0; cv.setAttribute('aria-label', 'Cable robot room. Tap to place the gripper, or use the arrow keys and Page Up / Page Down.');
  const plane = new THREE.Plane(UP, 0);
  let dragging = false, downAt = null;
  const place = (e) => { plane.constant = -sim.target[2]; const p = st.pick(e.clientX, e.clientY, plane); if (p) onPick(p.x, -p.z); };
  cv.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; if (e.pointerType !== 'touch' || isInteractive()) { dragging = true; cv.setPointerCapture(e.pointerId); place(e); } });
  cv.addEventListener('pointermove', (e) => { if (dragging) place(e); });
  cv.addEventListener('pointerup', (e) => { if (!dragging && downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 10) place(e); dragging = false; downAt = null; });
  cv.addEventListener('pointercancel', () => { dragging = false; downAt = null; });
  cv.addEventListener('keydown', (e) => {
    const k = 0.02 * Math.max(sim.c.w, sim.c.d);
    const m = { ArrowLeft: [-k, 0, 0], ArrowRight: [k, 0, 0], ArrowUp: [0, k, 0], ArrowDown: [0, -k, 0], PageUp: [0, 0, k / 2], PageDown: [0, 0, -k / 2] }[e.key];
    if (!m) return; e.preventDefault(); onKey(...m);
  });
  return {
    update, setRoom, heatChanged() { tex.needsUpdate = true; },
    dispose() { ro.disconnect(); s.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); }); st.renderer.dispose(); st.renderer.forceContextLoss?.(); },
  };
}
