// Widgets for Phase 12 (system dynamics). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const row = (...k) => h('div', { class: 'btn-row' }, ...k);
function rect(P, x0, y0, x1, y1, fill, stroke) { P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke); }
function box(P, x0, y0, x1, y1, label, on) {
  rect(P, x0, y0, x1, y1, on ? 'rgba(198,255,26,.16)' : '#15170f', on ? C.lime : C.rule2);
  P.text(label, (x0 + x1) / 2, (y0 + y1) / 2 - (y1 - y0) * 0.08, on ? C.bone : C.fog, 'center');
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
// one RK4 step for x' = f(x) (arrays)
function rk4(f, x, dt) {
  const n = x.length, k1 = f(x), t = new Array(n);
  for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k1[i];
  const k2 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k2[i];
  const k3 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt * k3[i];
  const k4 = f(t); const o = new Array(n);
  for (let i = 0; i < n; i++) o[i] = x[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return o;
}
function sim(f, x0, T, dt, every = 1) {
  const n = Math.round(T / dt), ts = [0], xs = [x0.slice()]; let x = x0.slice();
  for (let k = 1; k <= n; k++) { x = rk4(f, x, dt); if (k % every === 0) { ts.push(k * dt); xs.push(x); } }
  return { ts, xs };
}
const col = (xs, i) => xs.map((x) => x[i]);
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;

// p12-l01: one, two and three thermal nodes
W.lumpedorder = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { P: 150, two: true, one: true };
  const Ch = 50, Cw = 0.3 * 4186, Cb = 190, Rhw = 0.05, Rwb = 0.1, Rba = 0.5, Ta = 20;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 50], y: [0, 220], label: 'Water temperature after the heater switches on, three models' });
  p.draw = (P) => {
    const ymax = Ta + s.P * 0.6 * 1.1; P.setRange([0, 50], [0, Math.max(60, ymax)]); P.axes({ xl: 't (min)', yl: 'water °C' });
    const full = sim((T) => [(s.P - (T[0] - T[1]) / Rhw) / Ch, ((T[0] - T[1]) / Rhw - (T[1] - T[2]) / Rwb) / Cw, ((T[1] - T[2]) / Rwb - (T[2] - Ta) / Rba) / Cb], [Ta, Ta, Ta], 3000, 0.5, 20);
    const two = sim((T) => [(s.P - (T[0] - T[1]) / Rwb) / (Ch + Cw), ((T[0] - T[1]) / Rwb - (T[1] - Ta) / Rba) / Cb], [Ta, Ta], 3000, 0.5, 20);
    const one = sim((T) => [(s.P - (T[0] - Ta) / (Rwb + Rba)) / (Ch + Cw + Cb)], [Ta], 3000, 0.5, 20);
    const mn = (ts) => ts.map((t) => t / 60);
    P.line(mn(full.ts), col(full.xs, 1), C.lime, 3);
    if (s.two) P.line(mn(two.ts), col(two.xs, 0), C.signal, 2, [6, 4]);
    if (s.one) P.line(mn(one.ts), col(one.xs, 0), C.warn, 2, [2, 4]);
    const f = col(full.xs, 1), o = col(one.xs, 0), t2 = col(two.xs, 0);
    let e1 = 0, e2 = 0; for (let i = 0; i < f.length; i++) { e1 = Math.max(e1, Math.abs(o[i] - f[i]) / (f[f.length - 1] - Ta)); e2 = Math.max(e2, Math.abs(t2[i] - f[i]) / (f[f.length - 1] - Ta)); }
    read.innerHTML = `${s.P} W heater · steady water ${(Ta + s.P * (Rwb + Rba)).toFixed(0)} °C · <span style="color:${C.lime}">3-node</span>, <span style="color:${C.signal}">2-node</span> (max error ${(e2 * 100).toFixed(2)} % of the rise), <span style="color:${C.warn}">1-node</span> (${(e1 * 100).toFixed(2)} %) · 1-node time constant ${((Ch + Cw + Cb) * (Rwb + Rba)).toFixed(0)} s`;
  };
  ctrls.append(slider('Heater power', { min: 50, max: 300, step: 10, value: s.P, fmt: (v) => v + ' W' }, (v) => { s.P = v; p.redraw(); }),
    toggle('2-node', s.two, (v) => { s.two = v; p.redraw(); }, { id: 'lump-two' }), toggle('1-node', s.one, (v) => { s.one = v; p.redraw(); }, { id: 'lump-one' }));
  p.redraw();
};

// p12-l02: quarter car over a bump
W.quartercar = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cs: 1500, v: 10 };
  const ms = 250, mu = 40, ks = 16000, kt = 160000, H = 0.05, Lb = 0.5;
  const p = new Plot(body, { aspect: 0.62, maxH: 340, x: [0, 2.5], y: [-0.06, 0.16], label: 'Body and wheel motion over a bump' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'm' });
    const d = Lb / s.v, road = (t) => (t >= 0.2 && t <= 0.2 + d ? H * (1 - Math.cos(2 * Math.PI * (t - 0.2) / d)) / 2 : 0);
    const n = 2.5 / 5e-4, ts = [], xs = [], xu = [], rr = []; let x = [0, 0, 0, 0], t = 0;
    const f = (q) => { const r = road(t), fs = -ks * (q[0] - q[1]) - s.cs * (q[2] - q[3]); return [q[2], q[3], fs / ms, (-fs - kt * (q[1] - r)) / mu]; };
    for (let k = 0; k <= n; k++) { if (k % 4 === 0) { ts.push(t); xs.push(x[0] + 0.08); xu.push(x[1]); rr.push(road(t)); } x = rk4(f, x, 5e-4); t += 5e-4; }
    P.line(ts, rr, C.dim, 1.5, [3, 3]); P.line(ts, xu, C.signal, 2); P.line(ts, xs, C.lime, 2.5);
    P.text('body (+8 cm)', 2.45, 0.145, C.lime, 'right'); P.text('wheel', 2.45, -0.045, C.signal, 'right');
    const pb = Math.max(...xs.map((v) => Math.abs(v - 0.08))), pw = Math.max(...xu.map(Math.abs));
    const zb = s.cs / (2 * Math.sqrt(ks * ms));
    read.innerHTML = `5 cm bump, ${Lb} m long, at ${s.v} m/s (${(d * 1000).toFixed(0)} ms) · body peak ${(pb * 100).toFixed(1)} cm, wheel peak ${(pw * 100).toFixed(1)} cm · modes 1.21 Hz (bounce) and 10.56 Hz (wheel hop) · body damping ratio ≈ ${zb.toFixed(2)}`;
  };
  ctrls.append(slider('Damper c_s', { min: 300, max: 6000, step: 100, value: s.cs, fmt: (v) => v + ' N·s/m' }, (v) => { s.cs = v; p.redraw(); }),
    slider('Speed', { min: 2, max: 30, step: 1, value: s.v, fmt: (v) => v + ' m/s' }, (v) => { s.v = v; p.redraw(); }));
  p.redraw();
};

// p12-l03: two-inertia drive, frequency response
W.shafttwist = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { f: 56 };
  const Jm = 1e-4, JL = 4e-4, k = 50, c = 2e-3;
  const resp = (f) => { // complex response to unit torque: motor and load speeds
    const w = 2 * Math.PI * f;
    // [ -w^2 Jm + jwc + k , -(jwc + k) ; -(jwc + k), -w^2 JL + jwc + k ] th = [1, 0]
    const a = [k - w * w * Jm, w * c], b = [-k, -w * c], d = [k - w * w * JL, w * c];
    const mul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
    const det = [mul(a, d)[0] - mul(b, b)[0], mul(a, d)[1] - mul(b, b)[1]];
    const div = (x, y) => { const m = y[0] * y[0] + y[1] * y[1]; return [(x[0] * y[0] + x[1] * y[1]) / m, (x[1] * y[0] - x[0] * y[1]) / m]; };
    const thm = div(d, det), thL = div([-b[0], -b[1]], det);
    return { m: Math.hypot(...thm) * w, L: Math.hypot(...thL) * w, tw: Math.hypot(thm[0] - thL[0], thm[1] - thL[1]) };
  };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [10, 300], y: [-20, 70], logx: true, label: 'Motor and load speed per unit torque against drive frequency' });
  p.draw = (P) => {
    P.axes({ xl: 'Hz', yl: 'dB (rad/s per N·m)' });
    const db = (v) => 20 * Math.log10(v);
    P.fn((f) => db(resp(f).m), C.lime, 2.5, null, 500); P.fn((f) => db(resp(f).L), C.signal, 2, null, 500);
    const r = resp(s.f); P.line([s.f, s.f], [-20, 70], C.warn, 1.5, [4, 4]); P.dot(s.f, db(r.m), C.lime, 5); P.dot(s.f, db(r.L), C.signal, 5);
    
    read.innerHTML = `drive ${s.f} Hz · <span style="color:${C.lime}">motor</span> speed ${r.m.toFixed(1)}, <span style="color:${C.signal}">load</span> speed ${r.L.toFixed(1)} rad/s per N·m · twist ${(r.tw * 1e3).toFixed(2)} mrad per N·m · anti-resonance 56.3 Hz (motor nearly still), resonance 125.8 Hz (twist largest)`;
  };
  ctrls.append(slider('Drive frequency', { min: 10, max: 300, step: 1, value: s.f, fmt: (v) => v + ' Hz' }, (v) => { s.f = v; p.redraw(); }));
  p.redraw();
};

// p12-l04: double pendulum, chaos
W.doublependulum = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a: 120, d: 0.01 };
  const g = 9.81;
  const f = (q) => { const [t1, t2, w1, w2] = q, dl = t1 - t2, den = 3 - Math.cos(2 * dl);
    return [w1, w2,
      (-3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(dl) * (w2 * w2 + w1 * w1 * Math.cos(dl))) / den,
      (2 * Math.sin(dl) * (2 * w1 * w1 + 2 * g * Math.cos(t1) + w2 * w2 * Math.cos(dl))) / den]; };
  const E = (q) => { const [t1, t2, w1, w2] = q; return w1 * w1 + 0.5 * w2 * w2 + w1 * w2 * Math.cos(t1 - t2) - 2 * g * Math.cos(t1) - g * Math.cos(t2); };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 20], y: [-30, 30], label: 'Lower arm angle of two double pendulums against time' });
  p.draw = (P) => {
    const a = s.a * Math.PI / 180, A = sim(f, [a, a, 0, 0], 20, 2e-3, 10), B = sim(f, [a, a + s.d * Math.PI / 180, 0, 0], 20, 2e-3, 10);
    const ya = col(A.xs, 1), yb = col(B.xs, 1), lim = Math.max(4, ...ya.map(Math.abs), ...yb.map(Math.abs)) * 1.05;
    P.setRange([0, 20], [-lim, lim]); P.axes({ xl: 't (s)', yl: 'θ₂ (rad)' });
    P.line(A.ts, ya, C.lime, 2); P.line(B.ts, yb, C.warn, 1.5);
    let ts = -1; for (let i = 0; i < ya.length; i++) if (Math.abs(ya[i] - yb[i]) > 0.5) { ts = A.ts[i]; break; }
    const e0 = E(A.xs[0]); let drift = 0; for (const q of A.xs) drift = Math.max(drift, Math.abs(E(q) - e0));
    read.innerHTML = `both arms start at ${s.a}°, the second pendulum's lower arm ${s.d}° further · ${ts >= 0 ? `traces differ by 0.5 rad after <b>${ts.toFixed(1)} s</b>` : 'traces stay together for 20 s (not enough energy to tumble)'} · energy drift ${drift.toExponential(1)} J/kg`;
  };
  ctrls.append(slider('Start angle (both arms)', { min: 20, max: 170, step: 5, value: s.a, fmt: (v) => v + '°' }, (v) => { s.a = v; p.redraw(); }),
    select('Difference', [['0.001', '0.001°'], ['0.01', '0.01°'], ['0.1', '0.1°'], ['1', '1°']], '0.01', (v) => { s.d = +v; p.redraw(); }, 'dp-diff'));
  p.redraw();
};

// p12-l05: mechanical and electrical twins
W.analogy = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { m: 2, c: 3, k: 50 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [0, 0.4], label: 'Mass position and scaled capacitor charge after a step' });
  p.draw = (P) => {
    const { m, c, k } = s, F = 10, al = 1e-3, b = 1e-3, L = m * b * b / al, R = c * b / al, Cc = al / k;
    const mech = sim((q) => [q[1], (F - c * q[1] - k * q[0]) / m], [0, 0], 10, 2e-3, 5);
    const elec = sim((q) => [q[1], (F - R * q[1] - q[0] / Cc) / L], [0, 0], 10 * b, 2e-3 * b, 5);
    const xm = col(mech.xs, 0), xe = col(elec.xs, 0).map((q) => q / al), top = Math.max(...xm) * 1.15;
    P.setRange([0, 10], [0, Math.max(0.05, top)]); P.axes({ xl: 't (s) · circuit ms', yl: 'x (m) · q/α' });
    P.line(mech.ts, xm, C.lime, 4); P.line(mech.ts, xe, C.signal, 1.8, [5, 4]);
    let err = 0; for (let i = 0; i < xm.length; i++) err = Math.max(err, Math.abs(xm[i] - xe[i]));
    const z = c / (2 * Math.sqrt(k * m));
    read.innerHTML = `m = ${m} kg, c = ${c} N·s/m, k = ${k} N/m with a 10 N step ↔ L = ${(L * 1e3).toFixed(1)} mH, R = ${R.toFixed(1)} Ω, C = ${(Cc * 1e6).toFixed(1)} µF with a 10 V step, 1000× faster · ζ = ${z.toFixed(2)} · largest gap between the traces ${err.toExponential(1)}`;
  };
  ctrls.append(slider('Mass m', { min: 0.5, max: 10, step: 0.5, value: s.m, fmt: (v) => v + ' kg' }, (v) => { s.m = v; p.redraw(); }),
    slider('Damping c', { min: 0, max: 40, step: 0.5, value: s.c, fmt: (v) => v + ' N·s/m' }, (v) => { s.c = v; p.redraw(); }),
    slider('Stiffness k', { min: 10, max: 200, step: 5, value: s.k, fmt: (v) => v + ' N/m' }, (v) => { s.k = v; p.redraw(); }));
  p.redraw();
};

// p12-l06: motor spinning up a flywheel, energy flows
W.motorflywheel = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { N: 20 };
  const R = 0.8, L = 1e-3, k = 0.05, Jm = 2e-5, b = 1e-5, JL = 0.01, tl = 1.5, V = 24, T = 0.4;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, T], y: [0, 10], label: 'Stacked energy flows while the motor spins up the load' });
  p.draw = (P) => {
    const N = s.N, Jeq = Jm + JL / (N * N), dt = 5e-5;
    let x = [0, 0], Ecu = 0, Ef = 0, Ew = 0, Ein = 0; const ts = [0], cu = [0], fr = [0], ke = [0], wk = [0];
    const f = (q) => [(V - R * q[0] - k * q[1]) / L, (k * q[0] - b * q[1] - tl / N) / Jeq];
    const n = Math.round(T / dt);
    for (let i = 1; i <= n; i++) {
      const x1 = rk4(f, x, dt), im = (x[0] + x1[0]) / 2, wm = (x[1] + x1[1]) / 2;
      Ecu += R * im * im * dt; Ef += b * wm * wm * dt; Ew += tl / N * wm * dt; Ein += V * im * dt; x = x1;
      if (i % 40 === 0) { ts.push(i * dt); cu.push(Ecu); fr.push(Ecu + Ef); ke.push(Ecu + Ef + 0.5 * Jeq * x[1] * x[1] + 0.5 * L * x[0] * x[0]); wk.push(ke[ke.length - 1] + Ew); }
    }
    const top = Math.max(1, wk[wk.length - 1]) * 1.08; P.setRange([0, T], [0, top]); P.axes({ xl: 't (s)', yl: 'J' });
    const band = (lo, hi, c) => P.poly(ts.map((t, i) => [t, hi[i]]).concat(ts.map((t, i) => [t, lo[i]]).reverse()), c);
    const zero = ts.map(() => 0);
    band(zero, cu, 'rgba(255,107,91,.55)'); band(cu, fr, 'rgba(255,181,71,.6)'); band(fr, ke, 'rgba(198,255,26,.5)'); band(ke, wk, 'rgba(111,211,255,.5)');
    const wl = x[1] / N;
    
    read.innerHTML = `gear ratio ${N}:1 · load at ${wl.toFixed(2)} rad/s after ${T} s (motor ${x[1].toFixed(0)} rad/s) · energy in ${Ein.toFixed(1)} J = <span style="color:${C.bad}">copper</span> ${Ecu.toFixed(1)} + <span style="color:${C.warn}">friction</span> ${Ef.toFixed(2)} + <span style="color:${C.lime}">stored</span> ${(0.5 * Jeq * x[1] * x[1] + 0.5 * L * x[0] * x[0]).toFixed(1)} + <span style="color:${C.signal}">load work</span> ${Ew.toFixed(1)} J · inertia match at N = √(J_L/J_m) = 22.4`;
  };
  ctrls.append(slider('Gear ratio N', { min: 5, max: 60, step: 1, value: s.N, fmt: (v) => v + ':1' }, (v) => { s.N = v; p.redraw(); }));
  p.redraw();
};

// p12-l07: tank with pump and orifice
W.tanklevel = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q: 2, off: 3000 };
  const A = 1, a = Math.PI * 0.03 ** 2 / 4, Cd = 0.6, g = 9.81, T = 6000;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, T], y: [0, 2.6], label: 'Tank level against time with the pump switched off part way' });
  p.draw = (P) => {
    const qp = s.q / 1000, hss = (qp / (Cd * a)) ** 2 / (2 * g);
    P.setRange([0, T], [0, Math.max(0.5, hss * 1.25)]); P.axes({ xl: 't (s)', yl: 'level (m)' });
    let h = 0; const ts = [0], hs = [0], dt = 2;
    for (let t = 0; t < T; t += dt) { const on = t < s.off; h = Math.max(0, rk4((x) => [((on ? qp : 0) - Cd * a * Math.sqrt(2 * g * Math.max(x[0], 0))) / A], [h], dt)[0]); ts.push(t + dt); hs.push(h); }
    P.line([0, T], [hss, hss], C.dim, 1.5, [5, 4]); P.text('h_ss', T * 0.99, hss + 0.03 * hss + 0.02, C.dim, 'right');
    if (s.off < T) P.line([s.off, s.off], [0, hss * 1.2], C.warn, 1.5, [3, 4]);
    P.line(ts, hs, C.lime, 2.5);
    const hoff = hs[Math.min(hs.length - 1, Math.round(s.off / dt))], tdrain = A / (Cd * a) * Math.sqrt(2 * hoff / g);
    read.innerHTML = `pump ${s.q} L/s · steady level ${hss.toFixed(2)} m, where outflow equals inflow · pump off at ${s.off} s with ${hoff.toFixed(2)} m in the tank, empty ${tdrain.toFixed(0)} s later (draining slows as the head falls)`;
  };
  ctrls.append(slider('Pump flow', { min: 0.5, max: 3, step: 0.1, value: s.q, fmt: (v) => v.toFixed(1) + ' L/s' }, (v) => { s.q = v; p.redraw(); }),
    slider('Pump off at', { min: 500, max: 6000, step: 100, value: s.off, fmt: (v) => (v >= 6000 ? 'never' : v + ' s') }, (v) => { s.off = v; p.redraw(); }));
  p.redraw();
};

// p12-l08: block diagram reduction
W.blockreduce = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { step: 0, K: 4, kv: 0.2 };
  const km = 10, tau = 0.1;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [0, 5.5], label: 'Servo block diagram at each reduction step' });
  const sum = (P, x, y) => { P.ctx.strokeStyle = C.fog; P.ctx.lineWidth = 1.5; P.ctx.beginPath(); P.ctx.arc(P.sx(x), P.sy(y), 9, 0, 7); P.ctx.stroke(); P.text('Σ', x, y - 0.12, C.fog, 'center'); };
  p.draw = (P) => {
    const st = s.step, y = 3.6, fb = 1.2;
    P.text('r', 0.2, y + 0.25, C.fog); P.text('θ', 9.75, y + 0.25, C.fog, 'right');
    const blocks = st === 0 ? [['K', 1.6, 2.6], ['Gm', 4.4, 5.6], ['1/s', 7.0, 8.0]]
      : st === 1 ? [['K', 1.6, 2.6], ['Gm/(1+kv·Gm)', 3.5, 6.3], ['1/s', 7.0, 8.0]]
      : st === 2 ? [['K·Gm/(s(1+kv·Gm))', 1.6, 7.6]] : [['T(s)', 3.0, 6.5]];
    if (st < 3) { sum(P, 1.0, y); P.arrow(0.3, y, 0.85, y, C.fog, 1.5); P.arrow(1.15, y, blocks[0][1], y, C.fog, 1.5); }
    else P.arrow(0.3, y, 3.0, y, C.fog, 1.5);
    blocks.forEach(([t, x0, x1], i) => { box(P, x0, y - 0.45, x1, y + 0.45, t, i === (st === 1 ? 1 : st === 2 ? 0 : -1) || st === 3); if (i + 1 < blocks.length) P.arrow(x1, y, blocks[i + 1][1], y, C.fog, 1.5); });
    const xe = blocks[blocks.length - 1][2]; P.arrow(xe, y, 9.8, y, C.fog, 1.5);
    if (st === 0) { // inner velocity loop
      sum(P, 3.8, y); P.line([6.3, 6.3, 3.8], [y, y - fb, y - fb], C.signal, 1.5); P.arrow(3.8, y - fb, 3.8, y - 0.15, C.signal, 1.5);
      box(P, 4.5, y - fb - 0.35, 5.5, y - fb + 0.35, 'kv', false); P.text('−', 3.55, y - 0.45, C.signal);
    }
    if (st < 3) { P.line([8.8, 8.8, 1.0], [y, y - 2.6, y - 2.6], C.lime, 1.5); P.arrow(1.0, y - 2.6, 1.0, y - 0.15, C.lime, 1.5); P.text('−', 0.7, y - 0.45, C.lime); }
    const { K, kv } = s, a2 = tau, a1 = 1 + kv * km, a0 = K * km, n = K * km;
    const fmt = (v) => +v.toPrecision(3);
    const tf = [`inner loop around Gm = ${km}/(${tau}s + 1) with feedback kv`, `inner loop closed: ${km}/(${tau}s + ${fmt(a1)})`, `series: ${fmt(n)}/(${tau}s² + ${fmt(a1)}s)`, `outer loop closed: T(s) = ${fmt(n / a2)}/(s² + ${fmt(a1 / a2)}s + ${fmt(a0 / a2)})`][st];
    const wn = Math.sqrt(a0 / a2), z = a1 / a2 / (2 * wn);
    read.innerHTML = `step ${st + 1} of 4 · ${tf} · closed loop ωn = ${wn.toFixed(1)} rad/s, ζ = ${z.toFixed(2)} (Mason's rule gives the same T in one step)`;
  };
  ctrls.append(row(btn('◀ Back', () => { s.step = Math.max(0, s.step - 1); p.redraw(); }, 'br-back'), btn('Next step ▶', () => { s.step = Math.min(3, s.step + 1); p.redraw(); }, 'br-next')),
    slider('Controller gain K', { min: 0.5, max: 10, step: 0.5, value: s.K, fmt: (v) => v }, (v) => { s.K = v; p.redraw(); }),
    slider('Velocity feedback kv', { min: 0, max: 1, step: 0.05, value: s.kv, fmt: (v) => v.toFixed(2) }, (v) => { s.kv = v; p.redraw(); }));
  p.redraw();
};

// p12-l09: trajectories in a three-dimensional state space (isometric projection)
W.statetraj = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { z: 0.2, yaw: 35 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-1.6, 1.6], y: [-1.3, 1.3], equal: true, label: 'State trajectories of a third-order system, projected' });
  p.draw = (P) => {
    const z = s.z, w = 1.5, pr = 0.6; // poles: -pr and complex pair with damping z, natural freq w
    // characteristic (s + pr)(s^2 + 2 z w s + w^2) = s^3 + a2 s^2 + a1 s + a0, controllable canonical form
    const a2 = pr + 2 * z * w, a1 = w * w + 2 * z * w * pr, a0 = pr * w * w;
    const f = (x) => [x[1], x[2], -a0 * x[0] - a1 * x[1] - a2 * x[2]];
    const yaw = s.yaw * Math.PI / 180, el_ = 0.45;
    const proj = (x) => { const X = x[0] * Math.cos(yaw) - x[1] * Math.sin(yaw), Y = x[0] * Math.sin(yaw) + x[1] * Math.cos(yaw); return [X, x[2] * Math.cos(el_) * 0.5 + Y * Math.sin(el_)]; };
    [[[1.2, 0, 0], 'x₁'], [[0, 1.2, 0], 'x₂'], [[0, 0, 2.2], 'x₃']].forEach(([v, t]) => { const a = proj([0, 0, 0]), b = proj(v); P.line([a[0], b[0]], [a[1], b[1]], C.rule2, 1.5); P.text(t, b[0], b[1] + 0.05, C.dim, 'center'); });
    const starts = [[1, 0, 0], [0, 1, 0], [-0.8, 0.5, 1], [0.6, -0.8, -1]], cols = [C.lime, C.signal, C.warn, C.bad];
    starts.forEach((x0, i) => { const r = sim(f, x0, 40, 0.01, 2), pts = r.xs.map(proj); P.line(pts.map((q) => q[0]), pts.map((q) => q[1]), cols[i], 1.8); P.dot(pts[0][0], pts[0][1], cols[i], 4); });
    P.dot(0, 0, C.bone, 3);
    const disc = z < 1 ? `${(-z * w).toFixed(2)} ± ${(w * Math.sqrt(1 - z * z)).toFixed(2)}j` : `${(-z * w + w * Math.sqrt(z * z - 1)).toFixed(2)} and ${(-z * w - w * Math.sqrt(z * z - 1)).toFixed(2)}`;
    read.innerHTML = `x′ = Ax in controllable canonical form of 1/(s³ + ${a2.toFixed(2)}s² + ${a1.toFixed(2)}s + ${a0.toFixed(2)}) · eigenvalues −0.60 and ${disc} · ${z < 1 ? 'spirals into the origin' : 'no oscillation: trajectories slide straight in'}`;
  };
  ctrls.append(slider('Damping of the complex pair ζ', { min: 0.05, max: 1.5, step: 0.05, value: s.z, fmt: (v) => v.toFixed(2) }, (v) => { s.z = v; p.redraw(); }),
    slider('View angle', { min: 0, max: 90, step: 5, value: s.yaw, fmt: (v) => v + '°' }, (v) => { s.yaw = v; p.redraw(); }));
  p.redraw();
};

// p12-l10: nonlinear and linearised tank
W.linoverlay = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { pct: 10 };
  const At = 1, kap = 0.6 * Math.PI * 0.03 ** 2 / 4 * Math.sqrt(2 * 9.81), q0 = 0.002, h0 = (q0 / kap) ** 2;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 8000], y: [0, 1], label: 'Level change after an inflow step, nonlinear and linearised' });
  p.draw = (P) => {
    const du = q0 * s.pct / 100, Alin = -q0 / (2 * At * h0), dt = 4;
    let hn = h0, hl = 0; const ts = [0], N = [0], Lm = [0];
    for (let t = 0; t < 8000; t += dt) {
      hn = Math.max(0, rk4((x) => [(q0 + du - kap * Math.sqrt(Math.max(x[0], 0))) / At], [hn], dt)[0]);
      hl = rk4((x) => [Alin * x[0] + du / At], [hl], dt)[0]; ts.push(t + dt); N.push(hn - h0); Lm.push(hl);
    }
    const lo = Math.min(0, ...N, ...Lm), hi = Math.max(0, ...N, ...Lm), pad = (hi - lo) * 0.12 || 0.01;
    P.setRange([0, 8000], [lo - pad, hi + pad]); P.axes({ xl: 't (s)', yl: 'Δh (m)' });
    P.line(ts, N, C.lime, 3); P.line(ts, Lm, C.signal, 2, [6, 4]);
    let e = 0; for (let i = 0; i < N.length; i++) e = Math.max(e, Math.abs(N[i] - Lm[i]));
    const dev = Math.abs(N[N.length - 1]) || 1e-9;
    read.innerHTML = `inflow step ${s.pct > 0 ? '+' : ''}${s.pct} % from 2 L/s at h₀ = ${h0.toFixed(3)} m · τ = ${(1 / -Alin).toFixed(0)} s · <span style="color:${C.lime}">nonlinear</span> Δh ${(N[N.length - 1] * 100).toFixed(1)} cm, <span style="color:${C.signal}">linear</span> ${(Lm[Lm.length - 1] * 100).toFixed(1)} cm · linear error <b>${(e / dev * 100).toFixed(1)} %</b> of the change`;
  };
  ctrls.append(slider('Inflow step', { min: -50, max: 60, step: 1, value: s.pct, fmt: (v) => (v > 0 ? '+' : '') + v + ' %' }, (v) => { s.pct = v === 0 ? 1 : v; p.redraw(); }));
  p.redraw();
};

// p12-l11: cart-pole falling, energy conserved
W.cartpole = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a: 1 };
  const M = 0.8, m = 0.25, l = 0.45, g = 9.81, I = m * l * l / 3;
  const f = (q) => { const [, xd, th, thd] = q, c = Math.cos(th), sn = Math.sin(th);
    const a11 = M + m, a12 = m * l * c, a22 = I + m * l * l, r1 = m * l * sn * thd * thd, r2 = m * g * l * sn, det = a11 * a22 - a12 * a12;
    return [xd, (r1 * a22 - a12 * r2) / det, thd, (a11 * r2 - a12 * r1) / det]; };
  const KE = (q) => 0.5 * (M + m) * q[1] * q[1] + m * l * Math.cos(q[2]) * q[1] * q[3] + 0.5 * (I + m * l * l) * q[3] * q[3];
  const PE = (q) => m * g * l * Math.cos(q[2]);
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 4], y: [-1.2, 1.2], label: 'Cart-pole snapshots and energy against time' });
  p.draw = (P) => {
    const r = sim(f, [0, 0, s.a * Math.PI / 180, 0], 4, 1e-3, 10);
    const ke = r.xs.map(KE), pe = r.xs.map(PE), e = r.xs.map((q, i) => ke[i] + pe[i]), Em = m * g * l * 1.1;
    P.setRange([0, 4], [-Em * 1.15, Em * 2.2]); P.axes({ xl: 't (s)', yl: 'J' });
    P.line(r.ts, pe, C.signal, 2); P.line(r.ts, ke, C.warn, 2); P.line(r.ts, e, C.lime, 3);
    
    let tf = -1; for (let i = 0; i < r.xs.length; i++) if (Math.abs(r.xs[i][2]) > 0.5) { tf = r.ts[i]; break; }
    const pole = Math.sqrt(m * g * l * (M + m) / ((I + m * l * l) * (M + m) - (m * l) ** 2));
    let drift = 0; for (const v of e) drift = Math.max(drift, Math.abs(v - e[0]));
    read.innerHTML = `start ${s.a}° from upright, no control, no friction · <span style="color:${C.lime}">total</span> = <span style="color:${C.signal}">potential</span> + <span style="color:${C.warn}">kinetic</span> · ${tf >= 0 ? `pole passes 0.5 rad at <b>${tf.toFixed(2)} s</b> (linear estimate ${(Math.acosh(0.5 / (s.a * Math.PI / 180)) / pole).toFixed(2)} s)` : 'still above 0.5 rad at 4 s'} · energy drift ${drift.toExponential(1)} J · unstable pole ${pole.toFixed(2)} s⁻¹`;
  };
  ctrls.append(slider('Start angle', { min: 0.1, max: 10, step: 0.1, value: s.a, fmt: (v) => v.toFixed(1) + '°' }, (v) => { s.a = v; p.redraw(); }));
  p.redraw();
};

// p12-l12: wheeled inverted pendulum falling
W.wipfall = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a: 1, tau: 0 };
  const r = 0.04, mw = 0.3, mb = 1, L = 0.08, g = 9.81, Iw = 0.5 * mw * r * r, Ib = mb * 0.16 ** 2 / 12, M11 = mw + mb + Iw / (r * r), M22 = Ib + mb * L * L;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 0.5], y: [-1.8, 1.8], label: 'Body tilt and wheel travel of the uncontrolled robot' });
  p.draw = (P) => {
    const f = (q) => { const [, xd, th, thd] = q, c = Math.cos(th), sn = Math.sin(th), a12 = mb * L * c, det = M11 * M22 - a12 * a12;
      const r1 = s.tau / r + mb * L * sn * thd * thd, r2 = mb * g * L * sn - s.tau; return [xd, (r1 * M22 - a12 * r2) / det, thd, (M11 * r2 - a12 * r1) / det]; };
    const R = sim(f, [0, 0, s.a * Math.PI / 180, 0], 0.5, 1e-4, 20);
    let k = R.xs.findIndex((q) => Math.abs(q[2]) > Math.PI / 2); if (k < 0) k = R.xs.length;
    const ts = R.ts.slice(0, k), th = R.xs.slice(0, k).map((q) => q[2]), x = R.xs.slice(0, k).map((q) => q[0] * 10);
    P.axes({ xl: 't (s)', yl: 'θ (rad) · x (×10 m)' });
    P.line([0, 0.5], [Math.PI / 2, Math.PI / 2], C.dim, 1, [3, 4]); P.line([0, 0.5], [-Math.PI / 2, -Math.PI / 2], C.dim, 1, [3, 4]);
    P.line(ts, th, C.lime, 2.5); P.line(ts, x, C.signal, 2);
    
    const pole = Math.sqrt(mb * g * L * M11 / (M11 * M22 - (mb * L) ** 2));
    const t45 = R.ts[R.xs.findIndex((q) => Math.abs(q[2]) > Math.PI / 4)];
    read.innerHTML = `<span style="color:${C.lime}">tilt θ</span> and <span style="color:${C.signal}">wheel travel</span> from a ${s.a.toFixed(1)}° start, motor torque ${(s.tau * 1000).toFixed(0)} mN·m · ${t45 !== undefined ? `body passes 45° at <b>${(t45 * 1000).toFixed(0)} ms</b>` : 'stays within 45° for 0.5 s'} · ${s.tau !== 0 ? `torque drives the wheels ${s.tau > 0 ? 'forward' : 'back'} and tips the body ${s.tau > 0 ? 'back' : 'forward'} · ` : ''}open-loop pole ${pole.toFixed(1)} s⁻¹ (doubling every ${(Math.LN2 / pole * 1000).toFixed(0)} ms)`;
  };
  ctrls.append(slider('Start tilt', { min: 0, max: 5, step: 0.1, value: s.a, fmt: (v) => v.toFixed(1) + '°' }, (v) => { s.a = v; p.redraw(); }),
    slider('Motor torque', { min: -60, max: 60, step: 5, value: 0, fmt: (v) => v + ' mN·m' }, (v) => { s.tau = v / 1000; p.redraw(); }));
  p.redraw();
};

// p12-l13: quadrotor with one motor slightly off
W.quaddrift = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { dT: 0.01, mot: 2 };
  const m = 1, l = 0.22, g = 9.81, kq = 0.016, Ix = 0.012, Iy = 0.012, Iz = 0.022, T = 3;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, T], y: [-1, 1], label: 'Position drift of an uncontrolled quadrotor' });
  p.draw = (P) => {
    const th = [m * g / 4, m * g / 4, m * g / 4, m * g / 4]; th[s.mot] += s.dT;
    const Ft = th[0] + th[1] + th[2] + th[3], tx = l * (th[1] - th[3]), ty = l * (th[2] - th[0]), tz = kq * (th[0] - th[1] + th[2] - th[3]);
    const f = (q) => { const [, , , vx, vy, vz, qw, qx, qy, qz, wx, wy, wz] = q;
      const ax = 2 * (qx * qz + qw * qy) * Ft / m, ay = 2 * (qy * qz - qw * qx) * Ft / m, az = (1 - 2 * (qx * qx + qy * qy)) * Ft / m - g;
      return [vx, vy, vz, ax, ay, az,
        0.5 * (-qx * wx - qy * wy - qz * wz), 0.5 * (qw * wx + qy * wz - qz * wy), 0.5 * (qw * wy - qx * wz + qz * wx), 0.5 * (qw * wz + qx * wy - qy * wx),
        (tx - (Iz - Iy) * wy * wz) / Ix, (ty - (Ix - Iz) * wz * wx) / Iy, (tz - (Iy - Ix) * wx * wy) / Iz]; };
    const R = sim(f, [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], T, 2e-3, 5);
    const X = col(R.xs, 0), Y = col(R.xs, 1), Z = col(R.xs, 2);
    const lim = Math.max(0.1, ...X.map(Math.abs), ...Y.map(Math.abs), ...Z.map(Math.abs)) * 1.1;
    P.setRange([0, T], [-lim, lim]); P.axes({ xl: 't (s)', yl: 'm' });
    P.line(R.ts, X, C.lime, 2.5); P.line(R.ts, Y, C.signal, 2); P.line(R.ts, Z, C.warn, 2, [5, 4]);
    P.text('x', T * 0.98, X[X.length - 1], C.lime, 'right'); P.text('y', T * 0.92, Y[Y.length - 1], C.signal, 'right'); P.text('z', T * 0.86, Z[Z.length - 1], C.warn, 'right');
    const k2 = Math.round(2 / 0.01), d2 = Math.hypot(X[k2], Y[k2]), al = l * s.dT / Iy;
    read.innerHTML = `motor ${s.mot + 1} at hover + ${(s.dT * 1000).toFixed(0)} mN (${(s.dT / (m * g) * 100).toFixed(2)} % of the weight), the other three at mg/4 = 2.45 N · sideways drift after 2 s <b>${(d2 * 100).toFixed(1)} cm</b> (small-angle gαt⁴/24 = ${(g * al * 16 / 24 * 100).toFixed(1)} cm) · after 3 s ${(Math.hypot(X[X.length - 1], Y[Y.length - 1]) * 100).toFixed(0)} cm`;
  };
  ctrls.append(slider('Thrust error', { min: 0, max: 50, step: 1, value: 10, fmt: (v) => v + ' mN' }, (v) => { s.dT = v / 1000; p.redraw(); }),
    select('Motor', [['0', '1 (front, +x)'], ['1', '2 (left, +y)'], ['2', '3 (back, −x)'], ['3', '4 (right, −y)']], '2', (v) => { s.mot = +v; p.redraw(); }, 'quad-motor'));
  p.redraw();
};

// p12-l14: train on a slope, forces to scale
W.trainslope = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { grade: 70, mu: 0.25, v: 5 };
  const m = 120e3, madh = 60e3, Pw = 1e6, Fmax = 140e3, g = 9.81, A = 2400, B = 60, Cc = 8;
  const p = new Plot(body, { aspect: 0.62, maxH: 340, x: [-0.5, 11], y: [-0.4, 5.6], equal: true, label: 'Train on a slope with traction, resistance and grade forces' });
  p.draw = (P) => {
    const al = Math.atan(s.grade / 1000), c = Math.cos(al), sn = Math.sin(al), vis = Math.atan(s.grade / 1000 * 3), vc = Math.cos(vis), vs = Math.sin(vis);
    const dem = Math.min(Fmax, Pw / Math.max(s.v, 0.1)), adh = s.mu * madh * g * c, Ft = Math.min(dem, adh), Rd = A + B * s.v + Cc * s.v * s.v, G = m * g * sn, slip = dem > adh;
    const X1 = 11, hEnd = (X1 + 0.5) * vs / vc;
    P.poly([[-0.5, 0], [X1, 0], [X1, hEnd]], '#15170f', C.rule2); P.line([-0.5, X1], [0, hEnd], C.fog, 2);
    const at = (u, n) => [-0.5 + u * vc - n * vs, u * vs + n * vc];
    P.poly([at(3.2, 0.32), at(7.2, 0.32), at(7.2, 1.3), at(3.2, 1.3)], slip ? 'rgba(255,107,91,.25)' : 'rgba(198,255,26,.14)', slip ? C.bad : C.lime);
    [3.8, 4.5, 5.9, 6.6].forEach((u) => { const q = at(u, 0.16); P.dot(q[0], q[1], C.fog, 5); });
    const sc = 4 / 150e3, u0 = 5.2;
    const arr = (F, n, col_, label) => { const a0 = at(u0, n), a1 = at(u0 + F * sc, n); P.arrow(a0[0], a0[1], a1[0], a1[1], col_, 3);
      const tl = at(u0 + F * sc + (F >= 0 ? 0.2 : -0.2), n + 0.12); P.text(label, tl[0], tl[1], col_, F >= 0 ? 'left' : 'right'); };
    arr(Ft, 1.8, C.lime, 'traction'); arr(-Rd, 2.7, C.warn, 'Davis'); arr(-G, 3.6, C.signal, 'grade');
    const l0 = at(u0 + adh * sc, 1.55), l1 = at(u0 + adh * sc, 2.05); P.line([l0[0], l1[0]], [l0[1], l1[1]], C.bad, 2.5);
    const net = Ft - Rd - G;
    read.innerHTML = `${s.grade} ‰ grade, μ = ${s.mu.toFixed(2)}, ${(s.v * 3.6).toFixed(0)} km/h · demand ${(dem / 1e3).toFixed(0)} kN, adhesion limit (red tick) ${(adh / 1e3).toFixed(0)} kN → ${slip ? bad('WHEEL SLIP') : ok('no slip')} · traction ${(Ft / 1e3).toFixed(0)} kN − Davis ${(Rd / 1e3).toFixed(1)} kN − grade ${(G / 1e3).toFixed(1)} kN = ${(net / 1e3).toFixed(1)} kN (${net >= 0 ? 'accelerating' : 'slowing'}) · illustrative 120 t train, 60 t on driven axles`;
  };
  ctrls.append(slider('Grade', { min: 0, max: 120, step: 5, value: s.grade, fmt: (v) => v + ' ‰' }, (v) => { s.grade = v; p.redraw(); }),
    slider('Adhesion μ (wet ↔ dry)', { min: 0.05, max: 0.35, step: 0.01, value: s.mu, fmt: (v) => v.toFixed(2) }, (v) => { s.mu = v; p.redraw(); }),
    slider('Speed', { min: 0, max: 25, step: 0.5, value: s.v, fmt: (v) => (v * 3.6).toFixed(0) + ' km/h' }, (v) => { s.v = v; p.redraw(); }));
  p.redraw();
};

// p12-l15: balance wheel with escapement kicks
W.balancewheel = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { A: 270, off: 0, eps: 0 };
  const f0 = 4, I = 1e-9, Q = 250, w0 = 2 * Math.PI * f0, kap = I * w0 * w0, c = I * w0 / Q, T0 = 1 / f0, DAY = 86400;
  const run = (Adeg, offDeg, eps) => {
    const A = Adeg * Math.PI / 180, thi = offDeg * Math.PI / 180, E = Math.PI * c * w0 * A * A / 2, dt = T0 / 2000;
    const f = (q) => [q[1], -(kap * (q[0] + eps * q[0] ** 3) + c * q[1]) / I];
    let x = [A, 0], t = 0, d = -1; const kicks = [], tr = [], th = [];
    while (kicks.length < 44) {
      const xn = rk4(f, x, dt), tgt = -d * thi, g0 = (x[0] - tgt) * d, g1 = (xn[0] - tgt) * d;
      if (g0 < 0 && g1 >= 0) {
        const ph = g0 / (g0 - g1), xc = rk4(f, x, ph * dt); xc[1] = d * Math.sqrt(xc[1] * xc[1] + 2 * E / I);
        kicks.push(t + ph * dt); x = rk4(f, xc, (1 - ph) * dt); d = -d;
      } else x = xn;
      t += dt; if (kicks.length >= 36) { tr.push(t); th.push(x[0] * 180 / Math.PI); }
    }
    let sum = 0, n = 0; for (let k = 20; k + 2 < kicks.length; k += 2) { sum += kicks[k + 2] - kicks[k]; n++; }
    return { rate: DAY * (T0 / (sum / n) - 1), tr, th, kicks: kicks.slice(36) };
  };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 1], y: [-330, 330], label: 'Balance wheel angle with escapement kicks marked' });
  p.draw = (P) => {
    const r = run(s.A, s.off, s.eps), t0 = r.tr[0];
    P.setRange([0, r.tr[r.tr.length - 1] - t0], [-340, 340]); P.axes({ xl: 't (s)', yl: 'balance angle (°)' });
    P.line(r.tr.map((t) => t - t0), r.th, C.lime, 2.2);
    for (const k of r.kicks) { const j = r.tr.findIndex((t) => t >= k); if (j >= 0) P.dot(k - t0, r.th[j], C.warn, 5); }
    const r2 = run(s.A > 235 ? s.A - 70 : s.A + 70, s.off, s.eps);
    read.innerHTML = `4 Hz balance (28 800 vibrations per hour), Q = 250, amplitude ${s.A}° · kick ${s.off ? `${s.off}° before the centre` : 'at the centre'}${s.eps ? `, hairspring stiffening ε = ${s.eps.toExponential(0)} rad⁻²` : ', linear hairspring'} · rate <b>${r.rate >= 0 ? '+' : ''}${r.rate.toFixed(2)} s/day</b> · at ${s.A > 235 ? s.A - 70 : s.A + 70}° it would be ${r2.rate >= 0 ? '+' : ''}${r2.rate.toFixed(2)} s/day ${Math.abs(r2.rate - r.rate) < 0.01 ? ok('(isochronous)') : bad(`(${Math.abs(r2.rate - r.rate).toFixed(2)} s/day apart)`)}`;
  };
  ctrls.append(slider('Amplitude', { min: 150, max: 320, step: 10, value: s.A, fmt: (v) => v + '°' }, (v) => { s.A = v; p.redraw(); }),
    slider('Kick before centre', { min: 0, max: 20, step: 1, value: 0, fmt: (v) => v + '°' }, (v) => { s.off = v; p.redraw(); }),
    select('Hairspring', [['0', 'linear'], ['0.0001', 'slightly stiffening (ε = 1e-4)'], ['0.001', 'stiffening (ε = 1e-3)']], '0', (v) => { s.eps = +v; p.redraw(); }, 'bal-spring'));
  p.redraw();
};

// p12-l16: step-response identification
W.stepfit = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sig: 0.5, seed: 1 };
  const K = 20, tau = 0.12, n = 1000, ts = Array.from({ length: n }, (_, i) => i * 1e-3);
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 1], y: [-2, 24], label: 'Noisy motor step log with the fitted first-order model' });
  p.draw = (P) => {
    const r = rng(s.seed * 7919 + 3), y = ts.map((t) => K * (1 - Math.exp(-t / tau)) + s.sig * gauss(r));
    const yinf = y.slice(-200).reduce((a, b) => a + b, 0) / 200; let k = y.findIndex((v) => v > 0.632 * yinf); if (k < 1) k = 1;
    const tc = ts[k - 1] + (0.632 * yinf - y[k - 1]) / (y[k] - y[k - 1]) * 1e-3;
    let Kf = yinf, tf = Math.max(0.01, tc);   // Gauss-Newton on all samples
    for (let it = 0; it < 30; it++) {
      let a = 0, b = 0, d = 0, g1 = 0, g2 = 0;
      for (let i = 0; i < n; i++) { const e = Math.exp(-ts[i] / tf), m = Kf * (1 - e), j1 = 1 - e, j2 = -Kf * e * ts[i] / (tf * tf), res = y[i] - m; a += j1 * j1; b += j1 * j2; d += j2 * j2; g1 += j1 * res; g2 += j2 * res; }
      const det = a * d - b * b; Kf += (d * g1 - b * g2) / det; tf += (a * g2 - b * g1) / det;
    }
    P.setRange([0, 1], [Math.min(-2, ...y), Math.max(24, ...y)]); P.axes({ xl: 't (s)', yl: 'speed (rad/s)' });
    for (let i = 0; i < n; i += 4) P.dot(ts[i], y[i], C.fog, 1.6);
    P.fn((t) => Kf * (1 - Math.exp(-t / tf)), C.lime, 2.5);
    P.line([tc, tc], [0, 0.632 * yinf], C.warn, 1.5, [4, 4]); P.dot(tc, 0.632 * yinf, C.warn, 5);
    const e = (a, b) => ((a / b - 1) * 100).toFixed(1) + ' %';
    read.innerHTML = `true K = 20 (rad/s)/V, τ = 0.120 s, noise σ = ${s.sig} rad/s · <span style="color:${C.warn}">63 % crossing</span>: K ${yinf.toFixed(2)}, τ ${tc.toFixed(3)} s (${e(tc, tau)}) · <span style="color:${C.lime}">least squares</span>: K ${Kf.toFixed(2)} (${e(Kf, K)}), τ ${tf.toFixed(3)} s (${e(tf, tau)})`;
  };
  ctrls.append(slider('Noise σ', { min: 0, max: 3, step: 0.1, value: s.sig, fmt: (v) => v.toFixed(1) + ' rad/s' }, (v) => { s.sig = v; p.redraw(); }),
    row(btn('New log', () => { s.seed++; p.redraw(); }, 'step-new')));
  p.redraw();
};

// p12-l17: chirp identification, Welch estimate
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) { const k = i + j, l = k + len / 2, tr = re[l] * cr - im[l] * ci, ti = re[l] * ci + im[l] * cr;
        re[l] = re[k] - tr; im[l] = im[k] - ti; re[k] += tr; im[k] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}
W.chirpbode = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sig: 0.05, seed: 1 };
  const fs = 1000, T = 60, N = fs * T, NS = 8192, fn = 5, z = 0.15, wn = 2 * Math.PI * fn;
  const tru = (f) => { const w = 2 * Math.PI * f, re = wn * wn - w * w, im = 2 * z * wn * w; return wn * wn / Math.hypot(re, im); };
  const u = new Float64Array(N), K = Math.log(30 / 0.2);
  const uf = (t) => Math.cos(2 * Math.PI * 0.2 * T / K * (Math.exp(K * t / T) - 1));
  for (let i = 0; i < N; i++) u[i] = uf(i / fs);
  const yc = new Float64Array(N); { let x = [0, 0]; const dt = 1 / fs;
    for (let i = 0; i < N; i++) { yc[i] = x[0]; const t0 = i * dt, u0 = u[i], u1 = i + 1 < N ? u[i + 1] : u[i];
      const g = (q, uu) => [q[1], wn * wn * (uu - q[0]) - 2 * z * wn * q[1]];
      const k1 = g(x, u0), um = (u0 + u1) / 2, k2 = g([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]], um), k3 = g([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]], um), k4 = g([x[0] + dt * k3[0], x[1] + dt * k3[1]], u1);
      x = [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; void t0; } }
  const win = Float64Array.from({ length: NS }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / NS));
  const welch = (y) => {
    const M = NS / 2 + 1, Suu = new Float64Array(M), Syy = new Float64Array(M), Sr = new Float64Array(M), Si = new Float64Array(M);
    for (let st = 0; st + NS <= N; st += NS / 2) {
      const ur = new Float64Array(NS), ui = new Float64Array(NS), yr = new Float64Array(NS), yi = new Float64Array(NS);
      let mu = 0, my = 0; for (let i = 0; i < NS; i++) { mu += u[st + i]; my += y[st + i]; } mu /= NS; my /= NS;
      for (let i = 0; i < NS; i++) { ur[i] = (u[st + i] - mu) * win[i]; yr[i] = (y[st + i] - my) * win[i]; }
      fft(ur, ui); fft(yr, yi);
      for (let k = 0; k < M; k++) { Suu[k] += ur[k] * ur[k] + ui[k] * ui[k]; Syy[k] += yr[k] * yr[k] + yi[k] * yi[k]; Sr[k] += ur[k] * yr[k] + ui[k] * yi[k]; Si[k] += ur[k] * yi[k] - ui[k] * yr[k]; }
    }
    return { Suu, Syy, Sr, Si };
  };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0.3, 30], y: [-40, 20], logx: true, label: 'Measured and true Bode magnitude' });
  const q = new Plot(body, { aspect: 0.36, maxH: 170, x: [0.3, 30], y: [0, 1.05], logx: true, label: 'Coherence against frequency' });
  let est = null;
  const compute = () => { const r = rng(s.seed * 131 + 7), y = new Float64Array(N); for (let i = 0; i < N; i++) y[i] = yc[i] + s.sig * gauss(r); est = welch(y); };
  p.draw = (P) => {
    P.axes({ xl: 'Hz', yl: 'dB' }); P.fn((f) => 20 * Math.log10(tru(f)), C.signal, 2, null, 400);
    const { Suu, Syy, Sr, Si } = est; let last = -9, worst = 0, cmin = 1;
    for (let k = 1; k < Suu.length; k++) { const f = k * fs / NS; if (f < 0.3 || f > 30) continue;
      const mag = Math.hypot(Sr[k], Si[k]) / Suu[k], co = (Sr[k] * Sr[k] + Si[k] * Si[k]) / (Suu[k] * Syy[k]);
      if (f >= 0.5 && f <= 10) { worst = Math.max(worst, Math.abs(20 * Math.log10(mag / tru(f)))); cmin = Math.min(cmin, co); }
      if (Math.log10(f) - last > 0.012) { last = Math.log10(f); P.dot(f, Math.min(19, Math.max(-39, 20 * Math.log10(mag))), co > 0.9 ? C.lime : C.warn, 2.6); } }
    read.innerHTML = `60 s log chirp 0.2–30 Hz, output noise σ = ${s.sig} · plant f_n = 5 Hz, ζ = 0.15 (blue) · measured H = S_uy/S_uu (dots, orange where coherence < 0.9) · 0.5–10 Hz: worst error <b>${worst.toFixed(2)} dB</b>, lowest coherence ${cmin.toFixed(3)}`;
  };
  q.draw = (P) => {
    P.axes({ xl: 'Hz', yl: 'γ²' }); const { Suu, Syy, Sr, Si } = est, xs = [], ys = [];
    for (let k = 1; k < Suu.length; k++) { const f = k * fs / NS; if (f < 0.3 || f > 30) continue; xs.push(f); ys.push((Sr[k] * Sr[k] + Si[k] * Si[k]) / (Suu[k] * Syy[k])); }
    P.line([0.3, 30], [0.9, 0.9], C.dim, 1, [3, 4]); P.line(xs, ys, C.lime, 1.5);
  };
  ctrls.append(slider('Sensor noise σ', { min: 0, max: 0.5, step: 0.01, value: s.sig, fmt: (v) => v.toFixed(2) }, (v) => { s.sig = v; compute(); p.redraw(); q.redraw(); }),
    row(btn('New noise', () => { s.seed++; compute(); p.redraw(); q.redraw(); }, 'chirp-new')));
  compute(); p.redraw(); q.redraw();
};

// p12-l18: residual whiteness
W.residualacf = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 1, seed: 1 };
  const N = 4000, M = 20, a1 = 1.5, a2 = -0.7, b1 = 0.5, b2 = 0.25;
  const data = (seed) => { const r = rng(seed), u = new Float64Array(N), y = new Float64Array(N);
    for (let k = 0; k < N; k++) u[k] = r() < 0.5 ? -1 : 1;
    for (let k = 2; k < N; k++) y[k] = a1 * y[k - 1] + a2 * y[k - 2] + b1 * u[k - 1] + b2 * u[k - 2] + 0.1 * gauss(r);
    return { u, y }; };
  const reg = (d, n, k) => { const v = []; for (let i = 1; i <= n; i++) v.push(d.y[k - i]); for (let i = 1; i <= n; i++) v.push(d.u[k - i]); return v; };
  const solve = (A, b) => { const n = b.length; for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } }
    const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let t = b[i]; for (let c = i + 1; c < n; c++) t -= A[i][c] * x[c]; x[i] = t / A[i][i]; } return x; };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 21], y: [-0.1, 0.1], label: 'Residual autocorrelation with the 95 % whiteness band' });
  p.draw = (P) => {
    const n = s.n, est = data(s.seed * 2 + 11), val = data(s.seed * 2 + 12), P2 = 2 * n;
    const A = Array.from({ length: P2 }, () => new Array(P2).fill(0)), b = new Array(P2).fill(0);
    for (let k = n; k < N; k++) { const v = reg(est, n, k); for (let i = 0; i < P2; i++) { b[i] += v[i] * est.y[k]; for (let j = 0; j < P2; j++) A[i][j] += v[i] * v[j]; } }
    const th = solve(A, b), r = [];
    for (let k = n; k < N; k++) { const v = reg(val, n, k); let yh = 0; for (let i = 0; i < P2; i++) yh += th[i] * v[i]; r.push(val.y[k] - yh); }
    const mean = r.reduce((a, c) => a + c, 0) / r.length, rc = r.map((v) => v - mean), d = rc.reduce((a, c) => a + c * c, 0), L = rc.length;
    const acf = []; for (let l = 1; l <= M; l++) { let sum = 0; for (let k = l; k < L; k++) sum += rc[k] * rc[k - l]; acf.push(sum / d); }
    let Q = 0; acf.forEach((v, i) => { Q += v * v / (L - i - 1); }); Q *= L * (L + 2);
    const band = 1.96 / Math.sqrt(L), lim = Math.max(0.08, ...acf.map(Math.abs)) * 1.15;
    P.setRange([0, 21], [-lim, lim]); P.axes({ xl: 'lag', yl: 'r(ℓ)' });
    P.poly([[0, -band], [21, -band], [21, band], [0, band]], 'rgba(111,211,255,.12)');
    acf.forEach((v, i) => { const out = Math.abs(v) > band; P.line([i + 1, i + 1], [0, v], out ? C.bad : C.lime, 5); });
    const pass = Q < 31.41;
    read.innerHTML = `ARX(${n}) fitted on one 4000-sample record, residuals on a fresh one · true system is second order · band ±${band.toFixed(3)} · ${acf.filter((v) => Math.abs(v) > band).length} of 20 lags outside · Ljung-Box Q = ${Q.toFixed(1)} vs 31.4 → ${pass ? ok('white, passes') : bad('not white, fails')}`;
  };
  ctrls.append(select('Model order', [['1', 'ARX(1): too simple'], ['2', 'ARX(2): correct'], ['3', 'ARX(3): one extra']], '1', (v) => { s.n = +v; p.redraw(); }, 'acf-order'),
    row(btn('New experiment', () => { s.seed++; p.redraw(); }, 'acf-new')));
  p.redraw();
};

export default W;
