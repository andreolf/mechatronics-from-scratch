// Brushed DC motor + flywheel + incremental encoder + PI speed controller.
// Electrical: L di/dt = V - R i - k w ; mechanical: J dw/dt = k i - b w - T_load (Coulomb-free).
// RK4 at 20 kHz; controller at 1 kHz using the quantised encoder count difference.
// Averaged PWM model (duty * Vbus). Educational approximation, illustrative parameters.
import { clamp, rk4, rk4Work } from './util.js';

export class MotorSim {
  constructor(opts = {}) {
    this.p = { R: 1.2, L: 0.002, k: 0.05, J: 2e-4, b: 2e-5, Vbus: 24 };
    this.c = { setRpm: 2000, load: 0, Kp: 0.12, Ki: 2.5, integral: true, antiWindup: true, cpr: 1024, speedFilter: true, ...opts };
    this.h = 5e-5; this.ctrlEvery = 20; this.work = rk4Work(3);
    this.reset();
  }
  reset() {
    this.x = new Float64Array([0, 0, 0]); // i, w, theta
    this.V = 0; this.integ = 0; this.t = 0; this.n = 0;
    this.lastCount = 0; this.wMeas = 0; this.wFilt = 0; this.saturated = false;
  }
  deriv = (s, out) => {
    const { R, L, k, J, b } = this.p, [i, w] = s;
    let Tl = this.c.load; // load opposes motion (viscous-like sign handling near zero speed)
    if (Math.abs(w) < 1) Tl *= w; else Tl *= Math.sign(w);
    out[0] = (this.V - R * i - k * w) / L;
    out[1] = (k * i - b * w - Tl) / J;
    out[2] = w;
  };
  control() {
    const c = this.c, Ts = this.h * this.ctrlEvery, cpr4 = 4 * c.cpr;
    const count = Math.floor((this.x[2] / (2 * Math.PI)) * cpr4);
    this.wMeas = ((count - this.lastCount) / cpr4) * 2 * Math.PI / Ts;
    this.lastCount = count;
    const a = c.speedFilter ? Math.exp(-Ts / 0.004) : 0;
    this.wFilt = a * this.wFilt + (1 - a) * this.wMeas;
    const ref = (c.setRpm * 2 * Math.PI) / 60, e = ref - this.wFilt;
    let u = c.Kp * e + (c.integral ? c.Ki * this.integ : 0);
    const Vmax = this.p.Vbus;
    this.saturated = Math.abs(u) > Vmax;
    if (c.integral && (!c.antiWindup || !this.saturated || Math.sign(e) !== Math.sign(u))) this.integ += e * Ts;
    if (!c.integral) this.integ = 0;
    this.V = clamp(u, -Vmax, Vmax);
  }
  step(dt) {
    const n = Math.round(dt / this.h);
    for (let i = 0; i < n; i++) {
      if (this.n % this.ctrlEvery === 0) this.control();
      this.n++;
      rk4(this.deriv, this.x, this.h, this.work);
      this.t += this.h;
    }
  }
  get state() {
    const toRpm = 60 / (2 * Math.PI);
    return { t: this.t, rpm: this.x[1] * toRpm, measRpm: this.wFilt * toRpm, setRpm: this.c.setRpm, current: this.x[0], volts: this.V, angle: this.x[2], saturated: this.saturated };
  }
}
