// Hero: a 3-DOF arm (base yaw, shoulder, elbow) that solves analytic IK every frame to follow the cursor.
// Each joint is a simulated second-order servo (wn = 9 rad/s, zeta = 0.8) integrated with semi-implicit Euler,
// so the motion is a real response to a moving setpoint rather than a keyframed animation.
import * as THREE from 'three';
import { Stage, register, fallback, mats, reducedMotion } from './stage.js';

export function hero(el, readout, pauseBtn) {
  const st = new Stage(el, { fov: 34, pos: [3.6, 2.6, 6.6], look: [0.7, 1.15, 0], shadow: 4 });
  const camBase = () => { const a = st.w / st.h; return a < 1.15 ? [4.6, 3.0, 8.4] : [3.6, 2.6, 6.6]; };
  const L1 = 1.35, L2 = 1.15, H0 = 0.55;
  const q = [0.4, 0.9, -1.4], qd = [0, 0, 0], qs = q.slice();
  const lim = [[-Math.PI, Math.PI], [-0.2, 2.6], [-2.6, -0.05]];
  const wn = 9, zeta = 0.8;
  const target = new THREE.Vector3(1.6, 1.4, 0.5);
  let lastMove = -10, t = 0;
  const reachMax = L1 + L2 - 0.05;

  const solve = (p) => {
    const yaw = Math.atan2(-p.z, p.x);
    const r = Math.hypot(p.x, p.z), hgt = p.y - H0;
    let d = Math.hypot(r, hgt); const s = Math.min(reachMax, Math.max(0.4, d)) / (d || 1);
    const rr = r * s, hh = hgt * s; d = Math.hypot(rr, hh);
    const c2 = Math.max(-1, Math.min(1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
    const q3 = -Math.acos(c2); // elbow up
    const q2 = Math.atan2(hh, rr) - Math.atan2(L2 * Math.sin(q3), L1 + L2 * Math.cos(q3));
    return [yaw, q2, q3];
  };

  if (!st.ok) { fallback(el, 'The rest of the site works without it.'); if (pauseBtn) pauseBtn.hidden = true; return; }
  const s = st.scene;
  st.floor(16);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.52, 64), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; s.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(reachMax, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, wireframe: true, transparent: true, opacity: 0.03 }));
  dome.position.y = H0; s.add(dome);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.22, 48), mats.dark()); base.position.y = 0.11; s.add(base);
  const turret = new THREE.Group(); turret.position.y = 0.22; s.add(turret);
  const tbody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, H0 - 0.22, 40), mats.metal()); tbody.position.y = (H0 - 0.22) / 2; turret.add(tbody);
  const shoulder = new THREE.Group(); shoulder.position.y = H0 - 0.22; turret.add(shoulder);
  const sj = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.36, 32), mats.lime()); sj.rotation.x = Math.PI / 2; shoulder.add(sj);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(L1, 0.16, 0.18), mats.metal()); upper.position.x = L1 / 2; shoulder.add(upper);
  const elbow = new THREE.Group(); elbow.position.x = L1; shoulder.add(elbow);
  const ej = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 32), mats.lime()); ej.rotation.x = Math.PI / 2; elbow.add(ej);
  const fore = new THREE.Mesh(new THREE.BoxGeometry(L2, 0.12, 0.13), mats.metal()); fore.position.x = L2 / 2; elbow.add(fore);
  const wrist = new THREE.Group(); wrist.position.x = L2; elbow.add(wrist);
  const wj = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), mats.dark()); wrist.add(wj);
  const fingers = [];
  for (const sgn of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.04), mats.lime()); f.position.set(0.12, 0, sgn * 0.05); wrist.add(f); fingers.push(f); }
  const tgt = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, wireframe: true })); s.add(tgt);
  const N = 160, trailPos = new Float32Array(N * 3), trailCol = new Float32Array(N * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })); s.add(trail);
  let trailInit = false;
  const tipW = new THREE.Vector3();

  // pointer -> target on a vertical plane facing the camera through the arm's workspace
  const onPointer = (e) => {
    const n = new THREE.Vector3().subVectors(st.camera.position, st.look).setY(0).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, new THREE.Vector3(0.9, 1.1, 0));
    const p = st.pick(e.clientX, e.clientY, plane);
    if (p) { p.y = Math.max(0.15, p.y); target.copy(p); lastMove = t; }
  };
  const cv = st.renderer.domElement;
  cv.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') onPointer(e); }, { passive: true });
  cv.addEventListener('pointerdown', onPointer, { passive: true });

  const still = reducedMotion();
  const item = {
    el, visible: true, paused: false,
    tick(dt) {
      t += dt;
      if (t - lastMove > 2.5 && !still) { // idle: trace a lissajous so the scene is alive on touch devices
        const a = t * 0.55;
        target.set(1.3 + 0.7 * Math.cos(a), 1.25 + 0.6 * Math.sin(2 * a), 0.9 * Math.sin(a));
      }
      const des = solve(target);
      // unwrap yaw to the nearest equivalent angle
      while (des[0] - q[0] > Math.PI) des[0] -= 2 * Math.PI;
      while (des[0] - q[0] < -Math.PI) des[0] += 2 * Math.PI;
      const sub = 4, h = dt / sub;
      for (let k = 0; k < sub; k++) for (let j = 0; j < 3; j++) {
        const lo = j ? lim[j][0] : -Infinity, hi = j ? lim[j][1] : Infinity;
        const d = Math.min(hi, Math.max(lo, des[j]));
        qd[j] += h * (wn * wn * (d - q[j]) - 2 * zeta * wn * qd[j]);
        q[j] += h * qd[j];
      }
      turret.rotation.y = q[0]; shoulder.rotation.z = q[1]; elbow.rotation.z = q[2];
      wrist.rotation.z = -(q[1] + q[2]) - 0.6;
      const grip = 0.03 + 0.03 * Math.abs(Math.sin(t * 2));
      fingers[0].position.z = -grip - 0.02; fingers[1].position.z = grip + 0.02;
      tgt.position.copy(target); tgt.rotation.y += dt * 1.5; tgt.rotation.x += dt;
      wrist.getWorldPosition(tipW);
      if (!trailInit) { for (let i = 0; i < N; i++) tipW.toArray(trailPos, i * 3); trailInit = true; }
      trailPos.copyWithin(0, 3); tipW.toArray(trailPos, (N - 1) * 3);
      for (let i = 0; i < N; i++) { const f = i / N; trailCol[i * 3] = 0.78 * f; trailCol[i * 3 + 1] = 1 * f; trailCol[i * 3 + 2] = 0.1 * f; }
      trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.color.needsUpdate = true;
      const err = tipW.distanceTo(target);
      if (readout && Math.round(t * 10) % 3 === 0) readout.textContent = `q = [${q.map((v) => (v * 57.3).toFixed(0).padStart(4)).join(' ')}]°\n|e| = ${(err * 100).toFixed(1)} cm`;
      el.dataset.err = err.toFixed(3);
      const cb = camBase();
      st.camera.position.set(cb[0] + (still ? 0 : Math.sin(t * 0.12) * 0.4), cb[1], cb[2]);
      st.camera.lookAt(st.look);
      st.render();
    },
  };
  st.shadows(s);
  dome.castShadow = false; ring.castShadow = false; tgt.castShadow = false;
  if (pauseBtn) pauseBtn.addEventListener('click', () => { item.paused = !item.paused; pauseBtn.setAttribute('aria-pressed', String(item.paused)); pauseBtn.textContent = item.paused ? 'Play' : 'Pause'; });
  register(item);
  window.__mfs = window.__mfs || {}; window.__mfs.hero = { target, q };
}
