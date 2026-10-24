// Headless checks that the lab physics behave as the lessons claim (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { PendulumSim } from '../src/sim/pendulum.js';
import { ArmSim } from '../src/sim/arm.js';
import { QuadSim } from '../src/sim/quad.js';
import { MotorSim } from '../src/sim/motor.js';

const run = (sim, T, f) => { for (let t = 0; t < T; t += 0.01) { sim.step(0.01); f && f(sim, t); } return sim.state; };

test('pendulum: tuned PID balances through a kick', () => {
  const s = run(new PendulumSim(), 12, (sim, t) => Math.abs(t - 4) < 0.005 && sim.kick());
  assert.equal(s.fallen, false);
});
test('pendulum: no D term -> falls', () => assert.equal(run(new PendulumSim({ D: false }), 12).fallen, true));
test('pendulum: 80 ms latency -> falls', () => assert.equal(run(new PendulumSim({ delayMs: 80 }), 15).fallen, true));
test('pendulum: unfiltered D with 3 deg noise -> falls', () => assert.equal(run(new PendulumSim({ noiseDeg: 3, dFilter: false }), 15).fallen, true));
test('pendulum: uncontrolled swing from near-hanging stays finite', () => {
  const p = new PendulumSim({ P: false, I: false, D: false, kx: 0, kv: 0 }); p.reset(Math.PI - 0.3); // hanging-ish, swings
  assert.ok(Number.isFinite(run(p, 2).theta));
});

test('arm: analytic IK reaches a reachable target', () => { const a = new ArmSim(); a.setTarget(0.9, 0.9); assert.ok(run(a, 4).error < 0.005); });
test('arm: DLS IK reaches a reachable target', () => { const a = new ArmSim({ ik: 'dls' }); a.setTarget(0.9, 0.9); assert.ok(run(a, 4).error < 0.005); });
test('arm: no gravity compensation -> steady-state sag', () => { const a = new ArmSim({ gravComp: false }); a.setTarget(0.9, 0.9); assert.ok(run(a, 4).error > 0.03); });
test('arm: unreachable target flagged', () => { const a = new ArmSim(); a.setTarget(3, 0); assert.equal(run(a, 1).unreachable, true); });
test('arm: FK(IK(x)) = x', () => { const a = new ArmSim(); a.setTarget(0.4, 1.2); const tip = a.fk(a.qd[0], a.qd[1]).tip; assert.ok(Math.hypot(tip[0] - 0.4, tip[1] - 1.2) < 1e-9); });

test('quad: complementary filter hovers and tracks', () => { const s = run(new QuadSim(), 12); assert.equal(s.crashed, false); assert.ok(s.attErr < 0.06); });
test('quad: killing a motor crashes', () => assert.equal(run(new QuadSim({ kill: [false, true, false, false] }), 8).crashed, true));
test('quad: accel-only estimate crashes', () => assert.equal(run(new QuadSim({ filter: 'accel' }), 12).crashed, true));
test('quad: gyro-only with bias drifts away', () => { let maxErr = 0; run(new QuadSim({ filter: 'gyro', gyroBias: true }), 10, (q) => (maxErr = Math.max(maxErr, q.state.attErr))); assert.ok(maxErr > 0.1); });

test('motor: PI holds setpoint under load', () => assert.ok(Math.abs(run(new MotorSim({ load: 0.1 }), 3).rpm - 2000) < 20));
test('motor: no integral -> droop under load', () => assert.ok(run(new MotorSim({ load: 0.1, integral: false }), 3).rpm < 1500));
test('motor: no-load open-loop speed ~ V/k', () => {
  const m = new MotorSim({ Kp: 0, Ki: 0, integral: false }); m.control = function () { this.V = 24; };
  const rpm = run(m, 3).rpm, ideal = (24 / 0.05) * 60 / (2 * Math.PI);
  assert.ok(Math.abs(rpm - ideal) / ideal < 0.02);
});
