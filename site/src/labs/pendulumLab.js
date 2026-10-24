import * as THREE from 'three';
import { PendulumSim, PENDULUM_DEFAULTS } from '../sim/pendulum.js';
import { Stage, register, fallback, mats, grid } from '../stage.js';
import { Scope } from '../scope.js';
import { labShell, bindPause, toggle, slider, group, row, button, setBadge } from '../ui.js';

export function pendulumLab(root) {
  const sim = new PendulumSim();
  const L = labShell({
    id: 'pendulum', num: '01', title: 'Self-balancing robot: PID on a falling stick',
    blurb: 'A cart-pole: nonlinear rigid-body equations integrated with RK4 at 1 kHz, PID at 200 Hz, a 20 ms actuator lag. Switch off P, I or D, add sensor noise or latency, kick it, and watch it fall.',
    lessons: [['p12-l11', 'Cart-pole EoM'], ['p13-l07', 'PID'], ['p13-l08', 'Derivative filtering'], ['p14-l07', 'LQR on the cart-pole']],
  });
  root.append(L.sec);
  const scope = new Scope(L.scope, [
    { label: 'θ true', color: '#c6ff1a', range: [-0.4, 0.4] },
    { label: 'θ sensed', color: '#5b6450', range: [-0.4, 0.4], width: 1 },
    { label: 'force', color: '#ff9f1c', range: [-32, 32], width: 1.2 },
  ]);
  L.note.textContent = 'Physics: RK4 at 1 kHz. Control: PID at 200 Hz.';

  // controls
  const c = sim.c;
  const tP = toggle('P', c.P, (v) => (c.P = v), { id: 'pend-P' });
  const tI = toggle('I', c.I, (v) => (c.I = v), { id: 'pend-I' });
  const tD = toggle('D', c.D, (v) => (c.D = v), { id: 'pend-D' });
  const tF = toggle('D-filter', c.dFilter, (v) => (c.dFilter = v), { id: 'pend-dfilter' });
  L.controls.append(
    group('Controller terms', row(tP, tI, tD, tF)),
    group('Gains',
      slider('Kp  [N/rad]', { min: 0, max: 80, step: 1, value: c.Kp, id: 'pend-kp' }, (v) => (c.Kp = v)),
      slider('Kd  [N·s/rad]', { min: 0, max: 16, step: 0.5, value: c.Kd, id: 'pend-kd' }, (v) => (c.Kd = v))),
    group('Break it',
      slider('Sensor noise σ', { min: 0, max: 5, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + '°', id: 'pend-noise' }, (v) => (c.noiseDeg = v)),
      slider('Sensor latency', { min: 0, max: 120, step: 5, value: 0, fmt: (v) => v + ' ms', id: 'pend-delay' }, (v) => (c.delayMs = v))),
    row(button('Kick', () => sim.kick(1.1), 'pend-kick'), button('Reset', () => { sim.reset(); scope.clear(); }, 'pend-reset'),
      button('Defaults', () => { Object.assign(c, PENDULUM_DEFAULTS); [tP, tI, tD, tF].forEach((t, i) => t.set([c.P, c.I, c.D, c.dFilter][i])); sim.reset(); scope.clear(); syncSliders(); }, 'pend-defaults')),
  );
  function syncSliders() {
    for (const [id, v] of [['pend-kp', c.Kp], ['pend-kd', c.Kd], ['pend-noise', c.noiseDeg], ['pend-delay', c.delayMs]]) {
      const el = L.controls.querySelector(`[data-testid="${id}"]`); el.value = v; el.dispatchEvent(new Event('input'));
    }
  }

  // 3D
  const st = new Stage(L.view3d, { fov: 38, pos: [0, 1.0, 3.3], look: [0, 0.5, 0] });
  let cart, pole, arrow;
  if (st.ok) {
    const s = st.scene;
    st.floor(12);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.04, 0.12), mats.dark()); rail.position.y = 0.02; s.add(rail);
    for (const x of [-2.3, 2.3]) { const stop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.2), mats.metal()); stop.position.set(x, 0.1, 0); s.add(stop); }
    cart = new THREE.Group(); s.add(cart);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.34), mats.metal()); body.position.y = 0.17; cart.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.03, 0.35), mats.lime()); stripe.position.y = 0.2; cart.add(stripe);
    for (const x of [-0.17, 0.17]) for (const z of [-0.18, 0.18]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), mats.dark()); w.rotation.x = Math.PI / 2; w.position.set(x, 0.075, z); cart.add(w);
    }
    pole = new THREE.Group(); pole.position.y = 0.26; cart.add(pole);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 16), mats.lime()); rod.position.y = 0.45; pole.add(rod);
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 16), mats.lime()); bob.position.y = 0.9; pole.add(bob);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), mats.dark()); pole.add(hub);
    arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.17, 0.25), 0.3, 0xff9f1c, 0.08, 0.06); cart.add(arrow);
  } else fallback(L.view3d, 'The simulation and scope below still run.');

  const item = {
    el: L.sec, visible: false, sim,
    tick(dt) {
      sim.step(dt);
      const s = sim.state;
      scope.push([s.theta, s.measTheta, s.force]); scope.draw();
      if (s.fallen) setBadge(L.badge, 'FALLEN', 'bad');
      else if (Math.abs(s.theta) > 0.3) setBadge(L.badge, 'RECOVERING', 'warn');
      else setBadge(L.badge, 'BALANCING');
      L.readouts.innerHTML = `θ <b>${(s.theta * 57.2958).toFixed(1)}°</b> F <b>${s.force.toFixed(1)} N</b> x <b>${s.x.toFixed(2)} m</b>`;
      L.sec.dataset.theta = s.theta.toFixed(4); L.sec.dataset.fallen = String(s.fallen);
      if (st.ok) {
        cart.position.x = s.x; pole.rotation.z = -s.theta;
        const f = s.force, len = Math.min(0.9, Math.abs(f) / 30 * 0.9) + 0.01;
        arrow.setDirection(new THREE.Vector3(Math.sign(f) || 1, 0, 0)); arrow.setLength(len, Math.min(0.08, len * 0.5), 0.06);
        st.camera.position.x += (s.x * 0.5 - st.camera.position.x) * 0.05;
        st.camera.lookAt(st.camera.position.x, 0.5, 0);
        st.render();
      }
    },
  };
  if (st.ok) st.shadows(st.scene);
  bindPause(L, item);
  register(item);
  return item;
}
