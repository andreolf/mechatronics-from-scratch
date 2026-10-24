// Two-link arm in a vertical plane: full Lagrangian rigid-body dynamics M(q)q'' + c(q,q') + g(q) = tau,
// RK4 at 1 kHz, joint PD servos with torque limits, optional gravity compensation,
// analytic or damped-least-squares IK, optional joint limits, elbow-motor kill switch.
// Educational approximation, illustrative parameters.
import { clamp, rk4, rk4Work } from './util.js';

const D2R = Math.PI / 180;
export const ARM_LIMITS = { q1: [0 * D2R, 180 * D2R], q2: [-135 * D2R, 135 * D2R] };

export class ArmSim {
  constructor(opts = {}) {
    this.p = { l1: 1.0, l2: 0.8, m1: 1.5, m2: 1.0, g: 9.81, b: 0.6, tauMax: [45, 25] };
    this.p.lc1 = this.p.l1 / 2; this.p.lc2 = this.p.l2 / 2;
    this.p.I1 = this.p.m1 * this.p.l1 ** 2 / 12; this.p.I2 = this.p.m2 * this.p.l2 ** 2 / 12;
    this.c = { Kp: [140, 90], Kd: [30, 16], gravComp: true, limits: true, elbowKilled: false, ik: 'analytic', lambda: 0.08, ...opts };
    this.h = 0.001; this.work = rk4Work(4);
    this.reset();
  }
  reset() {
    this.x = new Float64Array([60 * D2R, -70 * D2R, 0, 0]);
    this.qd = [this.x[0], this.x[1]];
    this.target = this.fk(this.qd[0], this.qd[1]).tip;
    this.tau = [0, 0]; this.t = 0;
    this.flags = { unreachable: false, limitHit: false, singular: false };
  }
  fk(q1, q2) {
    const { l1, l2 } = this.p;
    const elbow = [l1 * Math.cos(q1), l1 * Math.sin(q1)];
    const tip = [elbow[0] + l2 * Math.cos(q1 + q2), elbow[1] + l2 * Math.sin(q1 + q2)];
    return { elbow, tip };
  }
  jac(q1, q2) {
    const { l1, l2 } = this.p, s1 = Math.sin(q1), c1 = Math.cos(q1), s12 = Math.sin(q1 + q2), c12 = Math.cos(q1 + q2);
    return [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]];
  }
  gravity(q1, q2) {
    const { m1, m2, lc1, lc2, l1, g } = this.p;
    return [(m1 * lc1 + m2 * l1) * g * Math.cos(q1) + m2 * lc2 * g * Math.cos(q1 + q2), m2 * lc2 * g * Math.cos(q1 + q2)];
  }
  inLimits(q1, q2) {
    return q1 >= ARM_LIMITS.q1[0] && q1 <= ARM_LIMITS.q1[1] && q2 >= ARM_LIMITS.q2[0] && q2 <= ARM_LIMITS.q2[1];
  }
  setTarget(x, y) { this.target = [x, y]; this.solveIK(); }
  solveIK() {
    const { l1, l2 } = this.p; let [x, y] = this.target;
    const r = Math.hypot(x, y), rmax = l1 + l2 - 1e-3, rmin = Math.abs(l1 - l2) + 1e-3;
    this.flags.unreachable = r > rmax || r < rmin;
    if (this.flags.unreachable) { const s = clamp(r, rmin, rmax) / (r || 1); x *= s; y *= s; }
    let q;
    if (this.c.ik === 'analytic') {
      const c2 = clamp((x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1);
      const cands = [Math.acos(c2), -Math.acos(c2)].map((q2) => {
        const q1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(q2), l1 + l2 * Math.cos(q2));
        let a = q1; while (a < -Math.PI / 2) a += 2 * Math.PI; while (a > 1.5 * Math.PI) a -= 2 * Math.PI;
        return [a, q2];
      });
      let ok = this.c.limits ? cands.filter((cq) => this.inLimits(cq[0], cq[1])) : cands;
      const pick = ok.length ? ok : cands;
      const cur = this.qd;
      pick.sort((A, B) => Math.hypot(A[0] - cur[0], A[1] - cur[1]) - Math.hypot(B[0] - cur[0], B[1] - cur[1]));
      q = pick[0].slice();
      this.flags.limitHit = this.c.limits && ok.length === 0;
    } else {
      // damped least squares: dq = J^T (J J^T + lambda^2 I)^-1 e, iterated
      q = this.qd.slice(); const L2 = this.c.lambda ** 2;
      for (let it = 0; it < 30; it++) {
        const tip = this.fk(q[0], q[1]).tip, e = [x - tip[0], y - tip[1]];
        if (Math.hypot(e[0], e[1]) < 1e-5) break;
        const J = this.jac(q[0], q[1]);
        const a = J[0][0] ** 2 + J[0][1] ** 2 + L2, b = J[0][0] * J[1][0] + J[0][1] * J[1][1], d = J[1][0] ** 2 + J[1][1] ** 2 + L2;
        const det = a * d - b * b, w0 = (d * e[0] - b * e[1]) / det, w1 = (-b * e[0] + a * e[1]) / det;
        q[0] += J[0][0] * w0 + J[1][0] * w1; q[1] += J[0][1] * w0 + J[1][1] * w1;
        if (this.c.limits) { q[0] = clamp(q[0], ...ARM_LIMITS.q1); q[1] = clamp(q[1], ...ARM_LIMITS.q2); }
      }
      const tip = this.fk(q[0], q[1]).tip;
      this.flags.limitHit = this.c.limits && !this.flags.unreachable && Math.hypot(x - tip[0], y - tip[1]) > 0.02;
    }
    if (this.c.limits) { q[0] = clamp(q[0], ...ARM_LIMITS.q1); q[1] = clamp(q[1], ...ARM_LIMITS.q2); }
    this.qd = q;
  }
  deriv = (s, out) => {
    const { m1, m2, l1, lc1, lc2, I1, I2, b } = this.p;
    const [q1, q2, w1, w2] = s, c2 = Math.cos(q2), s2 = Math.sin(q2);
    const M11 = m1 * lc1 * lc1 + I1 + m2 * (l1 * l1 + lc2 * lc2 + 2 * l1 * lc2 * c2) + I2;
    const M12 = m2 * (lc2 * lc2 + l1 * lc2 * c2) + I2, M22 = m2 * lc2 * lc2 + I2;
    const h = m2 * l1 * lc2 * s2;
    const G = this.gravity(q1, q2);
    const r1 = this.tau[0] - (-h * (2 * w1 * w2 + w2 * w2)) - G[0] - b * w1;
    const r2 = this.tau[1] - (h * w1 * w1) - G[1] - b * w2;
    const det = M11 * M22 - M12 * M12;
    out[0] = w1; out[1] = w2;
    out[2] = (M22 * r1 - M12 * r2) / det; out[3] = (-M12 * r1 + M11 * r2) / det;
  };
  step(dt) {
    const n = Math.round(dt / this.h), c = this.c, x = this.x;
    for (let i = 0; i < n; i++) {
      const G = c.gravComp ? this.gravity(x[0], x[1]) : [0, 0];
      for (let j = 0; j < 2; j++) {
        this.tau[j] = clamp(c.Kp[j] * (this.qd[j] - x[j]) - c.Kd[j] * x[2 + j] + G[j], -this.p.tauMax[j], this.p.tauMax[j]);
      }
      if (c.elbowKilled) this.tau[1] = 0;
      rk4(this.deriv, x, this.h, this.work);
      if (c.limits) { // mechanical hard stops
        if (x[0] < ARM_LIMITS.q1[0] || x[0] > ARM_LIMITS.q1[1]) { x[0] = clamp(x[0], ...ARM_LIMITS.q1); x[2] = 0; }
        if (x[1] < ARM_LIMITS.q2[0] || x[1] > ARM_LIMITS.q2[1]) { x[1] = clamp(x[1], ...ARM_LIMITS.q2); x[3] = 0; }
      }
      this.t += this.h;
    }
    const J = this.jac(x[0], x[1]);
    this.manip = Math.abs(J[0][0] * J[1][1] - J[0][1] * J[1][0]);
    this.flags.singular = this.manip < 0.08;
  }
  get state() {
    const { tip } = this.fk(this.x[0], this.x[1]);
    return { t: this.t, q1: this.x[0], q2: this.x[1], tip, target: this.target, error: Math.hypot(tip[0] - this.target[0], tip[1] - this.target[1]), manip: this.manip, tau: this.tau.slice(), ...this.flags };
  }
}
