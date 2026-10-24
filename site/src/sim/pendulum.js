// Self-balancing robot as a cart-pole (inverted pendulum on a driven base).
// Nonlinear equations of motion (uniform rod, half-length l), RK4 at 1 kHz,
// PID on pole angle + PD on base position at 200 Hz, first-order actuator lag,
// sensor noise and latency. Educational approximation, illustrative parameters.
import { clamp, rng, rk4, rk4Work } from './util.js';

export const PENDULUM_DEFAULTS = {
  Kp: 38, Ki: 6, Kd: 7, // angle loop (N/rad, N/(rad s), N s/rad)
  kx: 1.6, kv: 2.6,       // base position loop (positive feedback is correct for this sign convention)
  P: true, I: true, D: true,
  noiseDeg: 0,            // std of angle sensor noise, degrees
  delayMs: 0,             // sensor latency
  dFilter: true,          // low-pass the derivative term
};

export class PendulumSim {
  constructor(opts = {}) {
    this.p = { M: 0.8, m: 0.25, l: 0.45, g: 9.81, Fmax: 30, tauAct: 0.02, rail: 2.0 };
    this.c = { ...PENDULUM_DEFAULTS, ...opts };
    this.h = 0.001; this.ctrlEvery = 5; // physics 1 kHz, control 200 Hz
    this.work = rk4Work(4);
    this.reset();
  }
  reset(theta0 = 0.06) {
    this.x = new Float64Array([0, 0, theta0, 0]); // x, xdot, theta, thetadot
    this.F = 0; this.Fcmd = 0; this.t = 0; this.k = 0;
    this.integ = 0; this.prevMeas = theta0; this.dState = 0;
    this.fallen = false; this.rand = rng(7);
    this.buf = []; this.measTheta = theta0;
  }
  kick(impulse = 0.9) { this.x[3] += impulse; }
  deriv = (s, out) => {
    const { M, m, l, g } = this.p;
    const [, xd, th, thd] = s;
    const F = this.fallen ? 0 : this.F;
    const sin = Math.sin(th), cos = Math.cos(th), tot = M + m;
    const temp = (F + m * l * thd * thd * sin) / tot;
    const thdd = (g * sin - cos * temp) / (l * (4 / 3 - (m * cos * cos) / tot)) - 0.02 * thd;
    const xdd = temp - (m * l * thdd * cos) / tot - 0.3 * xd;
    out[0] = xd; out[1] = xdd; out[2] = thd; out[3] = thdd;
  };
  control() {
    const c = this.c, dt = this.h * this.ctrlEvery;
    // sensor: noise + latency
    const noisy = this.x[2] + (c.noiseDeg * Math.PI / 180) * this.rand.gauss();
    this.buf.push(noisy);
    const lag = Math.round(c.delayMs / 1000 / dt);
    while (this.buf.length > lag + 1) this.buf.shift();
    const th = this.buf[0];
    this.measTheta = th;
    const rawD = (th - this.prevMeas) / dt; this.prevMeas = th;
    const a = c.dFilter ? Math.exp(-dt / 0.012) : 0;
    this.dState = a * this.dState + (1 - a) * rawD;
    if (c.I) this.integ = clamp(this.integ + th * dt, -0.5, 0.5); else this.integ = 0;
    const u = (c.P ? c.Kp * th : 0) + (c.I ? c.Ki * this.integ : 0) + (c.D ? c.Kd * this.dState : 0)
      + c.kx * this.x[0] + c.kv * this.x[1];
    this.Fcmd = clamp(u, -this.p.Fmax, this.p.Fmax);
  }
  step(dt) {
    const n = Math.round(dt / this.h);
    for (let i = 0; i < n; i++) {
      if (!this.fallen && this.k % this.ctrlEvery === 0) this.control();
      this.k++;
      this.F += (this.h / this.p.tauAct) * (this.Fcmd - this.F);
      rk4(this.deriv, this.x, this.h, this.work);
      this.t += this.h;
      // rail end stops
      if (Math.abs(this.x[0]) > this.p.rail) { this.x[0] = Math.sign(this.x[0]) * this.p.rail; this.x[1] = 0; }
      if (!this.fallen && Math.abs(this.x[2]) > 1.0) { this.fallen = true; this.Fcmd = 0; this.F = 0; }
      if (Math.abs(this.x[2]) > 1.5) { this.x[2] = Math.sign(this.x[2]) * 1.5; this.x[3] = 0; this.x[1] *= 0.9; }
    }
  }
  get state() {
    return { t: this.t, x: this.x[0], theta: this.x[2], thetaDot: this.x[3], force: this.F, fallen: this.fallen, measTheta: this.measTheta };
  }
}
