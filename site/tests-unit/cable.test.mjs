// Closed-form checks of the cable-robot maths behind the Phase 21 simulator (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { G, cornerAnchors, ik, nullVector, particular, distribute, capacity, CableSim } from '../src/sim/cable.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b} (tol ${tol})`);
const A = cornerAnchors(7, 7, 3);
const weight = (m) => [0, 0, m * G];
const sumForce = (u, t) => [0, 1, 2].map((k) => u.reduce((s, v, i) => s + t[i] * v[k], 0));
const rand = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

test('IK: cable length is the anchor distance (closed form at the centre and a corner-side point)', () => {
  const { L, u } = ik(A, [0, 0, 1.5]);
  for (const l of L) near(l, Math.sqrt(3.5 ** 2 + 3.5 ** 2 + 1.5 ** 2), 1e-12);
  for (const v of u) near(Math.hypot(...v), 1, 1e-12);
  const k = ik(A, [1, -2, 0.5]);
  near(k.L[0], Math.hypot(-3.5 - 1, -3.5 + 2, 2.5), 1e-12); near(k.L[2], Math.hypot(3.5 - 1, 3.5 + 2, 2.5), 1e-12);
});

test('null vector: U n = 0 everywhere in the room', () => {
  for (let k = 0; k < 200; k++) {
    const { u } = ik(A, [(rand() - 0.5) * 6.8, (rand() - 0.5) * 6.8, 0.1 + rand() * 2.7]);
    const n = nullVector(u); const r = sumForce(u, n); const s = Math.hypot(...n);
    assert.ok(s > 1e-9); for (const x of r) near(x / s, 0, 1e-12);
  }
});

test('symmetric centre point: four equal tensions m g / (4 sin(theta))', () => {
  for (const z of [0.3, 1.0, 2.0, 2.7]) {
    const { u, L } = ik(A, [0, 0, z]);
    const s = distribute(u, weight(1.25));
    assert.equal(s.ok, true);
    const expect = (1.25 * G) / (4 * ((3 - z) / L[0]));
    for (const t of s.t) near(t, expect, 1e-9, `z=${z}`);
  }
});

test('tensions balance the weight: vertical components sum to m g, horizontal to zero, none negative', () => {
  for (let k = 0; k < 500; k++) {
    const p = [(rand() - 0.5) * 6.9, (rand() - 0.5) * 6.9, 0.05 + rand() * 2.8], m = 0.2 + rand() * 3;
    const { u } = ik(A, p); const s = distribute(u, weight(m));
    assert.equal(s.ok, true, `inside the footprint every point is force-feasible without a limit: ${p}`);
    const f = sumForce(u, s.t);
    near(f[2], m * G, 1e-8); near(f[0], 0, 1e-8); near(f[1], 0, 1e-8);
    for (const t of s.t) assert.ok(t >= -1e-9);
  }
});

test('the chosen distribution is the minimum-norm one among the feasible solutions (checked by brute force)', () => {
  for (let k = 0; k < 60; k++) {
    const p = [(rand() - 0.5) * 6, (rand() - 0.5) * 6, 0.2 + rand() * 2.4];
    const { u } = ik(A, p); const s = distribute(u, weight(1), { tMin: 0.5, tMax: 40 });
    if (!s.ok) continue;
    const tp = particular(u, weight(1)), n = s.n; let best = Infinity;
    for (let l = -60; l <= 60; l += 0.001) { const t = tp.map((x, i) => x + l * n[i]); if (t.every((x) => x >= 0.5 && x <= 40)) best = Math.min(best, Math.hypot(...t)); }
    near(Math.hypot(...s.t), best, 1e-3);
  }
});

test('capacity: closed form at the centre, brute force elsewhere', () => {
  for (const z of [0.5, 1.5, 2.5]) { const { L } = ik(A, [0, 0, z]); near(capacity(A, [0, 0, z], 28), (28 * 4 * ((3 - z) / L[0])) / G, 1e-9); }
  for (let k = 0; k < 40; k++) {
    const p = [(rand() - 0.5) * 6.5, (rand() - 0.5) * 6.5, 0.1 + rand() * 2.6];
    const { u } = ik(A, p); const tp = particular(u, [0, 0, G]), n = nullVector(u), ln = Math.hypot(...n);
    let best = Infinity; for (let l = -40; l <= 40; l += 0.0005) { const t = tp.map((x, i) => x + (l * n[i]) / ln); if (t.every((x) => x >= 0)) best = Math.min(best, Math.max(...t)); }
    near(capacity(A, p, 28), 28 / best, 1e-3 * (28 / best));
  }
  assert.ok(capacity(A, [3.4, 0, 2.9], 28) < capacity(A, [0, 0, 0.5], 28) / 10, 'high against a wall holds far less than the centre near the floor');
});

test('outside the anchor footprint a cable would have to push: slack', () => {
  const { u } = ik(A, [4.2, 0, 1]);
  const s = distribute(u, weight(1));
  assert.equal(s.reason, 'slack'); assert.ok(s.slack.some(Boolean));
});

test('over the tension limit near a high corner', () => {
  const { u } = ik(A, [3.3, 3.3, 2.8]); const s = distribute(u, weight(2), { tMax: 28 });
  assert.equal(s.reason, 'over'); assert.ok(Math.max(...s.t) > 28);
  const f = sumForce(u, s.t); near(f[2], 2 * G, 1e-8);
});

const amplitude = (sim, T) => { let a = 0; for (let t = 0; t < T; t += 1 / 60) { sim.step(1 / 60); if (t > T - 2) a = Math.max(a, sim.swingAngle()); } return a; };

test('pendulum: small swings on a fixed pivot have period 2 pi sqrt(l / g)', () => {
  const sim = new CableSim({ damping: false, air: 0 });
  sim.r[0] += 0.02; sim.solve(); // 0.04 rad
  let last = null, crossings = []; let prev = sim.r[0] - sim.p[0];
  for (let t = 0; t < 8; t += 0.001) { sim.step(0.001); const x = sim.r[0] - sim.p[0]; if (prev < 0 && x >= 0) crossings.push(t); prev = x; }
  const T = (crossings.at(-1) - crossings[0]) / (crossings.length - 1);
  near(T, 2 * Math.PI * Math.sqrt(0.5 / G), 0.004);
  void last;
});

test('swing damping: a kicked swing dies out with damping on and keeps ringing with it off', () => {
  const off = new CableSim({ damping: false }); off.kick(0.6); const aOff = amplitude(off, 8);
  const on = new CableSim({ damping: true }); on.kick(0.6); const aOn = amplitude(on, 8);
  assert.ok(aOff > 0.15, `undamped amplitude ${aOff}`); assert.ok(aOn < 0.005, `damped amplitude ${aOn}`);
});

test('at rest the cable forces on the pivot add up to the weight, and a long move respects 0.4 m/s', () => {
  const sim = new CableSim({ mass: 1.5, damping: false }); for (let i = 0; i < 300; i++) sim.step(1 / 60);
  const f = sumForce(sim.u, sim.state.t); near(f[2], 1.5 * G, 1e-3); near(f[0], 0, 1e-3);
  sim.setTarget(2.5, -2, 0.4); let vmax = 0;
  for (let i = 0; i < 60 * 30; i++) { sim.step(1 / 60); vmax = Math.max(vmax, Math.hypot(sim.pv[0], sim.pv[1], sim.pv[2])); }
  assert.ok(vmax <= 0.4 * 1.01, `peak speed ${vmax}`); assert.ok(sim.state.err < 0.01, `tracking error ${sim.state.err}`);
});

test('28 N safety relax: a hard push trips it, the gripper sinks to the floor, and re-arming only holds once the push is gone', () => {
  const sim = new CableSim({ mass: 1 });
  for (let i = 0; i < 120; i++) sim.step(1 / 60);
  assert.equal(sim.relaxed, false);
  sim.c.push = 60; for (let i = 0; i < 60 * 12 && !sim.onFloor; i++) sim.step(1 / 60);
  assert.equal(sim.relaxed, true); assert.equal(sim.onFloor, true); assert.ok(sim.r[2] < 0.05);
  sim.rearm(); for (let i = 0; i < 60 * 5; i++) sim.step(1 / 60); assert.equal(sim.relaxed, true, 'still pushed: lifts, then trips again');
  sim.c.push = 0; sim.rearm(); for (let i = 0; i < 60 * 10; i++) sim.step(1 / 60);
  assert.equal(sim.relaxed, false); assert.ok(sim.state.peak < 28);
});

test('a steady push with damping on leans the gripper but does not drive the pivot away', () => {
  const s = new CableSim({ mass: 1.25, relax: false });
  s.reset([0.8, 0.4, 0.9]); s.c.push = 15;
  for (let k = 0; k < 1200; k++) s.step(1 / 60);
  const st = s.state, e = Math.hypot(st.pivot[0] - 0.8, st.pivot[1] - 0.4);
  assert.ok(e < 0.05, `pivot drifted ${e.toFixed(3)} m`);
  // static lean: tan(alpha) = F / (m g)
  const d = st.gripper[0] - st.pivot[0], z = st.pivot[2] - st.gripper[2];
  assert.ok(Math.abs(Math.atan2(d, z) - Math.atan2(15, 1.25 * G)) < 0.01);
});
