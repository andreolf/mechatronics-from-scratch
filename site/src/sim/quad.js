// Quadcopter (+ configuration) rigid-body simulation: Newton-Euler with quaternion attitude,
// first-order motor lag, semi-implicit Euler at 1 kHz. Simulated IMU (gyro noise + optional bias,
// accelerometer noise + propeller vibration) feeding a complementary filter, cascaded
// position -> attitude PD control, and a mixer. Motors can be killed. Educational approximation.
import { clamp, rng, wrapPi } from './util.js';

const qmul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
export const quatToMat = ([w, x, y, z]) => [
  [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
  [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
  [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
];
export const quatToEuler = ([w, x, y, z]) => [
  Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
  Math.asin(clamp(2 * (w * y - z * x), -1, 1)),
  Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
];

export class QuadSim {
  constructor(opts = {}) {
    this.p = { m: 1.0, L: 0.22, I: [0.012, 0.012, 0.022], kq: 0.016, Tmax: 6.5, tauM: 0.03, g: 9.81, drag: 0.25 };
    this.c = { filter: 'complementary', tauF: 1.0, gyroBias: false, vibration: 1.0, kill: [false, false, false, false], kpAtt: 55, kdAtt: 11, autoFly: true, ...opts };
    this.h = 0.001;
    this.reset();
  }
  reset() {
    this.pos = [0, 0, 1.2]; this.vel = [0, 0, 0]; this.q = [1, 0, 0, 0]; this.w = [0, 0, 0];
    this.T = [1, 1, 1, 1].map(() => (this.p.m * this.p.g) / 4); this.Tcmd = this.T.slice();
    this.est = [0, 0, 0]; this.t = 0; this.k = 0; this.zInt = 0; this.crashed = false; this.reason = ''; this.rand = rng(3);
    this.ref = [0, 0, 1.2]; this.accTilt = [0, 0]; this.gyro = [0, 0, 0]; this.acc = [0, 0, 9.81];
  }
  gust() { this.w[0] += 2.5; this.w[1] -= 1.5; this.vel[0] += 0.8; }
  imu(R) {
    const c = this.c, b = c.gyroBias ? [0.06, -0.04, 0.01] : [0, 0, 0], r = this.rand;
    this.gyro = this.w.map((v, i) => v + b[i] + 0.015 * r.gauss());
    // specific force in body frame: R^T (a + g z)
    const a = this.acc_world || [0, 0, 0], f = [a[0], a[1], a[2] + this.p.g];
    const vib = c.vibration;
    this.acc = [0, 1, 2].map((i) => R[0][i] * f[0] + R[1][i] * f[1] + R[2][i] * f[2] + (0.25 + 2.5 * vib) * r.gauss());
  }
  estimate(dt) {
    const [ax, ay, az] = this.acc, g = this.gyro, c = this.c;
    const accRoll = Math.atan2(ay, az), accPitch = Math.atan2(-ax, Math.hypot(ay, az));
    this.accTilt = [accRoll, accPitch];
    const gyroRoll = this.est[0] + g[0] * dt, gyroPitch = this.est[1] + g[1] * dt;
    if (c.filter === 'complementary') {
      const alpha = c.tauF / (c.tauF + dt); // crossover time constant tauF
      this.est[0] = alpha * gyroRoll + (1 - alpha) * accRoll;
      this.est[1] = alpha * gyroPitch + (1 - alpha) * accPitch;
    } else if (c.filter === 'gyro') { this.est[0] = gyroRoll; this.est[1] = gyroPitch; }
    else { this.est[0] = accRoll; this.est[1] = accPitch; }
    this.est[2] = wrapPi(this.est[2] + g[2] * dt);
  }
  control(dt) {
    const p = this.p, c = this.c, [phi, th, psi] = this.est;
    if (c.autoFly) { const s = this.t * 0.35; this.ref = [0.9 * Math.sin(s), 0.6 * Math.sin(2 * s), 1.2 + 0.25 * Math.sin(0.7 * s)]; }
    const ax = 1.6 * (this.ref[0] - this.pos[0]) - 2.0 * this.vel[0];
    const ay = 1.6 * (this.ref[1] - this.pos[1]) - 2.0 * this.vel[1];
    const cs = Math.cos(psi), sn = Math.sin(psi);
    const thD = clamp((ax * cs + ay * sn) / p.g, -0.35, 0.35), phD = clamp((ax * sn - ay * cs) / p.g, -0.35, 0.35);
    this.zInt = clamp(this.zInt + (this.ref[2] - this.pos[2]) * dt, -2, 2);
    const az = 4 * (this.ref[2] - this.pos[2]) - 3.2 * this.vel[2] + 1.0 * this.zInt;
    const Tsum = clamp((p.m * (p.g + az)) / Math.max(0.5, Math.cos(phi) * Math.cos(th)), 0, 4 * p.Tmax);
    const g = this.gyro;
    const tx = p.I[0] * (c.kpAtt * (phD - phi) - c.kdAtt * g[0]);
    const ty = p.I[1] * (c.kpAtt * (thD - th) - c.kdAtt * g[1]);
    const tz = p.I[2] * (4 * wrapPi(0 - psi) - 2.5 * g[2]);
    const a = Tsum / 4, bx = tx / (2 * p.L), by = ty / (2 * p.L), bz = tz / (4 * p.kq);
    this.Tcmd = [a - by - bz, a + bx + bz, a + by - bz, a - bx + bz].map((v) => clamp(v, 0, p.Tmax));
  }
  step(dt) {
    const n = Math.round(dt / this.h), p = this.p, h = this.h;
    for (let i = 0; i < n; i++) {
      const R = quatToMat(this.q);
      if (this.k % 2 === 0) { this.imu(R); this.estimate(2 * h); if (!this.crashed) this.control(2 * h); }
      this.k++;
      for (let j = 0; j < 4; j++) {
        const cmd = this.crashed || this.c.kill[j] ? 0 : this.Tcmd[j];
        this.T[j] += (h / p.tauM) * (cmd - this.T[j]);
      }
      const T = this.T, Ts = T[0] + T[1] + T[2] + T[3];
      const tau = [p.L * (T[1] - T[3]), p.L * (T[2] - T[0]), p.kq * (T[1] + T[3] - T[0] - T[2])];
      const acc = [0, 1, 2].map((k) => (R[k][2] * Ts) / p.m - (p.drag * this.vel[k]) / p.m);
      acc[2] -= p.g;
      this.acc_world = acc;
      const I = p.I, w = this.w;
      const Iw = [I[0] * w[0], I[1] * w[1], I[2] * w[2]];
      const gyroT = [w[1] * Iw[2] - w[2] * Iw[1], w[2] * Iw[0] - w[0] * Iw[2], w[0] * Iw[1] - w[1] * Iw[0]];
      for (let k = 0; k < 3; k++) { this.w[k] += (h * (tau[k] - gyroT[k] - 0.002 * w[k])) / I[k]; this.vel[k] += h * acc[k]; this.pos[k] += h * this.vel[k]; }
      const dq = qmul(this.q, [0, this.w[0], this.w[1], this.w[2]]);
      this.q = this.q.map((v, k) => v + 0.5 * h * dq[k]);
      const nq = Math.hypot(...this.q); this.q = this.q.map((v) => v / nq);
      if (!this.crashed && Math.hypot(this.pos[0], this.pos[1]) > 3.5) { this.crashed = true; this.reason = 'fly-away: left the safety cage'; }
      if (this.pos[2] < 0.05) { // ground contact
        const tilt = Math.acos(clamp(R[2][2], -1, 1));
        if (!this.crashed && (this.vel[2] < -2.5 || tilt > 1.0)) { this.crashed = true; this.reason = 'hit the ground'; }
        this.pos[2] = 0.05; this.vel[2] = Math.max(0, this.vel[2]); this.vel[0] *= 0.95; this.vel[1] *= 0.95; this.w = this.w.map((v) => v * 0.9);
      }
      this.t += h;
    }
  }
  get state() {
    const eul = quatToEuler(this.q);
    return { t: this.t, pos: this.pos.slice(), euler: eul, est: this.est.slice(), accTilt: this.accTilt.slice(), thrust: this.T.slice(), crashed: this.crashed, reason: this.reason, attErr: Math.hypot(eul[0] - this.est[0], eul[1] - this.est[1]) };
  }
}
