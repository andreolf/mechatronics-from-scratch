// Widgets for Phase 13 (classical control). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const rect = (P, x0, y0, x1, y1, fill, stroke) => P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
function rk4(f, x, dt) {
  const n = x.length, k1 = f(x), t = new Array(n);
  for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k1[i];
  const k2 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k2[i];
  const k3 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt * k3[i];
  const k4 = f(t); const o = new Array(n);
  for (let i = 0; i < n; i++) o[i] = x[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return o;
}
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
const logspace = (a, b, n) => linspace(a, b, n).map((v) => 10 ** v);
const deg = (r) => r * 180 / Math.PI;
// complex numbers as [re, im]
const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cab = (a) => Math.hypot(a[0], a[1]);
const pv = (p, s) => p.reduce((acc, c) => { const m = cm(acc, s); return [m[0] + c, m[1]]; }, [0, 0]);
const pmul = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { o[i + j] += x * y; })); return o; };
const padd = (a, b) => { const n = Math.max(a.length, b.length), o = new Array(n).fill(0); a.forEach((x, i) => { o[n - a.length + i] += x; }); b.forEach((x, i) => { o[n - b.length + i] += x; }); return o; };
const fr = (num, den, w) => cdv(pv(num, [0, w]), pv(den, [0, w]));
// unwrapped phase along a frequency grid
function unwrap(ph) { const o = [ph[0]]; for (let i = 1; i < ph.length; i++) { let d = ph[i] - ph[i - 1]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; o.push(o[i - 1] + d); } return o; }
// polynomial roots (Durand-Kerner), coefficients highest power first
function roots(p) {
  const a = p.map((c) => c / p[0]), n = a.length - 1; if (n < 1) return [];
  let z = Array.from({ length: n }, (_, i) => { const r = 1 + Math.abs(a[n]) ** (1 / n); return [r * Math.cos(0.4 + 2 * Math.PI * i / n), r * Math.sin(0.4 + 2 * Math.PI * i / n)]; });
  for (let it = 0; it < 300; it++) {
    let mv = 0;
    z = z.map((zi, i) => { let d = [1, 0]; z.forEach((zj, j) => { if (j !== i) d = cm(d, [zi[0] - zj[0], zi[1] - zj[1]]); }); const st = cdv(pv(a, zi), d); mv = Math.max(mv, cab(st)); return [zi[0] - st[0], zi[1] - st[1]]; });
    if (mv < 1e-12) break;
  }
  return z;
}
// simulate a proper transfer function num/den driven by u(t); controllable canonical form, RK4
function tfsim(num, den, u, T, dt, every = 1) {
  const a = den.map((c) => c / den[0]), n = a.length - 1, b = new Array(n + 1 - num.length).fill(0).concat(num.map((c) => c / den[0]));
  const Cc = []; for (let k = 1; k <= n; k++) Cc.push(b[k] - a[k] * b[0]);
  let x = new Array(n).fill(0), t = 0; const ts = [], ys = [];
  const out = (x, uu) => { let y = b[0] * uu; for (let k = 1; k <= n; k++) y += Cc[k - 1] * x[n - k]; return y; };
  const N = Math.round(T / dt);
  for (let i = 0; i <= N; i++) {
    if (i % every === 0) { ts.push(t); ys.push(out(x, u(t))); }
    const uu = u(t + dt / 2);
    x = rk4((q) => { const d = q.slice(1); let s = uu; for (let k = 1; k <= n; k++) s -= a[k] * q[n - k]; d.push(s); return d; }, x, dt); t += dt;
  }
  return { ts, ys };
}
// first time a function on a grid crosses a level from above (or below), linear interpolation
function crossing(ws, vs, level, down = true) {
  for (let i = 1; i < ws.length; i++) { const a = vs[i - 1] - level, b = vs[i] - level; if (down ? a >= 0 && b < 0 : a <= 0 && b > 0) return Math.exp(Math.log(ws[i - 1]) + (Math.log(ws[i]) - Math.log(ws[i - 1])) * a / (a - b)); }
  return null;
}

// p13-l01: open loop against closed loop under plant-gain error
W.fbrobust = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { dg: 30, K: 10 }; const tau = 0.5, G0 = 2;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 2], y: [0, 1.6], label: 'Output of an open-loop and a closed-loop controller when the plant gain is wrong' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'output' });
    const Gt = G0 * (1 + s.dg / 100), L = s.K * Gt, pre = (1 + s.K * G0) / (s.K * G0);
    P.line([0, 2], [1, 1], C.dim, 1.5, [4, 4]);
    P.fn((t) => Gt / G0 * (1 - Math.exp(-t / tau)), C.warn, 2.5);
    P.fn((t) => pre * L / (1 + L) * (1 - Math.exp(-t * (1 + L) / tau)), C.lime, 2.5);
    const eo = (Gt / G0 - 1) * 100, ec = (pre * L / (1 + L) - 1) * 100;
    read.innerHTML = `true plant gain ${Gt.toFixed(2)} (model 2) · ${sp(C.warn, 'open loop')} error ${eo.toFixed(1)} % · ${sp(C.lime, 'closed loop')} (K = ${s.K}) error ${ec.toFixed(2)} % · ${Math.abs(ec) > 1e-9 ? (Math.abs(eo / ec)).toFixed(0) + '× smaller' : 'no error'} · closed-loop τ ${(1000 * tau / (1 + L)).toFixed(0)} ms`;
  };
  ctrls.append(slider('Plant gain error', { min: -50, max: 50, step: 5, value: s.dg, fmt: (v) => (v > 0 ? '+' : '') + v + ' %' }, (v) => { s.dg = v; p.redraw(); }),
    slider('Controller gain K', { min: 1, max: 50, step: 1, value: s.K, fmt: (v) => String(v) }, (v) => { s.K = v; p.redraw(); }));
  p.redraw();
};

// p13-l02: load step on the motor, open loop against P feedback
W.loadstep = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Kp: 0.5, tl: 0.05 }; const R = 1.2, k = 0.05, J = 2e-4, b = 2e-5, beta = k * k / R + b, wr = 2000 * 2 * Math.PI / 60;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 1.2], y: [1500, 2100], label: 'Motor speed through a load step, open loop and with proportional feedback' });
  p.draw = (P) => {
    const dOpen = s.tl / beta, L = k * s.Kp / (R * beta), dCl = dOpen / (1 + L);
    const rpm = (w) => w * 60 / (2 * Math.PI), lo = rpm(wr - dOpen);
    P.setRange([0, 1.2], [Math.min(1700, lo - 40), 2060]); P.axes({ xl: 't (s)', yl: 'rpm' });
    const tO = J / beta, tC = J / (beta * (1 + L));
    P.line([0, 1.2], [2000, 2000], C.dim, 1.5, [4, 4]);
    P.fn((t) => rpm(wr - (t < 0.2 ? 0 : dOpen * (1 - Math.exp(-(t - 0.2) / tO)))), C.warn, 2.5, null, 600);
    P.fn((t) => rpm(wr - (t < 0.2 ? 0 : dCl * (1 - Math.exp(-(t - 0.2) / tC)))), C.lime, 2.5, null, 600);
    read.innerHTML = `load ${s.tl.toFixed(3)} N·m at 0.2 s · ${sp(C.warn, 'fixed voltage')}: drop ${rpm(dOpen).toFixed(0)} rpm, τ ${(1000 * tO).toFixed(0)} ms · ${sp(C.lime, 'P feedback')}: loop gain ${L.toFixed(1)}, drop ${rpm(dCl).toFixed(1)} rpm (÷${(1 + L).toFixed(1)}), τ ${(1000 * tC).toFixed(1)} ms`;
  };
  ctrls.append(slider('K_p', { min: 0, max: 2, step: 0.05, value: s.Kp, fmt: (v) => v.toFixed(2) + ' V/(rad/s)' }, (v) => { s.Kp = v; p.redraw(); }),
    slider('Load torque', { min: 0.01, max: 0.08, step: 0.005, value: s.tl, fmt: (v) => v.toFixed(3) + ' N·m' }, (v) => { s.tl = v; p.redraw(); }));
  p.redraw();
};

// a root-locus style s-plane: traces for a gain sweep plus the current poles
function locusPlot(P, charPoly, Kmax, K, xr, yr) {
  P.setRange(xr, yr); P.axes({ xl: 'Re s', yl: 'Im s' });
  rect(P, 0, yr[0], xr[1], yr[1], 'rgba(255,107,91,.08)', null);
  const n = charPoly(0).length - 1, tr = Array.from({ length: n }, () => []);
  let prev = null;
  for (const Kk of linspace(0, Kmax, 241)) {
    let r = roots(charPoly(Kk));
    if (prev) { const used = new Set(); r = prev.map((q) => { let bi = -1, bd = 1e9; r.forEach((z, i) => { if (!used.has(i)) { const d = Math.hypot(z[0] - q[0], z[1] - q[1]); if (d < bd) { bd = d; bi = i; } } }); used.add(bi); return r[bi]; }); }
    r.forEach((z, i) => tr[i].push(z)); prev = r;
  }
  tr.forEach((t) => P.line(t.map((z) => z[0]), t.map((z) => z[1]), C.rule2, 2));
  const r = roots(charPoly(K));
  r.forEach((z) => P.dot(z[0], z[1], z[0] > 1e-9 ? C.bad : C.lime, 6));
  return r;
}

// p13-l03: Routh array and poles of K/((s+1)(s+2)(s+3))
W.routhgain = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { K: 30 };
  const p = new Plot(body, { aspect: 0.7, maxH: 360, x: [-7, 2], y: [-5, 5], equal: true, label: 'Closed-loop poles as the gain rises' });
  p.draw = (P) => {
    const cp = (K) => [1, 6, 11, 6 + K];
    const r = locusPlot(P, cp, 120, s.K, [-7, 2], [-5, 5]);
    const col = [1, 6, (60 - s.K) / 6, 6 + s.K], ch = col.slice(1).reduce((n, v, i) => n + (Math.sign(v) !== Math.sign(col[i]) ? 1 : 0), 0);
    read.innerHTML = `K = ${s.K} · Routh first column [${col.map((v) => v.toFixed(2)).join(', ')}] · ${ch} sign change${ch === 1 ? '' : 's'} → ${ch ? bad(ch + ' right-half-plane poles') : ok('stable')} · poles ${r.map((z) => z[0].toFixed(2) + (Math.abs(z[1]) > 1e-6 ? (z[1] > 0 ? '+' : '−') + Math.abs(z[1]).toFixed(2) + 'j' : '')).join(', ')}`;
  };
  ctrls.append(slider('Gain K', { min: 1, max: 120, step: 1, value: s.K, fmt: (v) => String(v) }, (v) => { s.K = v; p.redraw(); }));
  p.redraw();
};

// p13-l04: steady-state error against system type
W.sserror = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { inp: 'ramp' };
  const LOOPS = [['type 0', [10], pmul([1, 1], [1, 2]), C.warn], ['type 1', [10], pmul([1, 0], pmul([1, 2], [1, 5])), C.signal], ['type 2', [10, 10], pmul([1, 0, 0], [1, 5]), C.lime]];
  const INP = { step: (t) => 1, ramp: (t) => t, parabola: (t) => t * t / 2 };
  const PRED = { step: ['1/6 = 0.167', '0', '0'], ramp: ['∞', '1', '0'], parabola: ['∞', '∞', '0.5'] };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 20], y: [-0.5, 2], label: 'Tracking error against time for three loop types' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'error' });
    const fin = [];
    LOOPS.forEach(([name, n, d, c]) => {
      const { ts, ys } = tfsim(d, padd(d, n), INP[s.inp], 20, 0.005, 10);
      P.line(ts, ys, c, 2.5); fin.push(`${sp(c, name)} e(20 s) = ${ys[ys.length - 1].toFixed(3)} (predicted ${PRED[s.inp][fin.length]})`);
    });
    read.innerHTML = `${s.inp} input · ` + fin.join(' · ');
  };
  ctrls.append(select('Input', [['step', 'Step'], ['ramp', 'Ramp'], ['parabola', 'Parabola']], s.inp, (v) => { s.inp = v; p.redraw(); }, 'sse-input'));
  p.redraw();
};

// p13-l05: proportional speed loop step response
W.pgain = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Kp: 10 }; const R = 1.2, L = 0.002, k = 0.05, J = 2e-4, b = 2e-5, a = [L * J, L * b + R * J, R * b + k * k];
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 40], y: [0, 1.4], label: 'Speed step response under proportional control' });
  p.draw = (P) => {
    P.axes({ xl: 't (ms)', yl: 'ω / ω_ref' });
    const { ts, ys } = tfsim([s.Kp * a[2]], padd(a, [s.Kp * a[2]]), () => 1, 0.04, 2e-5, 10);
    const fin = s.Kp / (1 + s.Kp), pk = Math.max(...ys);
    P.line([0, 40], [1, 1], C.dim, 1.5, [4, 4]); P.line([0, 40], [fin, fin], C.signal, 1.5, [2, 4]);
    P.line(ts.map((t) => t * 1000), ys, C.lime, 2.5);
    const wn = Math.sqrt(a[2] * (1 + s.Kp) / a[0]), z = a[1] / a[0] / (2 * wn);
    read.innerHTML = `K_p = ${s.Kp} · steady value ${sp(C.signal, fin.toFixed(3))} (error ${(100 / (1 + s.Kp)).toFixed(1)} %) · overshoot ${Math.max(0, (pk / fin - 1) * 100).toFixed(1)} % · ζ = ${z.toFixed(2)}, ω_n = ${wn.toFixed(0)} rad/s`;
  };
  ctrls.append(slider('K_p (loop gain)', { min: 0.5, max: 60, step: 0.5, value: s.Kp, fmt: (v) => v.toFixed(1) }, (v) => { s.Kp = v; p.redraw(); }));
  p.redraw();
};

// motor with PI speed control, optional voltage limit and anti-windup (l06, l09)
function motorPI({ Kp, Ki, useI = true, wref = 200, load = 0, tLoad = 1, T = 2, dt = 5e-5, Vmax = Infinity, mode = 'none', Tt = 0.02, every = 20 }) {
  const R = 1.2, L = 0.002, k = 0.05, J = 2e-4, b = 2e-5;
  let i = 0, w = 0, I = 0; const ts = [], ws = [], vs = [];
  for (let n = 0; n < T / dt; n++) {
    const t = n * dt, e = wref - w, v = Kp * e + (useI ? I : 0), u = Math.max(-Vmax, Math.min(Vmax, v));
    if (useI) {
      if (mode === 'clamp') { if (!(v !== u && Math.sign(e) === Math.sign(v))) I += Ki * e * dt; }
      else if (mode === 'back') I += (Ki * e + (u - v) / Tt) * dt;
      else I += Ki * e * dt;
    }
    const tl = t >= tLoad ? load : 0;
    i += dt * (u - R * i - k * w) / L; w += dt * (k * i - b * w - tl) / J;
    if (n % every === 0) { ts.push(t); ws.push(w); vs.push(u); }
  }
  return { ts, ws, vs };
}

// p13-l06: P against PI with a load step
W.pispeed = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Ki: 2.5, load: 0.05, showP: true };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 2], y: [0, 260], label: 'Motor speed after a reference step and a load step, P and PI' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'rad/s' });
    P.line([0, 2], [200, 200], C.dim, 1.5, [4, 4]);
    const pi = motorPI({ Kp: 0.12, Ki: s.Ki, load: s.load });
    const po = motorPI({ Kp: 0.12, Ki: 0, useI: false, load: s.load });
    if (s.showP) P.line(po.ts, po.ws, C.warn, 2.5);
    P.line(pi.ts, pi.ws, C.lime, 2.5);
    const at = (r, t) => r.ws[Math.min(r.ws.length - 1, Math.round(t / (r.ts[1] - r.ts[0])))];
    read.innerHTML = `${sp(C.lime, 'PI')} (K_i = ${s.Ki}): speed at 0.95 s ${at(pi, 0.95).toFixed(1)}, at 2 s ${pi.ws[pi.ws.length - 1].toFixed(1)} rad/s · ${sp(C.warn, 'P only')}: ${at(po, 0.95).toFixed(1)} → ${po.ws[po.ws.length - 1].toFixed(1)} rad/s after the ${s.load.toFixed(2)} N·m load`;
  };
  ctrls.append(slider('K_i', { min: 0.5, max: 6, step: 0.1, value: s.Ki, fmt: (v) => v.toFixed(1) + ' V/rad' }, (v) => { s.Ki = v; p.redraw(); }),
    slider('Load at 1 s', { min: 0, max: 0.1, step: 0.01, value: s.load, fmt: (v) => v.toFixed(2) + ' N·m' }, (v) => { s.load = v; p.redraw(); }),
    toggle('Show P only', s.showP, (v) => { s.showP = v; p.redraw(); }, { id: 'pi-showp' }));
  p.redraw();
};

// the live lab's cart-pole under PID on the tilt plus cart-position terms (l07, l08)
function cartpole({ P = true, I = true, D = true, T = 10, kickAt = 3, sigma = 0, Tf = 0.012, seed = 1 }) {
  const M = 0.8, m = 0.25, l = 0.45, g = 9.81, Fmax = 30, tauA = 0.02, Kp = 38, Ki = 6, Kd = 7, kx = 1.6, kv = 2.6;
  const deriv = (q, F) => {
    const [, xd, th, thd] = q, sn = Math.sin(th), cs = Math.cos(th), tot = M + m;
    const temp = (F + m * l * thd * thd * sn) / tot;
    const thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd;
    return [xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd];
  };
  const h = 1e-3, every = 5, dt = h * every, a = Tf > 0 ? Math.exp(-dt / Tf) : 0, r = rng(seed);
  let s = [0, 0, 0.06, 0], F = 0, Fc = 0, integ = 0, d = 0, prev = 0.06, fell = null;
  const ts = [], ths = [], xs = [], cmds = [];
  for (let k = 0; k < T / h; k++) {
    if (kickAt != null && k === Math.round(kickAt / h)) s[3] += 0.9;
    if (k % every === 0) {
      const y = s[2] + sigma * gauss(r);
      d = a * d + (1 - a) * (y - prev) / dt; prev = y;
      integ = I ? Math.max(-0.5, Math.min(0.5, integ + y * dt)) : 0;
      Fc = Math.max(-Fmax, Math.min(Fmax, (P ? Kp * y : 0) + (I ? Ki * integ : 0) + (D ? Kd * d : 0) + kx * s[0] + kv * s[1]));
      ts.push(k * h); ths.push(s[2]); xs.push(s[0]); cmds.push(Fc);
    }
    F += h / tauA * (Fc - F);
    s = rk4((q) => deriv(q, F), s, h);
    if (Math.abs(s[2]) > 1) { fell = k * h; ts.push(k * h); ths.push(s[2]); xs.push(s[0]); cmds.push(Fc); break; }
  }
  return { ts, ths, xs, cmds, fell };
}

// p13-l07: PID terms on the cart-pole
W.pidcartpole = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { P: true, I: true, D: true };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 10], y: [-30, 30], label: 'Pendulum tilt and cart position under PID' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'deg / cm' });
    const r = cartpole({ P: s.P, I: s.I, D: s.D });
    P.line([3, 3], [-30, 30], C.rule2, 1, [3, 3]);
    P.line(r.ts, r.xs.map((x) => x * 100 / 4), C.signal, 2);
    P.line(r.ts, r.ths.map(deg), C.lime, 2.5);
    const mt = Math.max(...r.ths.map((v) => Math.abs(deg(v))));
    read.innerHTML = `${sp(C.lime, 'tilt (°)')}, ${sp(C.signal, 'cart (cm ÷ 4)')}, kick at 3 s · ${r.fell != null ? bad(`fell at ${r.fell.toFixed(2)} s`) : ok(`upright for 10 s, max tilt ${mt.toFixed(1)}°`)} · terms on: ${['P', 'I', 'D'].filter((k) => s[k]).join(', ') || 'none'}`;
  };
  ctrls.append(toggle('P (K_p = 38)', s.P, (v) => { s.P = v; p.redraw(); }, { id: 'pid-p' }),
    toggle('I (K_i = 6)', s.I, (v) => { s.I = v; p.redraw(); }, { id: 'pid-i' }),
    toggle('D (K_d = 7)', s.D, (v) => { s.D = v; p.redraw(); }, { id: 'pid-d' }));
  p.redraw();
};

// p13-l08: derivative filtering against sensor noise
W.dfilter = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sig: 0.5, Tf: 12 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 10], y: [-32, 32], label: 'Actuator command with noisy tilt measurements' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'N' });
    const r = cartpole({ sigma: s.sig * Math.PI / 180, Tf: s.Tf / 1000, kickAt: null });
    P.line(r.ts, r.cmds, C.signal, 1.2);
    P.line(r.ts, r.ths.map((v) => deg(v) * 5), C.lime, 2.5);
    const c = r.cmds.slice(Math.floor(r.cmds.length / 2)), mu = c.reduce((a, b) => a + b, 0) / c.length;
    const rms = Math.sqrt(c.reduce((a, b) => a + (b - mu) ** 2, 0) / c.length);
    const dt = 0.005, a = s.Tf > 0 ? Math.exp(-dt / (s.Tf / 1000)) : 0, fac = s.Tf > 0 ? (1 - a) / dt * Math.sqrt(2 / (1 + a)) : Math.sqrt(2) / dt;
    const lag = deg(Math.atan(7 * s.Tf / 1000));
    read.innerHTML = `${sp(C.signal, 'force command')}, ${sp(C.lime, 'tilt × 5 (°)')} · noise σ ${s.sig}° · ${s.Tf ? `T_f ${s.Tf} ms` : 'raw derivative'}: D-term noise ≈ ${(7 * s.sig * Math.PI / 180 * fac).toFixed(1)} N RMS (command ${rms.toFixed(1)} N RMS) · phase lag at 7 rad/s ${lag.toFixed(1)}° · ${r.fell != null ? bad(`fell at ${r.fell.toFixed(2)} s`) : ok('balanced')}`;
  };
  ctrls.append(slider('Sensor noise σ', { min: 0, max: 2, step: 0.1, value: s.sig, fmt: (v) => v.toFixed(1) + '°' }, (v) => { s.sig = v; p.redraw(); }),
    slider('Derivative filter T_f', { min: 0, max: 200, step: 2, value: s.Tf, fmt: (v) => (v ? v + ' ms' : 'off (raw)') }, (v) => { s.Tf = v; p.redraw(); }));
  p.redraw();
};

// p13-l09: integrator windup and two fixes
W.windup = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { wr: 200, show: 'none' };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 1.5], y: [0, 300], label: 'Speed after a large step with a 12 V drive limit' });
  const q = new Plot(body, { aspect: 0.4, maxH: 200, x: [0, 1.5], y: [-14, 14], label: 'Drive voltage for the selected scheme' });
  const M = [['none', 'no anti-windup', C.bad], ['clamp', 'clamping', C.signal], ['back', 'back-calculation', C.lime]];
  let runs = {};
  p.draw = (P) => {
    P.setRange([0, 1.5], [0, s.wr * 1.4]); P.axes({ xl: 't (s)', yl: 'rad/s' });
    P.line([0, 1.5], [s.wr, s.wr], C.dim, 1.5, [4, 4]);
    runs = {}; const parts = [];
    for (const [m, name, c] of M) { const r = motorPI({ Kp: 0.12, Ki: 2.5, wref: s.wr, T: 1.5, Vmax: 12, mode: m }); runs[m] = r; P.line(r.ts, r.ws, c, m === s.show ? 3 : 1.8); parts.push(`${sp(c, name)} ${Math.max(0, (Math.max(...r.ws) / s.wr - 1) * 100).toFixed(1)} %`); }
    const free = motorPI({ Kp: 0.12, Ki: 2.5, wref: s.wr, T: 1.5, mode: 'none' });
    read.innerHTML = `overshoot: ${parts.join(' · ')} · unlimited PI ${Math.max(0, (Math.max(...free.ws) / s.wr - 1) * 100).toFixed(1)} % · steady voltage ${(s.wr / 19.81).toFixed(1)} V`;
    q.redraw();
  };
  q.draw = (Q) => { Q.axes({ xl: 't (s)', yl: 'V' }); Q.line([0, 1.5], [12, 12], C.dim, 1, [3, 3]); const r = runs[s.show]; if (r) Q.line(r.ts, r.vs, M.find((x) => x[0] === s.show)[2], 2); };
  ctrls.append(slider('Speed step', { min: 100, max: 230, step: 10, value: s.wr, fmt: (v) => v + ' rad/s' }, (v) => { s.wr = v; p.redraw(); }),
    select('Voltage plot', M.map(([m, n]) => [m, n]), s.show, (v) => { s.show = v; p.redraw(); }, 'windup-show'));
  p.redraw();
};

// p13-l10: relay feedback limit cycle
W.relaycycle = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 0, d: 1 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 30], y: [-1.5, 1.5], label: 'Relay output and plant output in a limit cycle' });
  p.draw = (P) => {
    const dt = 2e-3, nd = Math.round(s.th / dt), buf = new Array(nd + 1).fill(0), T = 40;
    let x = [0, 0, 0], u = s.d; const ts = [], ys = [], us = [];
    for (let k = 0; k < T / dt; k++) {
      const y = x[2]; u = -y > 0 ? s.d : -s.d;
      buf.push(u); const ud = buf.shift();
      x = rk4((q) => [-q[0] + ud, q[0] - q[1], q[1] - q[2]], x, dt);
      if (k % 5 === 0) { ts.push(k * dt); ys.push(x[2]); us.push(u); }
    }
    const h = ts[1] - ts[0], half = Math.floor(ys.length / 2), yy = ys.slice(half), up = [];
    for (let i = 1; i < yy.length; i++) if (yy[i - 1] < 0 && yy[i] >= 0) up.push(i);
    const Pu = up.length > 1 ? (up[up.length - 1] - up[0]) / (up.length - 1) * h : NaN;
    let re = 0, im = 0; const seg = yy.slice(up[0], up[up.length - 1]);
    seg.forEach((v, i) => { re += v * Math.cos(2 * Math.PI * i * h / Pu); im -= v * Math.sin(2 * Math.PI * i * h / Pu); });
    const a1 = 2 * Math.hypot(re, im) / seg.length, Ku = 4 * s.d / (Math.PI * a1);
    // exact ultimate point of e^{-θs}/(s+1)^3
    let lo = 0.05, hi = Math.sqrt(3) + 1e-9; const ph = (w) => 3 * Math.atan(w) + s.th * w - Math.PI;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; ph(m) > 0 ? (hi = m) : (lo = m); }
    const wu = (lo + hi) / 2, KuX = (1 + wu * wu) ** 1.5, PuX = 2 * Math.PI / wu;
    const ym = Math.max(1.5, s.d * 1.2);
    P.setRange([0, T], [-ym, ym]); P.axes({ xl: 't (s)', yl: 'u, y' });
    P.line(ts, us, C.warn, 1.5); P.line(ts, ys.map((v) => v * 4), C.lime, 2.5);
    read.innerHTML = `${sp(C.warn, 'relay ±' + s.d)}, ${sp(C.lime, 'plant output × 4')} · amplitude ${a1.toFixed(3)}, period ${Pu.toFixed(2)} s → K_u ≈ 4d/(πa) = ${Ku.toFixed(2)} · exact K_u ${KuX.toFixed(2)}, P_u ${PuX.toFixed(2)} s (errors ${((Ku / KuX - 1) * 100).toFixed(1)} %, ${((Pu / PuX - 1) * 100).toFixed(1)} %)`;
  };
  ctrls.append(slider('Dead time', { min: 0, max: 1.5, step: 0.1, value: s.th, fmt: (v) => v.toFixed(1) + ' s' }, (v) => { s.th = v; p.redraw(); }),
    slider('Relay amplitude d', { min: 0.2, max: 2, step: 0.1, value: s.d, fmt: (v) => v.toFixed(1) }, (v) => { s.d = v; p.redraw(); }));
  p.redraw();
};

// p13-l11: root locus of K/(s(s+2)(s+4))
W.rootlocus = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { K: 10 };
  const p = new Plot(body, { aspect: 0.7, maxH: 360, x: [-7, 2], y: [-5, 5], equal: true, label: 'Root locus with the closed-loop poles for the chosen gain' });
  p.draw = (P) => {
    const r = locusPlot(P, (K) => [1, 6, 8, K], 100, s.K, [-7, 2], [-5, 5]);
    [0, -2, -4].forEach((x) => P.text('×', x, -0.15, C.warn, 'center'));
    const cpx = r.filter((z) => Math.abs(z[1]) > 1e-6).sort((a, b) => b[0] - a[0])[0];
    const zeta = cpx ? -cpx[0] / Math.hypot(cpx[0], cpx[1]) : 1;
    read.innerHTML = `K = ${s.K} · poles ${r.map((z) => z[0].toFixed(2) + (Math.abs(z[1]) > 1e-6 ? (z[1] > 0 ? '+' : '−') + Math.abs(z[1]).toFixed(2) + 'j' : '')).join(', ')} · ${s.K > 48 ? bad('unstable (K > 48)') : s.K === 48 ? bad('marginal: poles on the jω axis at ±2.83j') : ok('stable')} · dominant ζ ${zeta.toFixed(2)}`;
  };
  ctrls.append(slider('Gain K', { min: 0, max: 100, step: 1, value: s.K, fmt: (v) => String(v) }, (v) => { s.K = v; p.redraw(); }));
  p.redraw();
};

// Bode helper: magnitude (dB) and phase (deg) for several frequency responses on a log grid
function bodeCurves(Lfn, ws) { const r = ws.map(Lfn); return { mag: r.map((z) => 20 * Math.log10(cab(z))), ph: unwrap(r.map((z) => Math.atan2(z[1], z[0]))).map(deg) }; }
function marginsOf(ws, b) {
  const wc = crossing(ws, b.mag, 0, true); let pm = null;
  if (wc) { const i = ws.findIndex((w) => w >= wc); pm = 180 + b.ph[i - 1] + (b.ph[i] - b.ph[i - 1]) * (Math.log(wc / ws[i - 1]) / Math.log(ws[i] / ws[i - 1])); }
  return { wc, pm };
}

// p13-l12: lead compensator on 10/(s(s+1))
W.leadbode = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { z: 2.1, p: 10.5, on: true };
  const ws = logspace(-1, 2.5, 500);
  const pm = new Plot(body, { aspect: 0.42, maxH: 220, x: [0.1, 300], y: [-60, 60], logx: true, label: 'Bode magnitude with and without lead' });
  const pp = new Plot(body, { aspect: 0.36, maxH: 190, x: [0.1, 300], y: [-190, -80], logx: true, label: 'Bode phase with and without lead' });
  const st = new Plot(body, { aspect: 0.42, maxH: 220, x: [0, 6], y: [0, 1.8], label: 'Closed-loop step response with and without lead' });
  let B0, B1, m0, m1;
  const lead = () => ({ num: [10 / s.z, 10], den: pmul([1, 1, 0], [1 / s.p, 1]) });
  const compute = () => {
    B0 = bodeCurves((w) => fr([10], [1, 1, 0], w), ws); m0 = marginsOf(ws, B0);
    const { num, den } = lead(); B1 = bodeCurves((w) => fr(num, den, w), ws); m1 = marginsOf(ws, B1);
  };
  pm.draw = (P) => { P.axes({ xl: 'ω (rad/s)', yl: 'dB' }); P.line([0.1, 300], [0, 0], C.dim, 1, [3, 3]); P.line(ws, B0.mag, C.warn, 2); if (s.on) P.line(ws, B1.mag, C.lime, 2.5); };
  pp.draw = (P) => {
    P.axes({ xl: 'ω (rad/s)', yl: 'deg' }); P.line([0.1, 300], [-180, -180], C.dim, 1, [3, 3]); P.line(ws, B0.ph, C.warn, 2); if (s.on) P.line(ws, B1.ph, C.lime, 2.5);
    const wm = Math.sqrt(s.z * s.p); if (s.on) P.line([wm, wm], [-190, -80], C.signal, 1, [2, 3]);
  };
  st.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'y' }); P.line([0, 6], [1, 1], C.dim, 1, [3, 3]);
    const a = tfsim([10], padd([1, 1, 0], [10]), () => 1, 6, 1e-3, 10); P.line(a.ts, a.ys, C.warn, 2);
    if (s.on) { const { num, den } = lead(); const b = tfsim(num, padd(den, num), () => 1, 6, 1e-3, 10); P.line(b.ts, b.ys, C.lime, 2.5); st.os = Math.max(...b.ys) - 1; }
  };
  const redraw = () => {
    compute(); pm.redraw(); pp.redraw(); st.redraw();
    const al = s.z / s.p, phm = deg(Math.asin((1 - al) / (1 + al)));
    read.innerHTML = `${sp(C.warn, 'K = 10 alone')}: PM ${m0.pm.toFixed(1)}° at ${m0.wc.toFixed(2)} rad/s · ${sp(C.lime, 'with lead')} (zero ${s.z}, pole ${s.p}): PM ${m1.pm.toFixed(1)}° at ${m1.wc.toFixed(2)} rad/s, step overshoot ${(100 * Math.max(0, st.os || 0)).toFixed(0)} % · max phase bump ${phm.toFixed(1)}° at ${sp(C.signal, '√(zp) = ' + Math.sqrt(s.z * s.p).toFixed(2))} rad/s`;
  };
  ctrls.append(slider('Lead zero', { min: 0.5, max: 10, step: 0.1, value: s.z, fmt: (v) => v.toFixed(1) + ' rad/s' }, (v) => { s.z = v; if (s.p < v * 1.2) s.p = +(v * 1.2).toFixed(1); redraw(); }),
    slider('Lead pole', { min: 2, max: 60, step: 0.5, value: s.p, fmt: (v) => v.toFixed(1) + ' rad/s' }, (v) => { s.p = Math.max(v, s.z * 1.2); redraw(); }),
    toggle('Lead on', s.on, (v) => { s.on = v; redraw(); }, { id: 'lead-on' }));
  redraw();
};

// p13-l13: exact Bode against straight-line asymptotes for (s/z+1)/(s(s/p1+1)(s/p2+1))
W.bodeasym = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { z: 1, p1: 10, p2: 100 };
  const ws = logspace(-2, 4, 600);
  const pm = new Plot(body, { aspect: 0.45, maxH: 240, x: [0.01, 10000], y: [-100, 60], logx: true, label: 'Exact and asymptotic Bode magnitude' });
  const pp = new Plot(body, { aspect: 0.38, maxH: 200, x: [0.01, 10000], y: [-190, 10], logx: true, label: 'Exact and asymptotic Bode phase' });
  const L = (w) => cdv([1, w / s.z], cm([0, w], cm([1, w / s.p1], [1, w / s.p2])));
  const amag = (w) => -20 * Math.log10(w) + 20 * Math.log10(Math.max(1, w / s.z)) - 20 * Math.log10(Math.max(1, w / s.p1)) - 20 * Math.log10(Math.max(1, w / s.p2));
  const ramp = (w, c) => (w <= c / 10 ? 0 : w >= c * 10 ? 90 : 45 * (Math.log10(w / c) + 1));
  const aph = (w) => -90 + ramp(w, s.z) - ramp(w, s.p1) - ramp(w, s.p2);
  pm.draw = (P) => { const b = bodeCurves(L, ws); P.axes({ xl: 'ω (rad/s)', yl: 'dB' }); P.line(ws, ws.map(amag), C.warn, 2, [6, 4]); P.line(ws, b.mag, C.lime, 2.5); };
  pp.draw = (P) => { const b = bodeCurves(L, ws); P.axes({ xl: 'ω (rad/s)', yl: 'deg' }); P.line(ws, ws.map(aph), C.warn, 2, [6, 4]); P.line(ws, b.ph, C.lime, 2.5); };
  const redraw = () => {
    pm.redraw(); pp.redraw();
    const err = (w) => (20 * Math.log10(cab(L(w))) - amag(w)).toFixed(2);
    read.innerHTML = `${sp(C.lime, 'exact')} and ${sp(C.warn, 'asymptotes')} · error at the zero ${s.z}: ${err(s.z)} dB · at the pole ${s.p1}: ${err(s.p1)} dB · at the pole ${s.p2}: ${err(s.p2)} dB · (±3.01 dB when the corners are a decade or more apart)`;
  };
  ctrls.append(slider('Zero', { min: 0.1, max: 10, step: 0.1, value: s.z, fmt: (v) => v.toFixed(1) + ' rad/s' }, (v) => { s.z = v; redraw(); }),
    slider('Pole 1', { min: 1, max: 100, step: 1, value: s.p1, fmt: (v) => v + ' rad/s' }, (v) => { s.p1 = v; redraw(); }),
    slider('Pole 2', { min: 10, max: 1000, step: 10, value: s.p2, fmt: (v) => v + ' rad/s' }, (v) => { s.p2 = v; redraw(); }));
  redraw();
};

// p13-l14: Nyquist plot of K/(s(s+1)(s+2))
W.nyquistplot = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { K: 3 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-3, 1], y: [-2.5, 2.5], equal: true, label: 'Nyquist plot and the critical point' });
  p.draw = (P) => {
    const sc = Math.max(1, s.K / 6 * 1.6);
    P.setRange([-2.2 * sc, 0.8 * sc], [-2 * sc, 2 * sc]); P.axes({ xl: 'Re L', yl: 'Im L' });
    const ws = logspace(-1.5, 2, 800), z = ws.map((w) => { const v = fr([s.K], [1, 3, 2, 0], w); return v; });
    P.line(z.map((v) => v[0]), z.map((v) => v[1]), C.lime, 2.5);
    P.line(z.map((v) => v[0]), z.map((v) => -v[1]), C.lime, 1.5, [5, 4]);
    const i = Math.floor(ws.length * 0.62); P.arrow(z[i - 4][0], z[i - 4][1], z[i][0], z[i][1], C.lime, 2);
    P.dot(-1, 0, C.bad, 6); P.text('−1', -1, 0.12 * sc, C.bad, 'center');
    P.dot(-s.K / 6, 0, C.signal, 4);
    const rhp = roots([1, 3, 2, s.K]).filter((q) => q[0] > 1e-9).length;
    read.innerHTML = `K = ${s.K} · ${sp(C.lime, 'ω > 0 solid')}, ω < 0 dashed · crosses the negative real axis at ${sp(C.signal, (-s.K / 6).toFixed(2))} (ω = √2) · clockwise encirclements of −1: N = ${rhp} · open-loop RHP poles P = 0 · Z = N + P = ${rhp} → ${rhp ? bad('unstable closed loop') : ok('stable closed loop')}`;
  };
  ctrls.append(slider('Gain K', { min: 0.5, max: 12, step: 0.5, value: s.K, fmt: (v) => v.toFixed(1) }, (v) => { s.K = v; p.redraw(); }));
  p.redraw();
};

// p13-l15: gain and phase margins with a delay
W.margins = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 0 };
  const ws = logspace(-1.3, 1, 500);
  const pm = new Plot(body, { aspect: 0.42, maxH: 220, x: [0.05, 10], y: [-60, 40], logx: true, label: 'Loop magnitude with the gain margin' });
  const pp = new Plot(body, { aspect: 0.42, maxH: 220, x: [0.05, 10], y: [-360, -60], logx: true, label: 'Loop phase with the phase margin' });
  const mag = (w) => 20 * Math.log10(2 / (w * Math.sqrt(1 + w * w) * Math.sqrt(4 + w * w)));
  const ph = (w) => -90 - deg(Math.atan(w)) - deg(Math.atan(w / 2)) - deg(s.th * w);
  const bis = (f, lo, hi) => { for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); f(m) > 0 ? (lo = m) : (hi = m); } return Math.sqrt(lo * hi); };
  let wc, wp;
  pm.draw = (P) => {
    P.axes({ xl: 'ω (rad/s)', yl: 'dB' }); P.line([0.05, 10], [0, 0], C.dim, 1, [3, 3]); P.line(ws, ws.map(mag), C.lime, 2.5);
    P.line([wp, wp], [mag(wp), 0], C.signal, 3); P.dot(wc, 0, C.warn, 5);
  };
  pp.draw = (P) => {
    P.axes({ xl: 'ω (rad/s)', yl: 'deg' }); P.line([0.05, 10], [-180, -180], C.dim, 1, [3, 3]); P.line(ws, ws.map(ph), C.lime, 2.5);
    P.line([wc, wc], [ph(wc), -180], C.warn, 3); P.dot(wp, -180, C.signal, 5);
  };
  const redraw = () => {
    wc = bis(mag, 0.05, 10); wp = bis((w) => ph(w) + 180, 0.05, 10);
    pm.redraw(); pp.redraw();
    const PM = 180 + ph(wc), GM = -mag(wp);
    read.innerHTML = `delay ${s.th.toFixed(2)} s · ${sp(C.warn, `phase margin ${PM.toFixed(1)}°`)} at ω_c = ${wc.toFixed(3)} rad/s · ${sp(C.signal, `gain margin ${GM.toFixed(1)} dB (×${(10 ** (GM / 20)).toFixed(2)})`)} at ${wp.toFixed(3)} rad/s · delay margin ${(((180 - 90 - deg(Math.atan(wc)) - deg(Math.atan(wc / 2))) * Math.PI / 180) / wc).toFixed(2)} s · ${PM > 0 ? ok('stable') : bad('unstable')}`;
  };
  ctrls.append(slider('Loop delay', { min: 0, max: 1.2, step: 0.02, value: s.th, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.th = v; redraw(); }));
  redraw();
};

// p13-l16: |S| and |T|, waterbed
W.sensitivity = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { K: 2 };
  const ws = logspace(-3, 3, 1500);
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0.01, 100], y: [-60, 25], logx: true, label: 'Sensitivity and complementary sensitivity magnitude' });
  p.draw = (P) => {
    P.axes({ xl: 'ω (rad/s)', yl: 'dB' }); P.line([0.01, 100], [0, 0], C.dim, 1, [3, 3]);
    const L = ws.map((w) => fr([s.K], [1, 3, 2, 0], w)), S = L.map((l) => cdv([1, 0], [1 + l[0], l[1]])), T = L.map((l) => cdv(l, [1 + l[0], l[1]]));
    const sdb = S.map((z) => 20 * Math.log10(cab(z))), tdb = T.map((z) => 20 * Math.log10(cab(z)));
    P.line(ws, sdb, C.lime, 2.5); P.line(ws, tdb, C.signal, 2);
    const wi = logspace(-6, 4, 6000), lnS = wi.map((w) => { const l = fr([s.K], [1, 3, 2, 0], w); return -Math.log(Math.hypot(1 + l[0], l[1])); });
    let I = 0; for (let i = 1; i < wi.length; i++) I += (wi[i] - wi[i - 1]) * (lnS[i] + lnS[i - 1]) / 2;
    const Ms = Math.max(...S.map(cab)), Mt = Math.max(...T.map(cab)), stable = s.K < 6;
    read.innerHTML = `L = ${s.K}/(s(s+1)(s+2)) · ${sp(C.lime, `M_s = ${Ms.toFixed(2)}`)} (closest approach to −1: ${(1 / Ms).toFixed(2)}) · ${sp(C.signal, `M_t = ${Mt.toFixed(2)}`)} · ∫ln|S|dω = ${I.toFixed(3)} ${stable ? ok('(≈ 0: the waterbed)') : bad('(closed loop unstable, the theorem does not apply)')}`;
  };
  ctrls.append(slider('Loop gain K', { min: 0.2, max: 5.8, step: 0.1, value: s.K, fmt: (v) => v.toFixed(1) }, (v) => { s.K = v; p.redraw(); }));
  p.redraw();
};

// p13-l17: Smith predictor on e^{-2s}/(5s+1)
W.smithpred = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { md: 2, plain: true };
  const dt = 0.02, tau = 5, theta = 2, Kp = 2.5, Ti = 5, a = Math.exp(-dt / tau);
  const run = (mode, mth) => {
    const n = Math.round(40 / dt), nd = Math.round(theta / dt), md = Math.round(mth / dt);
    let x = 0, xm = 0, integ = 0; const uh = [], xh = [], ys = [];
    for (let k = 0; k < n; k++) {
      const y = x; xh.push(xm);
      const fb = mode === 'smith' ? y + xm - (k >= md ? xh[k - md] : 0) : y;
      const e = 1 - fb; integ += e * dt; const u = Kp * (e + integ / Ti); uh.push(u);
      const ud = mode === 'nodelay' ? u : (k >= nd ? uh[k - nd] : 0);
      x = a * x + (1 - a) * ud; xm = a * xm + (1 - a) * u; ys.push(y);
    }
    return ys;
  };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 40], y: [0, 1.8], label: 'Step response of a dead-time process with and without a Smith predictor' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'y' }); P.line([0, 40], [1, 1], C.dim, 1, [3, 3]);
    const ts = linspace(0, 40 - dt, Math.round(40 / dt)), nf = run('nodelay', 2), sm = run('smith', s.md), pl = run('plain', 2);
    P.line(ts.map((t) => t + theta), nf, C.fog, 1.5, [5, 4]);
    if (s.plain) P.line(ts, pl, C.warn, 2);
    P.line(ts, sm, C.lime, 2.5);
    const os = (y) => Math.max(0, (Math.max(...y) - 1) * 100);
    read.innerHTML = `${sp(C.lime, 'Smith predictor')} (model delay ${s.md.toFixed(1)} s, true 2 s): overshoot ${os(sm).toFixed(1)} % · ${sp(C.warn, 'plain PI')}: ${os(pl).toFixed(0)} % · ${sp(C.fog, 'delay-free loop shifted 2 s')} dashed`;
  };
  ctrls.append(slider('Model delay', { min: 0.5, max: 3.5, step: 0.1, value: s.md, fmt: (v) => v.toFixed(1) + ' s' }, (v) => { s.md = v; p.redraw(); }),
    toggle('Show plain PI', s.plain, (v) => { s.plain = v; p.redraw(); }, { id: 'smith-plain' }));
  p.redraw();
};

// p13-l18: feedforward on an arm joint
W.feedforward = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bad: false };
  const J = 0.05, mgl = 0.5 * 9.81 * 0.3, b = 0.01, Kp = 20, Kd = 2;
  const ref = (t) => [1 + 0.6 * Math.sin(t), 0.6 * Math.cos(t), -0.6 * Math.sin(t)];
  const run = (mode, sc) => {
    const dt = 2e-3; let st = [1, 0.6]; const ts = [], es = [];
    for (let k = 0; k < 20 / dt; k++) {
      const t = k * dt, [r, rd, rdd] = ref(t);
      let tau = Kp * (r - st[0]) + Kd * (rd - st[1]);
      if (mode !== 'pd') tau += sc * mgl * Math.sin(r);
      if (mode === 'full') tau += sc * J * rdd + b * rd;
      st = rk4((q) => [q[1], (tau - mgl * Math.sin(q[0]) - b * q[1]) / J], st, dt);
      if (k % 10 === 0) { ts.push(t + dt); es.push(deg(ref(t + dt)[0] - st[0])); }
    }
    const tail = es.slice(Math.floor(es.length / 4)); return { ts, es, rms: Math.sqrt(tail.reduce((a, v) => a + v * v, 0) / tail.length) };
  };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 20], y: [-6, 6], label: 'Joint tracking error with PD, gravity feedforward and inverse dynamics' });
  p.draw = (P) => {
    const sc = s.bad ? 0.8 : 1, A = run('pd', sc), B = run('gravity', sc), F = run('full', sc);
    P.axes({ xl: 't (s)', yl: 'error (°)' });
    P.line(A.ts, A.es, C.warn, 2); P.line(B.ts, B.es, C.signal, 2); P.line(F.ts, F.es, C.lime, 2.5);
    read.innerHTML = `RMS error after start-up: ${sp(C.warn, `PD ${A.rms.toFixed(2)}°`)} · ${sp(C.signal, `+ gravity ${B.rms.toFixed(2)}°`)} · ${sp(C.lime, `+ inverse dynamics ${F.rms < 0.01 ? F.rms.toExponential(1) : F.rms.toFixed(2)}°`)} · model ${s.bad ? bad('20 % low') : ok('exact')}`;
  };
  ctrls.append(toggle('Model 20 % low', s.bad, (v) => { s.bad = v; p.redraw(); }, { id: 'ff-bad' }));
  p.redraw();
};

// p13-l19: cascaded current, speed and position loops
W.cascade = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sep: 10 };
  const R = 1.2, Lm = 0.002, k = 0.05, J = 2e-4, b = 2e-5, wi = 3000;
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [0, 1], y: [-1.1, 1.6], label: 'Current, speed and position through a position step' });
  p.draw = (P) => {
    const ws_ = wi / s.sep, wp = ws_ / s.sep, Kpi = Lm * wi, Kii = R * wi, Kps = J * ws_ / k, Kis = Kps * ws_ / 5, Kpp = wp;
    const f = (x) => { const [i, w, th, Ii, Is] = x, es = Kpp * (1 - th) - w, ir = Kps * es + Is, ei = ir - i, V = Kpi * ei + Ii; return [(V - R * i - k * w) / Lm, (k * i - b * w) / J, w, Kii * ei, Kis * es]; };
    const T = 8 / wp, dt = Math.min(5e-5, T / 3000), n = Math.round(T / dt), every = Math.max(1, Math.round(n / 800));
    let x = [0, 0, 0, 0, 0]; const ts = [], I = [], Wv = [], Th = [];
    for (let j = 0; j <= n; j++) { if (j % every === 0) { ts.push(j * dt * 1000); I.push(x[0]); Wv.push(x[1]); Th.push(x[2]); } x = rk4(f, x, dt); }
    const mi = Math.max(...I.map(Math.abs)), mw = Math.max(...Wv.map(Math.abs));
    P.setRange([0, T * 1000], [-0.4, 1.4]); P.axes({ xl: 't (ms)', yl: 'normalised' });
    P.line([0, T * 1000], [1, 1], C.dim, 1, [3, 3]);
    P.line(ts, I.map((v) => v / mi), C.warn, 1.8); P.line(ts, Wv.map((v) => v / mw), C.signal, 2); P.line(ts, Th, C.lime, 2.8);
    const os = Math.max(0, (Math.max(...Th) - 1) * 100);
    read.innerHTML = `bandwidths: current ${wi}, speed ${ws_.toFixed(0)}, position ${wp.toFixed(1)} rad/s (×${s.sep} per level) · ${sp(C.warn, `current (peak ${mi.toFixed(1)} A)`)}, ${sp(C.signal, `speed (peak ${mw.toFixed(1)} rad/s)`)}, ${sp(C.lime, 'position')} (no current limit, illustrative) · position overshoot ${os < 2 ? ok(os.toFixed(1) + ' %') : bad(os.toFixed(1) + ' %')}`;
  };
  ctrls.append(slider('Separation per level', { min: 1.5, max: 10, step: 0.5, value: s.sep, fmt: (v) => '×' + v.toFixed(1) }, (v) => { s.sep = v; p.redraw(); }));
  p.redraw();
};

// p13-l20: firmware control-loop timing
W.pidtiming = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fs: 10000, ex: 50, jit: 10, wc: 300 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 400], y: [0, 3], label: 'Timeline of a fixed-rate control interrupt' });
  p.draw = (P) => {
    const Tus = 1e6 / s.fs, N = 4, r = rng(7);
    P.setRange([0, N * Tus], [0, 3.2]); P.axes({ xl: 't (µs)' });
    let over = 0;
    for (let k = 0; k < N; k++) {
      const t0 = k * Tus, js = r() * s.jit, a = t0 + js, e = a + s.ex, late = e > t0 + Tus;
      if (late) over++;
      P.line([t0, t0], [2.3, 2.9], C.fog, 2);
      rect(P, a, 1.1, Math.min(e, N * Tus), 1.9, late ? 'rgba(255,107,91,.35)' : 'rgba(198,255,26,.22)', late ? C.bad : C.lime);
      P.dot(a, 1.5, C.signal, 4); if (e <= N * Tus) P.dot(e, 1.5, C.warn, 4);
    }
    P.text('timer', N * Tus * 0.99, 3.0, C.fog, 'right'); P.text('ISR', N * Tus * 0.99, 0.7, C.fog, 'right');
    const load = s.ex / Tus * 100, lat = s.ex + s.jit / 2, phLat = deg(s.wc * lat * 1e-6), phZoh = deg(s.wc * Tus * 1e-6 / 2);
    read.innerHTML = `period ${Tus.toFixed(0)} µs · ${sp(C.signal, 'sample')} → ${sp(C.warn, 'output written')} · CPU load ${load > 100 ? bad(load.toFixed(0) + ' %') : load > 70 ? bad(load.toFixed(0) + ' %') : ok(load.toFixed(0) + ' %')} · mean latency ${lat.toFixed(0)} µs costs ${phLat.toFixed(2)}° at ω_c = ${s.wc} rad/s (plus ${phZoh.toFixed(2)}° from the zero-order hold) · ${over ? bad(over + ' overrun' + (over > 1 ? 's' : '')) : ok('no overruns')}`;
  };
  ctrls.append(select('Loop rate', [['1000', '1 kHz'], ['5000', '5 kHz'], ['10000', '10 kHz'], ['20000', '20 kHz']], String(s.fs), (v) => { s.fs = +v; p.redraw(); }, 'pt-rate'),
    slider('Execution time', { min: 5, max: 150, step: 5, value: s.ex, fmt: (v) => v + ' µs' }, (v) => { s.ex = v; p.redraw(); }),
    slider('Start jitter', { min: 0, max: 50, step: 2, value: s.jit, fmt: (v) => v + ' µs' }, (v) => { s.jit = v; p.redraw(); }),
    select('Crossover ω_c', [['10', '10 rad/s'], ['300', '300 rad/s'], ['3000', '3000 rad/s']], String(s.wc), (v) => { s.wc = +v; p.redraw(); }, 'pt-wc'));
  p.redraw();
};

export default W;
