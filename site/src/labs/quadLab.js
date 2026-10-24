import * as THREE from 'three';
import { QuadSim, quatToMat } from '../sim/quad.js';
import { Stage, register, fallback, mats, grid } from '../stage.js';
import { Scope } from '../scope.js';
import { labShell, bindPause, toggle, slider, select, group, row, button, setBadge } from '../ui.js';

// sim frame: x forward, y left, z up  ->  three: x right, y up, z toward viewer
const toThree = (p) => new THREE.Vector3(p[0], p[2], -p[1]);

export function quadLab(root) {
  const sim = new QuadSim();
  const L = labShell({
    id: 'quad', num: '03', title: 'Quadcopter: attitude control and the IMU filter',
    blurb: 'Newton-Euler rigid body with quaternion attitude, motor lag and a simulated IMU. A complementary filter feeds cascaded position → attitude control. Switch the filter to gyro-only or accel-only, add gyro bias or vibration, or kill a motor.',
    lessons: [['p07-l18', 'Complementary filter'], ['p12-l13', 'Quadrotor dynamics'], ['p14-l17', 'Attitude estimation'], ['p20-l09', 'Cascaded control']],
  });
  root.append(L.sec);
  const scope = new Scope(L.scope, [
    { label: 'roll true', color: '#c6ff1a', range: [-0.6, 0.6] },
    { label: 'roll est.', color: '#5ee7ff', range: [-0.6, 0.6], width: 1.2 },
    { label: 'accel tilt', color: '#4b5340', range: [-0.6, 0.6], width: 1 },
  ]);
  L.note.textContent = 'Physics: semi-implicit Euler at 1 kHz. Position comes from an ideal motion-capture system.';
  const c = sim.c;
  const kills = [0, 1, 2, 3].map((i) => toggle(`M${i + 1}`, false, (v) => (c.kill[i] = v), { id: `quad-kill-${i + 1}`, danger: true }));
  L.controls.append(
    group('Attitude estimator',
      select('IMU filter', [['complementary', 'Complementary (gyro + accel)'], ['gyro', 'Gyro only (integrate)'], ['accel', 'Accelerometer only']], c.filter, (v) => (c.filter = v), 'quad-filter'),
      slider('Filter time constant', { min: 0.05, max: 3, step: 0.05, value: c.tauF, fmt: (v) => v.toFixed(2) + ' s', id: 'quad-tau' }, (v) => (c.tauF = v))),
    group('Break it',
      row(toggle('Gyro bias', false, (v) => (c.gyroBias = v), { id: 'quad-bias' })),
      slider('Prop vibration', { min: 0, max: 3, step: 0.1, value: c.vibration, fmt: (v) => v.toFixed(1) + '×', id: 'quad-vib' }, (v) => (c.vibration = v)),
      h4('Kill a motor'), row(...kills)),
    group('Flight', row(toggle('Auto-fly path', true, (v) => (c.autoFly = v), { id: 'quad-auto' }), button('Gust', () => sim.gust(), 'quad-gust'),
      button('Reset', () => { sim.reset(); scope.clear(); trailN = 0; }, 'quad-reset'))),
  );
  function h4(t) { const e = document.createElement('h4'); e.textContent = t; e.style.cssText = 'margin:8px 0 6px;font:600 11px var(--mono);color:var(--dim);letter-spacing:.12em;text-transform:uppercase'; return e; }

  const st = new Stage(L.view3d, { fov: 42, pos: [0, 1.9, 3.4], look: [0, 1.1, 0] });
  let drone, rotors = [], ghost, targetDot, trail, trailN = 0;
  const TRAIL = 240;
  if (st.ok) {
    const s = st.scene; st.floor(10);
    const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(3.5, 3.5, 3, 24, 1, true)), new THREE.LineBasicMaterial({ color: 0x1d2410 }));
    cage.position.y = 1.5; s.add(cage);
    drone = new THREE.Group(); s.add(drone);
    const L_ = sim.p.L;
    const armMat = mats.metal();
    for (const ang of [0, Math.PI / 2]) { const a = new THREE.Mesh(new THREE.BoxGeometry(2 * L_ + 0.06, 0.025, 0.035), armMat); a.rotation.y = ang; drone.add(a); }
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.13), mats.dark()); drone.add(core);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 12), mats.lime()); nose.rotation.z = -Math.PI / 2; nose.position.set(0.1, 0.02, 0); drone.add(nose);
    // motor positions in sim body frame: 0:+x, 1:+y, 2:-x, 3:-y
    const pos = [[L_, 0, 0], [0, L_, 0], [-L_, 0, 0], [0, -L_, 0]];
    pos.forEach((p) => {
      const g = new THREE.Group(); g.position.copy(toThree(p)); drone.add(g);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), mats.dark()); g.add(motor);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.004, 32), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, transparent: true, opacity: 0.35, depthWrite: false }));
      disc.position.y = 0.03; g.add(disc);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.018), mats.lime()); blade.position.y = 0.035; g.add(blade);
      rotors.push({ disc, blade });
    });
    ghost = new THREE.AxesHelper(0.32); s.add(ghost); // estimated attitude
    targetDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0x5ee7ff })); s.add(targetDot);
    trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x5a7a10 }));
    trail.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3)); trail.frustumCulled = false; s.add(trail);
  } else fallback(L.view3d, 'The flight simulation and scope still run.');

  const P = new THREE.Matrix4(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4();
  const setRot = (obj, R) => {
    // three rotation = C R C^T where C maps sim axes to three axes
    const C = [[1, 0, 0], [0, 0, 1], [0, -1, 0]];
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let v = 0; for (let k = 0; k < 3; k++) for (let l = 0; l < 3; l++) v += C[i][k] * R[k][l] * C[j][l]; M[i][j] = v; }
    m4.set(M[0][0], M[0][1], M[0][2], 0, M[1][0], M[1][1], M[1][2], 0, M[2][0], M[2][1], M[2][2], 0, 0, 0, 0, 1);
    obj.quaternion.setFromRotationMatrix(m4);
  };
  const eulerToR = ([r, p, y]) => {
    const cr = Math.cos(r), sr = Math.sin(r), cp = Math.cos(p), sp = Math.sin(p), cy = Math.cos(y), sy = Math.sin(y);
    return [[cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr], [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr], [-sp, cp * sr, cp * cr]];
  };
  let spin = 0;
  const item = {
    el: L.sec, visible: false, sim,
    tick(dt) {
      sim.step(dt);
      const s = sim.state;
      scope.push([s.euler[0], s.est[0], s.accTilt[0]]); scope.draw();
      const anyKill = c.kill.some(Boolean);
      if (s.crashed) setBadge(L.badge, s.reason.startsWith('fly') ? 'FLY-AWAY' : 'CRASHED', 'bad');
      else if (anyKill) setBadge(L.badge, 'MOTOR OUT', 'bad');
      else if (s.attErr > 0.08) setBadge(L.badge, 'ESTIMATE DRIFTING', 'warn');
      else setBadge(L.badge, 'HOVERING');
      const d = (v) => (v * 57.2958).toFixed(1);
      L.readouts.innerHTML = `roll <b>${d(s.euler[0])}°</b>/<b>${d(s.est[0])}°</b> pitch <b>${d(s.euler[1])}°</b> z <b>${s.pos[2].toFixed(2)} m</b>`;
      L.sec.dataset.crashed = String(s.crashed); L.sec.dataset.z = s.pos[2].toFixed(3); L.sec.dataset.atterr = s.attErr.toFixed(4);
      if (st.ok) {
        drone.position.copy(toThree(s.pos));
        setRot(drone, quatToMat(sim.q));
        ghost.position.copy(drone.position); setRot(ghost, eulerToR(s.est));
        targetDot.position.copy(toThree(sim.ref));
        spin += dt * 40;
        rotors.forEach((r, i) => {
          const t = s.thrust[i] / sim.p.Tmax; r.blade.rotation.y = spin * (i % 2 ? 1 : -1) * (0.3 + t);
          r.disc.material.color.set(c.kill[i] ? 0xff4d4d : 0xc6ff1a); r.disc.material.opacity = c.kill[i] ? 0.5 : 0.12 + 0.5 * t;
        });
        const tp = trail.geometry.attributes.position.array;
        if (trailN < TRAIL) trailN++; else tp.copyWithin(0, 3);
        drone.position.toArray(tp, (trailN - 1) * 3);
        trail.geometry.setDrawRange(0, trailN); trail.geometry.attributes.position.needsUpdate = true;
        const tgtCam = new THREE.Vector3(drone.position.x * 0.5, 1.9, 3.4 - drone.position.z * 0.3);
        st.camera.position.lerp(tgtCam, 0.03); st.camera.lookAt(drone.position.x * 0.6, drone.position.y * 0.8 + 0.2, drone.position.z * 0.5);
        st.render();
      }
    },
  };
  if (st.ok) st.shadows(st.scene);
  bindPause(L, item);
  register(item);
  return item;
}
