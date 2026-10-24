import * as THREE from 'three';
import { MotorSim } from '../sim/motor.js';
import { Stage, register, fallback, mats, grid } from '../stage.js';
import { Scope } from '../scope.js';
import { labShell, toggle, slider, select, group, row, button, setBadge } from '../ui.js';

export function motorLab(root) {
  const sim = new MotorSim();
  const L = labShell({
    id: 'motor', num: '04', title: 'DC motor + encoder: PI speed control',
    blurb: 'Electrical and mechanical motor equations integrated with RK4 at 20 kHz, a quadrature encoder quantising position, and a 1 kHz PI loop with anti-windup. Add load torque, switch off the integrator, or swap in a coarse encoder and watch the current chatter.',
    lessons: [['p09-l02', 'DC motor model'], ['p07-l07', 'Optical encoders'], ['p13-l06', 'PI control'], ['p13-l09', 'Anti-windup']],
  });
  root.append(L.sec);
  const scope = new Scope(L.scope, [
    { label: 'setpoint', color: '#4b5340', range: [-200, 5000], width: 1 },
    { label: 'speed true', color: '#c6ff1a', range: [-200, 5000] },
    { label: 'speed measured', color: '#5ee7ff', range: [-200, 5000], width: 1 },
    { label: 'current', color: '#ff9f1c', range: [-12, 12], width: 1 },
  ]);
  L.note.textContent = 'display slowed ×1/25 to avoid strobing';
  const c = sim.c;
  L.controls.append(
    group('Command',
      slider('Speed setpoint', { min: 0, max: 4500, step: 50, value: c.setRpm, fmt: (v) => v + ' rpm', id: 'motor-rpm' }, (v) => (c.setRpm = v)),
      slider('Load torque', { min: 0, max: 0.3, step: 0.01, value: c.load, fmt: (v) => v.toFixed(2) + ' N·m', id: 'motor-load' }, (v) => (c.load = v))),
    group('Controller',
      slider('Kp  [V/(rad/s)]', { min: 0.01, max: 0.5, step: 0.01, value: c.Kp, fmt: (v) => v.toFixed(2), id: 'motor-kp' }, (v) => (c.Kp = v)),
      row(toggle('Integral', c.integral, (v) => (c.integral = v), { id: 'motor-int' }), toggle('Anti-windup', c.antiWindup, (v) => (c.antiWindup = v), { id: 'motor-aw' }), toggle('Speed filter', c.speedFilter, (v) => (c.speedFilter = v), { id: 'motor-filt' }))),
    group('Break it',
      select('Encoder resolution', [['4', '4 CPR (awful)'], ['16', '16 CPR'], ['64', '64 CPR'], ['256', '256 CPR'], ['1024', '1024 CPR'], ['4096', '4096 CPR']], String(c.cpr), (v) => (c.cpr = +v), 'motor-cpr')),
    row(button('Load step', () => { c.load = c.load > 0 ? 0 : 0.15; const el = L.controls.querySelector('[data-testid="motor-load"]'); el.value = c.load; el.dispatchEvent(new Event('input')); }, 'motor-step'),
      button('Reset', () => { sim.reset(); scope.clear(); }, 'motor-reset')),
  );

  const st = new Stage(L.view3d, { fov: 36, pos: [2.2, 1.6, 3.6], look: [0.2, 0.55, 0] });
  let rotor, encoder, brake, brakeMat;
  if (st.ok) {
    const s = st.scene; s.add(grid(10, 20));
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 40), mats.metal()); can.rotation.z = Math.PI / 2; can.position.set(-0.55, 0.55, 0); s.add(can);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 40), mats.lime()); cap.rotation.z = Math.PI / 2; cap.position.set(-0.08, 0.55, 0); s.add(cap);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.5), mats.dark()); foot.position.set(-0.55, 0.12, 0); s.add(foot);
    rotor = new THREE.Group(); rotor.position.set(0, 0.55, 0); s.add(rotor);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 16), mats.metal()); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.55; rotor.add(shaft);
    const fly = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 48), mats.dark()); fly.rotation.z = Math.PI / 2; fly.position.x = 0.7; rotor.add(fly);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.4), mats.lime()); sp.position.set(0.7, 0, 0); sp.rotation.x = (k * Math.PI) / 3; rotor.add(sp); }
    encoder = new THREE.Group(); encoder.position.x = 0.25; rotor.add(encoder);
    brakeMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x000000 });
    brake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.12), brakeMat); brake.position.set(0.7, 0.98, 0); s.add(brake);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.1), mats.dark()); head.position.set(0.25, 0.98, 0); s.add(head);
    buildEncoder(c.cpr);
  } else fallback(L.view3d, 'The motor simulation and scope still run.');
  let shownCpr = c.cpr;
  function buildEncoder(cpr) {
    while (encoder.children.length) encoder.remove(encoder.children[0]);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.015, 64), new THREE.MeshStandardMaterial({ color: 0x0f1a00, transparent: true, opacity: 0.85 }));
    disk.rotation.z = Math.PI / 2; encoder.add(disk);
    const n = Math.min(cpr, 128), tick = mats.lime();
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, w = Math.min(0.12, (Math.PI * 0.6) / n);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, Math.max(0.006, w * 0.34)), tick);
      t.position.set(0, Math.cos(a) * 0.32, Math.sin(a) * 0.32); t.rotation.x = -a; encoder.add(t);
    }
  }
  const item = {
    el: L.sec, visible: false, sim,
    tick(dt) {
      sim.step(dt);
      const s = sim.state;
      scope.push([s.setRpm, s.rpm, s.measRpm, s.current]); scope.draw();
      const err = Math.abs(s.rpm - s.setRpm);
      if (s.saturated) setBadge(L.badge, 'VOLTAGE SATURATED', 'warn');
      else if (err > Math.max(80, 0.05 * s.setRpm)) setBadge(L.badge, 'OFF SETPOINT', 'warn');
      else setBadge(L.badge, 'ON SPEED');
      L.readouts.innerHTML = `ω <b>${s.rpm.toFixed(0)} rpm</b> i <b>${s.current.toFixed(2)} A</b> V <b>${s.volts.toFixed(1)} V</b>`;
      L.sec.dataset.rpm = s.rpm.toFixed(1);
      if (st.ok) {
        if (shownCpr !== c.cpr) { shownCpr = c.cpr; buildEncoder(c.cpr); }
        rotor.rotation.x = -s.angle / 25;
        brakeMat.emissive.setRGB(Math.min(1, c.load / 0.2) * 0.9, Math.min(1, c.load / 0.2) * 0.25, 0);
        st.render();
      }
    },
  };
  register(item);
  return item;
}
