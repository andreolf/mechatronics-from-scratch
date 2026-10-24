import * as THREE from 'three';
import { ArmSim, ARM_LIMITS } from '../sim/arm.js';
import { Stage, register, fallback, mats, grid } from '../stage.js';
import { Scope } from '../scope.js';
import { labShell, toggle, slider, select, group, row, button, setBadge } from '../ui.js';

export function armLab(root) {
  const sim = new ArmSim();
  const L = labShell({
    id: 'arm', num: '02', title: 'Robot arm: inverse kinematics with real joints',
    blurb: 'Two links in a vertical plane with full M(q), C(q,q̇), g(q) dynamics. Drag the target. Compare analytic and damped-least-squares IK, switch off gravity compensation or joint limits, or kill the elbow motor.',
    lessons: [['p15-l06', 'Analytic IK'], ['p15-l08', 'Damped least squares'], ['p15-l11', 'Joint limits'], ['p15-l13', 'Lagrangian dynamics']],
  });
  root.append(L.sec);
  const scope = new Scope(L.scope, [
    { label: 'tip error ×10', color: '#c6ff1a', range: [0, 2] },
    { label: 'τ shoulder', color: '#5ee7ff', range: [-50, 50], width: 1.2 },
    { label: 'τ elbow', color: '#ff9f1c', range: [-50, 50], width: 1.2 },
  ]);
  L.note.textContent = 'drag in the view to move the target';
  const c = sim.c;
  let auto = true, autoT = 0;
  const tAuto = toggle('Auto target', true, (v) => (auto = v), { id: 'arm-auto' });
  L.controls.append(
    group('IK solver',
      select('Method', [['analytic', 'Analytic (law of cosines)'], ['dls', 'Damped least squares (Jacobian)']], c.ik, (v) => { c.ik = v; sim.solveIK(); }, 'arm-ik'),
      slider('DLS damping λ', { min: 0.005, max: 0.5, step: 0.005, value: c.lambda, fmt: (v) => v.toFixed(3), id: 'arm-lambda' }, (v) => { c.lambda = v; sim.solveIK(); })),
    group('Break it', row(
      toggle('Joint limits', c.limits, (v) => { c.limits = v; sim.solveIK(); }, { id: 'arm-limits' }),
      toggle('Gravity comp.', c.gravComp, (v) => (c.gravComp = v), { id: 'arm-grav' }),
      toggle('Kill elbow motor', false, (v) => (c.elbowKilled = v), { id: 'arm-kill', danger: true }))),
    group('Target', row(tAuto, button('Reset', () => { sim.reset(); scope.clear(); }, 'arm-reset'))),
  );

  const st = new Stage(L.view3d, { fov: 40, pos: [0.3, 0.95, 3.7], look: [0.3, 0.8, 0] });
  let link1, link2, tgt, ws, reach;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ORIGIN_Y = 0.1;
  if (st.ok) {
    const s = st.scene; s.add(grid(10, 20));
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.1, 32), mats.dark()); table.position.y = 0.05; s.add(table);
    // workspace annulus
    const { l1, l2 } = sim.p;
    ws = new THREE.Mesh(new THREE.RingGeometry(Math.abs(l1 - l2), l1 + l2, 96, 1, 0, Math.PI * 2), new THREE.MeshBasicMaterial({ color: 0xc6ff1a, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false }));
    ws.position.set(0, ORIGIN_Y, -0.02); s.add(ws);
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, l1 + l2, 0, Math.PI * 2).getPoints(128)), new THREE.LineBasicMaterial({ color: 0x3d4d12 }));
    edge.position.set(0, ORIGIN_Y, -0.02); s.add(edge);
    reach = edge;
    const mkLink = (len, r, mat) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(len, r, r), mat); m.position.x = len / 2; g.add(m); const j = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, r * 1.3, 24), mats.dark()); j.rotation.x = Math.PI / 2; g.add(j); return g; };
    link1 = mkLink(l1, 0.11, mats.metal()); link1.position.y = ORIGIN_Y; s.add(link1);
    link2 = mkLink(l2, 0.085, mats.lime()); link2.position.x = l1; link1.add(link2);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), mats.dark()); tip.position.x = l2; link2.add(tip);
    tgt = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 12, 40), new THREE.MeshBasicMaterial({ color: 0xc6ff1a })); s.add(tgt);
    const cv = st.renderer.domElement;
    let dragging = false;
    const move = (e) => { const p = st.pick(e.clientX, e.clientY, plane); if (p) { sim.setTarget(p.x, p.y - ORIGIN_Y); } };
    cv.addEventListener('pointerdown', (e) => { dragging = true; auto = false; tAuto.set(false); cv.setPointerCapture(e.pointerId); move(e); });
    cv.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    cv.addEventListener('pointerup', () => (dragging = false));
    cv.addEventListener('pointercancel', () => (dragging = false));
  } else fallback(L.view3d, 'Simulation, IK and scope still run; use Auto target.');

  const item = {
    el: L.sec, visible: false, sim,
    tick(dt) {
      if (auto) { autoT += dt; const a = autoT * 0.6; sim.setTarget(0.25 + 0.95 * Math.sin(a), 0.85 + 0.55 * Math.sin(2 * a)); }
      sim.step(dt);
      const s = sim.state;
      scope.push([s.error * 10, s.tau[0], s.tau[1]]); scope.draw();
      if (c.elbowKilled) setBadge(L.badge, 'ELBOW MOTOR OFF', 'bad');
      else if (s.unreachable) setBadge(L.badge, 'UNREACHABLE', 'warn');
      else if (s.limitHit) setBadge(L.badge, 'JOINT LIMIT', 'warn');
      else if (s.singular) setBadge(L.badge, 'NEAR SINGULAR', 'warn');
      else setBadge(L.badge, s.error < 0.02 ? 'TRACKING' : 'MOVING');
      L.readouts.innerHTML = `q1 <b>${(s.q1 * 57.3).toFixed(0)}°</b> q2 <b>${(s.q2 * 57.3).toFixed(0)}°</b> err <b>${(s.error * 1000).toFixed(0)} mm</b> det J <b>${s.manip.toFixed(2)}</b>`;
      L.sec.dataset.error = s.error.toFixed(4); L.sec.dataset.q2 = s.q2.toFixed(4);
      if (st.ok) {
        link1.rotation.z = s.q1; link2.rotation.z = s.q2;
        tgt.position.set(s.target[0], s.target[1] + ORIGIN_Y, 0);
        tgt.material.color.set(s.unreachable || s.limitHit ? 0xff9f1c : 0xc6ff1a);
        tgt.rotation.y += dt;
        st.render();
      }
    },
  };
  register(item);
  return item;
}
