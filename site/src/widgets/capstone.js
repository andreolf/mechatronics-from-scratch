// Widgets for Phase 20 (capstones). Sliders, selects, toggles and buttons only, plus optional drag handles.
// All system values are illustrative, matching the lessons' examples. The rope-drive widget is an educational model, not a substitute for the standards.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';
import { button } from '../ui.js';

const W = {};
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const gauss = (r) => () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
const twoUp = (body, n = 2) => { const g = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px' }); body.append(g); const out = []; for (let i = 0; i < n; i++) { const d = h('div'); g.append(d); out.push(d); } return out; };
const rect = (P, x0, y0, x1, y1, fill, stroke) => P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke);
const f3 = (v) => v.toFixed(3), f2 = (v) => v.toFixed(2), f1 = (v) => v.toFixed(1);
const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;

// ---- shared: complex numbers for loop transfer functions ----
const cx = (re, im = 0) => ({ re, im });
const cadd = (a, b) => cx(a.re + b.re, a.im + b.im), cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const cabs = (a) => Math.hypot(a.re, a.im), cexpj = (ph) => cx(Math.cos(ph), Math.sin(ph));
// solve (s I - A) x = b for complex s, real 4x4 A, real b
const csolve = (A, b, s) => {
  const n = b.length, M = A.map((row, i) => row.map((a, j) => cx((i === j ? s.re : 0) - a, i === j ? s.im : 0)).concat([cx(b[i])]));
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (cabs(M[r][i]) > cabs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const k = cdiv(M[r][i], M[i][i]); for (let c = i; c <= n; c++) M[r][c] = cadd(M[r][c], cmul(cx(-k.re, -k.im), M[i][c])); } }
  return M.map((row, i) => cdiv(row[n], row[i]));
};
// phase margin of the loop L(jw) from a log sweep; returns { pm, wc } (pm 180 if no crossover)
const margin = (L, w0 = 0.01, w1 = 1e4, n = 6000) => {
  let prev = null, best = { pm: 180, wc: NaN };
  for (let i = 0; i <= n; i++) { const w = 10 ** (Math.log10(w0) + (i / n) * (Math.log10(w1) - Math.log10(w0))); const v = L(w), m = cabs(v);
    if (prev && (prev.m - 1) * (m - 1) <= 0) { const pm = 180 + deg(Math.atan2(v.im, v.re)); const pmw = ((pm % 360) + 360) % 360; const p2 = pmw > 180 ? pmw - 360 : pmw; if (isNaN(best.wc) || p2 < best.pm) best = { pm: p2, wc: w }; }
    prev = { m }; }
  return best;
};

// ---- shared: the Lesson 02 wheel-inverted pendulum ----
const WIP = { M: 0.9, m: 0.12, r: 0.04, l: 0.07, Ib: 0.004, Iw: 9.6e-5, g: 9.81, kt: 0.25, ke: 0.25, R: 4.0 };
const wipF = (s, v, p = WIP, gain = 1) => {
  const [, xd, th, thd] = s, c = Math.cos(th), sn = Math.sin(th), tau = (gain * 2 * p.kt * (v - p.ke * (xd / p.r - thd))) / p.R;
  const a = p.M + p.m + p.Iw / p.r ** 2, b = p.M * p.l * c, d = p.Ib + p.M * p.l ** 2, f1 = tau / p.r + p.M * p.l * sn * thd * thd, f2 = p.M * p.g * p.l * sn - tau, det = a * d - b * b;
  return [xd, (d * f1 - b * f2) / det, thd, (a * f2 - b * f1) / det];
};
const rk4 = (f, s, dt) => { const k1 = f(s), k2 = f(s.map((x, i) => x + (dt / 2) * k1[i])), k3 = f(s.map((x, i) => x + (dt / 2) * k2[i])), k4 = f(s.map((x, i) => x + dt * k3[i])); return s.map((x, i) => x + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); };
const wipLin = (p = WIP) => { const e = 1e-6, A = [[], [], [], []], z = [0, 0, 0, 0];
  for (let j = 0; j < 4; j++) { const sp1 = z.slice(), sm = z.slice(); sp1[j] = e; sm[j] = -e; const a = wipF(sp1, 0, p), b = wipF(sm, 0, p); for (let i = 0; i < 4; i++) A[i][j] = (a[i] - b[i]) / (2 * e); }
  const a = wipF(z, e, p), b = wipF(z, -e, p); return { A, B: a.map((x, i) => (x - b[i]) / (2 * e)) }; };
const mv = (A, s) => A.map((row) => row.reduce((acc, a, j) => acc + a * s[j], 0));
const K_LQR = { '0.1': [10.0, 20.1042, 43.5847, 4.6709], '1': [3.1623, 13.9654, 19.9217, 2.0972], '10': [1.0, 12.8577, 15.1026, 1.5968], '50': [0.4472, 12.6532, 14.4967, 1.533] };

// ---- p20-l01: requirements traced to tests ----
W.tracegraph = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cap: 2.5, mot: 8, drop: 'none', r6: false };
  const p = new Plot(body, { aspect: 0.62, maxH: 340, x: [0, 10], y: [0, 7], label: 'Requirements linked to the tests that prove them' });
  const redraw = () => {
    const run = (60 * 11.1 * s.cap * 0.85) / (2 * s.mot + 2.666);
    const R = [['R1', 'recovery ≤ 1.5 s', 0.345, 1.5, '<='], ['R2', 'runtime ≥ 30 min', run, 30, '>='], ['R3', 'jitter < 100 µs', 48.473, 100, '<'], ['R4', 'cut-off ≤ 50 ms', 24, 50, '<='], ['R5', 'mass < 1.5 kg', 1.09 + 0.06 * (s.cap - 2.5), 1.5, '<']];
    if (s.r6) R.push(['R6', 'alarm when low', NaN, NaN, '']);
    const T = ['t_recovery', 't_runtime', 't_jitter', 't_cutoff', 't_mass'];
    const pass = R.map(([, , v, lim, op]) => (op === '<=' ? v <= lim : op === '>=' ? v >= lim : op === '<' ? v < lim : false));
    const traced = R.map((r, i) => i < 5 && T[i] !== s.drop);
    p.draw = (P) => { R.forEach(([id, txt], i) => { const y = 6.4 - i * 1.05, col = !traced[i] ? C.bad : pass[i] ? C.lime : C.warn; rect(P, 0.1, y - 0.35, 4.2, y + 0.35, null, col); P.text(`${id} ${txt}`, 0.25, y - 0.1, col);
        if (traced[i]) { P.line([4.2, 5.8], [y, y], col, 2); } });
      T.forEach((t, i) => { const y = 6.4 - i * 1.05, on = t !== s.drop; rect(P, 5.8, y - 0.35, 9.9, y + 0.35, null, on ? C.signal : C.dim); P.text(on ? t : `${t} (removed)`, 5.95, y - 0.1, on ? C.signal : C.dim); }); };
    p.redraw();
    const gaps = R.filter((r, i) => !traced[i]).map((r) => r[0]), fails = R.filter((r, i) => traced[i] && !pass[i]).map((r) => r[0]);
    read.innerHTML = `R2 runtime ${f1(run)} min (${f1(s.cap)} Ah, two motors at ${f1(s.mot)} W) · R5 mass ${f3(R[4][2])} kg · ` +
      (gaps.length ? bad(`untraced: ${gaps.join(', ')}, the traceability check fails`) : ok('every requirement has a test')) + ' · ' + (fails.length ? bad(`failing: ${fails.join(', ')}`) : ok('all traced requirements pass'));
  };
  ctrls.append(slider('Battery capacity (Ah)', { min: 1, max: 5, step: 0.1, value: s.cap, fmt: f1 }, (v) => { s.cap = v; redraw(); }),
    slider('Average power per motor (W)', { min: 2, max: 30, step: 0.5, value: s.mot, fmt: f1 }, (v) => { s.mot = v; redraw(); }),
    select('Remove a test', [['none', 'none'], ['t_recovery', 't_recovery'], ['t_runtime', 't_runtime'], ['t_jitter', 't_jitter'], ['t_cutoff', 't_cutoff'], ['t_mass', 't_mass']], s.drop, (v) => { s.drop = v; redraw(); }, 'trace-drop'),
    toggle('Add R6 without a test', s.r6, (v) => { s.r6 = v; redraw(); }, { id: 'trace-r6' }));
  redraw();
};

// ---- p20-l02: the robot falls without control ----
W.wipfall = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th0: 2, l: 7, ke: 0.25, lin: true };
  const p = new Plot(body, { aspect: 0.58, maxH: 320, x: [0, 1], y: [0, 50], label: 'Tilt against time after release, nonlinear and linear models' });
  const redraw = () => {
    const P0 = { ...WIP, l: s.l / 100, ke: s.ke }, { A } = wipLin(P0), dt = 1e-3;
    let x = [0, 0, rad(s.th0), 0], z = x.slice(), t = 0, t45 = NaN, tl45 = NaN, x45 = 0, at03 = [0, 0]; const tn = [], yn = [], yl = [];
    for (let k = 0; k < 1500 && (isNaN(t45) || isNaN(tl45)); k++) {
      x = rk4((q) => wipF(q, 0, P0), x, dt); const dz = mv(A, z); z = z.map((v, i) => v + dt * dz[i]); t += dt;
      if (k === 299) at03 = [deg(x[2]), deg(z[2])];
      if (isNaN(t45) && Math.abs(x[2]) >= rad(45)) { t45 = t; x45 = x[0]; } if (isNaN(tl45) && Math.abs(z[2]) >= rad(45)) tl45 = t;
      tn.push(t); yn.push(Math.min(60, deg(x[2]))); yl.push(Math.min(60, deg(z[2])));
    }
    const tmax = Math.max(0.4, Math.min(1.5, (t45 || 1.5) * 1.15)); p.setRange([0, tmax], [0, 50]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'tilt (°)' }); P.line([0, tmax], [45, 45], C.dim, 1, [4, 4]); if (s.lin) P.line(tn, yl, C.signal, 2, [6, 4]); P.line(tn, yn, C.lime, 2); P.text('45°', 0.01 * tmax, 46.5, C.dim); };
    p.redraw();
    read.innerHTML = `A[θ̈,θ] ${f3(A[3][2])} s⁻² · at 0.3 s ${sp(C.lime, 'nonlinear')} ${f3(at03[0])}°, ${sp(C.signal, 'linear')} ${f3(at03[1])}°, gap ${f3(Math.abs(at03[0] - at03[1]))}° · ` +
      `reaches 45° in ${isNaN(t45) ? '> 1.5' : f3(t45)} s (linear ${isNaN(tl45) ? '> 1.5' : f3(tl45)} s), wheels roll ${f1(100 * x45)} cm`;
  };
  ctrls.append(slider('Initial tilt (°)', { min: 0.5, max: 10, step: 0.5, value: s.th0, fmt: f1 }, (v) => { s.th0 = v; redraw(); }),
    slider('Centre of mass above the axle (cm)', { min: 3, max: 20, step: 0.5, value: s.l, fmt: f1 }, (v) => { s.l = v; redraw(); }),
    slider('Motor back-EMF constant ke (V·s/rad)', { min: 0, max: 0.5, step: 0.01, value: s.ke, fmt: f2 }, (v) => { s.ke = v; redraw(); }),
    toggle('Show linear model', s.lin, (v) => { s.lin = v; redraw(); }, { id: 'wip-lin' }));
  redraw();
};

// ---- p20-l03: power budget and IMU placement ----
W.powerbudget = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mcu: 60, radio: 30, enc: 40, eta: 90, hcm: 7 };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.75, maxH: 300, x: [0, 4], y: [0, 20], label: 'Battery power by consumer' });
  const q = new Plot(d2, { aspect: 0.75, maxH: 300, x: [0, 30], y: [0, 70], label: 'Accelerometer tilt error against IMU height above the axle' });
  // recovery from 5 degrees with the lesson's torque-input linear model and its LQR gains (Q diag(10, 1, 100, 1), R 50)
  const A = [[0, 1, 0, 0], [0, 0, -7.61389, 0], [0, 0, 0, 1], [0, 0, 130.52376, 0]], B = [0, 53.43385, 0, -519.18339], K = [-0.44721, -0.54742, -2.07102, -0.22371];
  let st = [0, 0, rad(5), 0]; const log = [];
  for (let k = 0; k < 2000; k++) { const v = -K.reduce((a, kk, i) => a + kk * st[i], 0), ds = mv(A, st).map((d, i) => d + B[i] * v); log.push([ds[1], ds[3], st[2]]); st = st.map((x, i) => x + 1e-3 * ds[i]); }
  const err = (hh) => { let e = 0; for (const [xdd, thdd, th] of log) { const ax = 9.81 * Math.sin(th) + (xdd * Math.cos(th) + hh * thdd), az = 9.81 * Math.cos(th) - xdd * Math.sin(th); e = Math.max(e, Math.abs(Math.atan2(ax, az) - th)); } return deg(e); };
  const curve = []; for (let c = 0; c <= 30; c++) curve.push(err(c / 100));
  const bestC = curve.indexOf(Math.min(...curve));
  const redraw = () => {
    const i33 = (s.mcu + 4 + s.radio + 10) / 1000, i5 = s.enc / 1000 + i33, pldo = 1.7 * i33, p5 = (5 * i5) / (s.eta / 100), pbat = p5 + 16, run = (60 * 11.1 * 2.5 * 0.85) / pbat;
    const bars = [['motors', 16, C.signal], ['buck in', p5, C.lime], ['LDO heat', pldo, C.warn]];
    p.setRange([0, 3.2], [0, 18]);
    p.draw = (P) => { P.axes({ xl: '', yl: 'W' }); bars.forEach(([n, v, c], i) => { rect(P, 0.2 + i, 0, 0.9 + i, Math.min(18, v), c, null); P.text(n, 0.2 + i, Math.min(17, v + 2.2), c); P.text(f2(v), 0.2 + i, Math.min(16, v + 0.8), c); }); };
    q.draw = (P) => { P.axes({ xl: 'IMU height (cm)', yl: 'max tilt error (°)' }); P.line(curve.map((_, i) => i), curve, C.lime, 2); P.dot(bestC, curve[bestC], C.signal, 5); P.dot(s.hcm, err(s.hcm / 100), C.warn, 6); };
    p.redraw(); q.redraw();
    read.innerHTML = `3V3 rail ${Math.round(1000 * i33)} mA, 5V rail ${Math.round(1000 * i5)} mA, LDO ${Math.round(1000 * pldo)} mW · battery ${f2(pbat)} W, runtime ${f1(run)} min · ` +
      `${sp(C.warn, `IMU at ${s.hcm} cm: ${f2(err(s.hcm / 100))}°`)}, ${sp(C.signal, `best ${bestC} cm: ${f2(curve[bestC])}°`)}${pldo > 0.5 ? ' · ' + bad('LDO above 0.5 W: use a buck for 3.3 V') : ''}`;
  };
  ctrls.append(slider('MCU current (mA)', { min: 10, max: 200, step: 5, value: s.mcu }, (v) => { s.mcu = v; redraw(); }),
    slider('Radio current (mA)', { min: 0, max: 250, step: 5, value: s.radio }, (v) => { s.radio = v; redraw(); }),
    slider('Encoder current on 5 V (mA)', { min: 0, max: 200, step: 5, value: s.enc }, (v) => { s.enc = v; redraw(); }),
    slider('Buck efficiency (%)', { min: 70, max: 96, step: 1, value: s.eta }, (v) => { s.eta = v; redraw(); }),
    slider('IMU height above the axle (cm)', { min: 0, max: 30, step: 1, value: s.hcm }, (v) => { s.hcm = v; redraw(); }));
  redraw();
};

// ---- p20-l04: the 2 ms loop timeline ----
W.looptiming = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { i2c: '400', mhz: 84, bytes: 32, dma: false };
  const p = new Plot(body, { aspect: 0.42, maxH: 240, x: [0, 2200], y: [0, 3], label: 'Tasks in one 2 ms control period' });
  const redraw = () => {
    const ti2c = (155 / (+s.i2c * 1e3)) * 1e6, cyc = [['encoders', 500], ['filter', 2000], ['control', 1500], ['PWM', 300], ['telemetry', 250 * s.bytes]];
    const tasks = [['IMU I2C', ti2c, C.warn]].concat(cyc.map(([n, c], i) => [n, c / s.mhz, [C.signal, C.lime, C.lime, C.signal, C.fog][i]]));
    // without DMA the CPU waits for the bus; with DMA it starts the transfer (3 µs), reads the encoders, then waits for the IMU data
    const spans = []; let t = 0;
    if (s.dma) { spans.push(['IMU I2C', 0, ti2c, C.warn, 2]); spans.push(['DMA setup', 0, 3, C.fog, 1]); t = 3; spans.push([tasks[1][0], t, t + tasks[1][1], tasks[1][2], 1]); t = Math.max(t + tasks[1][1], ti2c); tasks.slice(2).forEach(([n, d, c]) => { spans.push([n, t, t + d, c, 1]); t += d; }); }
    else tasks.forEach(([n, d, c]) => { spans.push([n, t, t + d, c, 1]); t += d; });
    const end = t, busy = tasks.slice(1).reduce((a, x) => a + x[1], 0) + (s.dma ? 3 : ti2c);
    const xmax = Math.max(2200, end * 1.1); p.setRange([0, xmax], [0, 3]);
    p.draw = (P) => { P.axes({ xl: 'µs', yl: '' }); P.line([2000, 2000], [0, 3], C.bad, 2, [5, 4]); P.text('deadline', 2010, 2.7, C.bad);
      spans.forEach(([n, a, b, c, row]) => { const late = b > 2000; rect(P, a, row - 0.35, Math.max(b, a + xmax / 400), row + 0.35, late ? C.bad : c, null); }); P.text(s.dma ? 'DMA' : 'CPU', 10, 2.45, C.fog); };
    p.redraw();
    read.innerHTML = `IMU read ${f1(ti2c)} µs at ${s.i2c} kHz${s.dma ? ' (DMA, overlaps the CPU)' : ' (CPU waits)'} · ` + tasks.slice(1).map(([n, d]) => `${n} ${f1(d)} µs`).join(', ') +
      ` · CPU busy ${f1(busy)} µs, ${f1(busy / 20)} % of the period · ${end > 2000 ? bad('misses the 2 ms deadline') : ok('meets the 2 ms deadline')}`;
  };
  ctrls.append(select('I2C clock', [['100', '100 kHz'], ['400', '400 kHz'], ['1000', '1 MHz']], s.i2c, (v) => { s.i2c = v; redraw(); }, 'lt-i2c'),
    slider('CPU clock (MHz)', { min: 8, max: 240, step: 4, value: s.mhz }, (v) => { s.mhz = v; redraw(); }),
    slider('Telemetry per loop (bytes)', { min: 0, max: 256, step: 4, value: s.bytes }, (v) => { s.bytes = v; redraw(); }),
    toggle('I2C by DMA', s.dma, (v) => { s.dma = v; redraw(); }, { id: 'lt-dma' }));
  redraw();
};

// ---- p20-l05: PID against LQR on the balancer ----
W.pidvslqr = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { w0: 1, kp: 60, kd: 4, R: '1' };
  const p = new Plot(body, { aspect: 0.58, maxH: 320, x: [0, 4], y: [-3, 3], label: 'Tilt after a kick, PID and LQR' });
  const { A, B } = wipLin();
  const kick = (ctrl) => { let st = [0, 0, 0, s.w0], last = 0, eff = 0, vpk = 0, thm = 0, fell = false; const ys = [];
    for (let k = 0; k < 6000; k++) { const v = clamp(ctrl(st), -11.1, 11.1); eff += v * v * 1e-3; vpk = Math.max(vpk, Math.abs(v)); const ds = mv(A, st).map((d, i) => d + B[i] * v); st = st.map((x, i) => x + 1e-3 * ds[i]);
      if (Math.abs(st[2]) > rad(0.2)) last = (k + 1) * 1e-3; thm = Math.max(thm, Math.abs(st[2])); if (Math.abs(st[2]) > rad(45)) { fell = true; break; } if (k % 10 === 0) ys.push(deg(st[2])); }
    return { last, eff, vpk, thm: deg(thm), fell, ys }; };
  const redraw = () => {
    const K = K_LQR[s.R]; const ki = 150, kx = 0.06, kv = 0.12; let integ = 0;
    const pid = (st) => { const e = st[2] + (kx * st[0] + kv * st[1]); integ += e * 1e-3; return s.kp * e + ki * integ + s.kd * st[3]; };
    const rp = kick(pid), rl = kick((st) => K.reduce((a, kk, i) => a + kk * st[i], 0));
    const Ll = (w) => { const G = csolve(A, B, cx(0, w)); const v = G.reduce((a, g, i) => cadd(a, cmul(cx(K[i]), g)), cx(0)); return cx(-v.re, -v.im); };
    const Lp = (w) => { const G = csolve(A, B, cx(0, w)), c = cx(s.kp, -ki / w); const Ks = [cmul(c, cx(kx)), cmul(c, cx(kv)), c, cx(s.kd)]; const v = G.reduce((a, g, i) => cadd(a, cmul(Ks[i], g)), cx(0)); return cx(-v.re, -v.im); };
    const ml = margin(Ll), mp = margin(Lp), dm = (m) => (isNaN(m.wc) ? '∞' : f1((1000 * rad(m.pm)) / m.wc));
    const ym = Math.max(1, rp.thm, rl.thm) * 1.2; p.setRange([0, 4], [-ym, ym]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'tilt (°)' }); const tx = (a) => a.map((_, i) => i * 0.01); P.line(tx(rp.ys), rp.ys, C.warn, 2); P.line(tx(rl.ys), rl.ys, C.lime, 2); };
    p.redraw();
    const line = (n, r, m, c) => sp(c, n) + (r.fell ? ' ' + bad('falls') : ` recovers in ${f2(r.last)} s, peak ${f2(r.thm)}°, ${f2(r.vpk)} V, effort ${f3(r.eff)} V²·s`) + `, PM ${f1(m.pm)}° at ${f1(m.wc)} rad/s, delay margin ${dm(m)} ms`;
    read.innerHTML = line('PID', rp, mp, C.warn) + ' · ' + line(`LQR (R ${s.R})`, rl, ml, C.lime);
  };
  ctrls.append(slider('Kick: tilt rate (rad/s)', { min: 0.2, max: 3, step: 0.1, value: s.w0, fmt: f1 }, (v) => { s.w0 = v; redraw(); }),
    slider('PID kp (V/rad)', { min: 20, max: 150, step: 5, value: s.kp }, (v) => { s.kp = v; redraw(); }),
    slider('PID kd (V·s/rad)', { min: 0.5, max: 10, step: 0.5, value: s.kd, fmt: f1 }, (v) => { s.kd = v; redraw(); }),
    select('LQR weight on voltage R', [['0.1', '0.1 (aggressive)'], ['1', '1'], ['10', '10'], ['50', '50 (gentle)']], s.R, (v) => { s.R = v; redraw(); }, 'pl-R'));
  redraw();
};

// ---- p20-l06: fault injection on the balancer ----
W.breakit = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fault: 'none', size: 50 };
  const p = new Plot(body, { aspect: 0.58, maxH: 320, x: [0, 6], y: [-10, 10], label: 'Tilt with one fault injected' });
  const { A, B } = wipLin(), K = K_LQR['1'];
  const sizes = { none: ['–', () => ({})], noise: ['noise multiplier', (z) => ({ noise: 1 + z / 5 })], delay: ['extra delay (ms)', (z) => ({ delay: Math.round(z / 2) })], torque: ['torque left (%)', (z) => ({ gain: 1 - z / 100 })], loss: ['–', () => ({ gain: 0 })], bias: ['gyro bias (mrad/s)', (z) => ({ bias: z / 1000 })] };
  const label = (z) => ({ none: 'no fault', noise: `noise ×${f1(1 + z / 5)}`, delay: `+${2 * Math.round(z / 2)} ms delay`, torque: `${100 - z} % torque`, loss: 'motors lost', bias: `gyro bias ${z} mrad/s` }[s.fault]);
  const redraw = () => {
    const o = { noise: 1, delay: 0, gain: 1, bias: 0, ...sizes[s.fault][1](s.size) }, r = rng(7), g = gauss(r), T = 0.002, SUB = 10;
    let st = [0, 0, rad(3), 0], the = st[2], v = 0, eff = 0, sxy = 0, sxx = 0; const buf = Array(o.delay + 1).fill([0, 0, 0, 0]), trips = [], ys = [];
    const f = (q) => wipF(q, v, WIP, o.gain);
    for (let k = 0; k < 3000; k++) {
      const gy = st[3] + o.bias + 0.002 * o.noise * g(), acc = st[2] + 0.02 * o.noise * g(); the = 0.995 * (the + gy * T) + 0.005 * acc;
      buf.push([st[0] + 1e-4 * o.noise * g(), st[1] + 0.005 * o.noise * g(), the, gy]); const used = buf.shift();
      v = trips.includes('tilt > 30°') ? 0 : clamp(K.reduce((a, kk, i) => a + kk * used[i], 0), -11.1, 11.1);
      const ic = (2 * (v - 0.25 * (st[1] / 0.04 - st[3]))) / 4, im = o.gain * ic + 0.02 * g(); sxy = 0.995 * sxy + im * ic; sxx = 0.995 * sxx + ic * ic;
      if (sxx > 0.05 && sxy / sxx < 0.8 && !trips.includes('current mismatch')) trips.push('current mismatch');
      for (let j = 0; j < SUB; j++) st = rk4(f, st, T / SUB);
      eff += v * v * T; if (k % 5 === 0) ys.push(deg(st[2]));
      if (Math.abs(st[2]) > rad(30) && !trips.includes('tilt > 30°')) trips.push('tilt > 30°'); if (Math.abs(st[2]) > rad(80)) break;
    }
    const up = Math.abs(st[2]) < rad(5), off = (o.bias * 0.995 * T) / 0.005, xp = -(K[2] * off + K[3] * o.bias) / K[0];
    const ym = Math.min(90, Math.max(5, ...ys.map(Math.abs)) * 1.2); p.setRange([0, 6], [-ym, ym]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'tilt (°)' }); P.line([0, 6], [30, 30], C.bad, 1, [4, 4]); P.line([0, 6], [-30, -30], C.bad, 1, [4, 4]); P.line(ys.map((_, i) => i * 0.01), ys, up ? C.lime : C.bad, 2); };
    p.redraw();
    const expl = { none: 'nominal', noise: 'effort grows with the noise power', delay: `delay margin ≈ 79.5 ms (Lesson 05)`, torque: 'LQR tolerates gain down to one half', loss: 'the tilt monitor must cut torque', bias: `predicted parking ${f1(100 * xp)} cm` }[s.fault];
    read.innerHTML = `${label(s.size)}: ${up ? ok('upright') : bad('fell')}, effort ${f3(eff)} V²·s, position ${f1(100 * st[0])} cm · monitors: ${trips.length ? sp(C.warn, trips.join(', ')) : 'no trips'} · ${expl}`;
  };
  const sz = slider('Fault size', { min: 0, max: 100, step: 1, value: s.size }, (v) => { s.size = v; redraw(); });
  ctrls.append(select('Fault', [['none', 'none'], ['noise', 'sensor noise'], ['delay', 'extra delay'], ['torque', 'weak motors'], ['loss', 'motors lost'], ['bias', 'gyro bias']], s.fault, (v) => { s.fault = v; redraw(); }, 'bk-fault'), sz);
  redraw();
};

// ---- p20-l07: X-quad mixer with desaturation ----
W.quadmixer = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { T: 9.81, tx: 0.1, ty: 0, tz: 0 };
  const d = 0.22 / Math.SQRT2, c = 0.016, FMAX = 6, MOT = [[d, -d, 1, 'FR'], [-d, d, 1, 'RL'], [d, d, -1, 'FL'], [-d, -d, -1, 'RR']];
  // inverse of the mixer in closed form for this symmetric X frame
  const inv = (T, tx, ty, tz) => MOT.map(([x, y, sg]) => T / 4 + tx / (4 * y) - ty / (4 * x) + tz / (4 * -sg * c));
  const fits = (f) => f.every((v) => v >= -1e-9 && v <= FMAX + 1e-9);
  const bis = (base, dlt) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const k = (lo + hi) / 2; if (fits(base.map((b, j) => b + k * dlt[j]))) lo = k; else hi = k; } return lo; };
  const mix = () => { let f = inv(s.T, s.tx, s.ty, s.tz); if (fits(f)) return [f, 'no saturation'];
    const f0 = inv(s.T, s.tx, s.ty, 0); if (fits(f0)) { const dy = inv(0, 0, 0, s.tz), k = bis(f0, dy); return [f0.map((b, j) => b + k * dy[j]), `yaw limited to ${Math.round(100 * k)} %`]; }
    const b = inv(s.T, 0, 0, 0); if (!fits(b)) return [b.map((v) => clamp(v, 0, FMAX)), 'thrust itself out of range']; const dt = f0.map((v, j) => v - b[j]), k = bis(b, dt); return [b.map((v, j) => v + k * dt[j]), `roll/pitch limited to ${Math.round(100 * k)} %, no yaw`]; };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.8, maxH: 280, x: [0, 4], y: [0, 7], label: 'Motor thrusts against the limit' });
  const q = new Plot(d2, { aspect: 1, maxH: 280, x: [-0.3, 0.3], y: [-0.3, 0.3], equal: true, label: 'Top view of the X frame, motors sized by thrust' });
  const redraw = () => {
    const [f, note] = mix(), got = [f.reduce((a, b) => a + b, 0), f.reduce((a, v, i) => a + MOT[i][1] * v, 0), f.reduce((a, v, i) => a - MOT[i][0] * v, 0), f.reduce((a, v, i) => a - MOT[i][2] * c * v, 0)];
    p.draw = (P) => { P.axes({ xl: '', yl: 'N' }); P.line([0, 4], [FMAX, FMAX], C.bad, 1.5, [5, 4]); f.forEach((v, i) => { rect(P, 0.15 + i, 0, 0.85 + i, v, v >= FMAX - 1e-6 || v <= 1e-6 ? C.warn : C.lime, null); P.text(`${MOT[i][3]} ${f2(v)}`, 0.12 + i, Math.min(6.6, v + 0.3), C.bone); }); };
    q.draw = (P) => { P.line([-d, d], [-d, d], C.dim, 3); P.line([-d, d], [d, -d], C.dim, 3); P.arrow(0, 0, 0.12, 0, C.fog, 2); P.text('front', 0.13, -0.02, C.fog);
      MOT.forEach(([x, y, sg], i) => { const rr = 0.02 + 0.012 * f[i]; const pts = []; for (let k = 0; k < 24; k++) pts.push([x + rr * Math.cos((k / 24) * 6.283), y + rr * Math.sin((k / 24) * 6.283)]); P.poly(pts, null, sg > 0 ? C.signal : C.warn); P.text(sg > 0 ? 'ccw' : 'cw', x - 0.02, y - 0.005, sg > 0 ? C.signal : C.warn); P.text(MOT[i][3], x - 0.015, y + rr + 0.015, C.fog); }); };
    p.redraw(); q.redraw();
    read.innerHTML = `thrusts ${f.map(f3).join(', ')} N · delivered T ${f2(got[0])} N, τx ${f3(got[1])}, τy ${f3(got[2])}, τz ${f3(got[3])} N·m · ${note === 'no saturation' ? ok(note) : sp(C.warn, note)} · roll accel ${f2(got[1] / 0.012)} rad/s², yaw accel ${f2(got[3] / 0.022)} rad/s²`;
  };
  ctrls.append(slider('Total thrust T (N)', { min: 0, max: 24, step: 0.01, value: s.T, fmt: f2 }, (v) => { s.T = v; redraw(); }),
    slider('Roll torque τx (N·m)', { min: -1.6, max: 1.6, step: 0.01, value: s.tx, fmt: f2 }, (v) => { s.tx = v; redraw(); }),
    slider('Pitch torque τy (N·m)', { min: -1.6, max: 1.6, step: 0.01, value: s.ty, fmt: f2 }, (v) => { s.ty = v; redraw(); }),
    slider('Yaw torque τz (N·m)', { min: -0.3, max: 0.3, step: 0.01, value: s.tz, fmt: f2 }, (v) => { s.tz = v; redraw(); }));
  redraw();
};

// ---- small dense matrix helpers ----
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((a, v, k) => a + v * B[k][j], 0)));
const mt = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const madd = (A, B, k = 1) => A.map((r, i) => r.map((v, j) => v + k * B[i][j]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const inv3 = (m) => { const [[a, b, c], [d, e, f], [g, hh, i]] = m, A = e * i - f * hh, B = -(d * i - f * g), Cc = d * hh - e * g, det = a * A + b * B + c * Cc;
  return [[A, -(b * i - c * hh), b * f - c * e], [B, a * i - c * g, -(a * f - c * d)], [Cc, -(a * hh - b * g), a * e - b * d]].map((r) => r.map((v) => v / det)); };

// ---- p20-l08: attitude estimation on a simulated flight ----
W.attest = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { est: 'ekf', bias: 1, dist: 0.3, alpha: 0.99 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 30], y: [-30, 30], label: 'True roll and its estimate during manoeuvring flight' });
  const g = 9.81, T = 1 / 125, N = 3750, BIAS = [0.02, -0.015, 0.01];
  const er = (phi, th, w) => [w[0] + (w[1] * Math.sin(phi) + w[2] * Math.cos(phi)) * Math.tan(th), w[1] * Math.cos(phi) - w[2] * Math.sin(phi)];
  const am = (phi, th) => [g * Math.sin(th), -g * Math.cos(th) * Math.sin(phi), -g * Math.cos(th) * Math.cos(phi)];
  const at = (a) => [Math.atan2(-a[1], -a[2]), Math.atan2(a[0], Math.hypot(a[1], a[2]))];
  const redraw = () => {
    const G = gauss(rng(3)); let ad = [0, 0, 0]; const data = [];
    for (let k = 0; k < N; k++) { const t = k * T, phi = rad(20) * Math.sin(Math.PI * t), th = rad(15) * Math.sin(0.6 * Math.PI * t + 1), dphi = rad(20) * Math.PI * Math.cos(Math.PI * t), dth = rad(15) * 0.6 * Math.PI * Math.cos(0.6 * Math.PI * t + 1), dpsi = 0.05;
      const w = [dphi - dpsi * Math.sin(th), dth * Math.cos(phi) + dpsi * Math.cos(th) * Math.sin(phi), -dth * Math.sin(phi) + dpsi * Math.cos(th) * Math.cos(phi)];
      ad = ad.map((x) => x + (T / 0.5) * (s.dist * G() * Math.sqrt((2 * 0.5) / T) - x));
      data.push([[phi, th], w.map((x, i) => x + s.bias * BIAS[i] + 0.005 * G()), am(phi, th).map((x, i) => x + ad[i] + 0.3 * G())]); }
    const est = [];
    if (s.est === 'gyro') { let x = data[0][0].slice(); for (const [, w] of data) { const d = er(x[0], x[1], w); x = [x[0] + T * d[0], x[1] + T * d[1]]; est.push(x); } }
    else if (s.est === 'acc') for (const [, , a] of data) est.push(at(a));
    else if (s.est === 'comp') { let x = at(data[0][2]); for (const [, w, a] of data) { const d = er(x[0], x[1], w), m = at(a); x = [0, 1].map((i) => s.alpha * (x[i] + T * d[i]) + (1 - s.alpha) * m[i]); est.push(x); } }
    else { let x = [...at(data[0][2]), 0, 0, 0], P = [[0.01, 0, 0, 0, 0], [0, 0.01, 0, 0, 0], [0, 0, 1e-3, 0, 0], [0, 0, 0, 1e-3, 0], [0, 0, 0, 0, 1e-3]];
      const Q = [[1e-7, 0, 0, 0, 0], [0, 1e-7, 0, 0, 0], [0, 0, 1e-9, 0, 0], [0, 0, 0, 1e-9, 0], [0, 0, 0, 0, 1e-9]], Rm = eye(3).map((r) => r.map((v) => v * 0.25)), e = 1e-6;
      for (const [, w, a] of data) {
        const f = (z) => { const d = er(z[0], z[1], [w[0] - z[2], w[1] - z[3], w[2] - z[4]]); return [z[0] + T * d[0], z[1] + T * d[1], z[2], z[3], z[4]]; };
        const F = eye(5); for (let j = 0; j < 5; j++) { const zp = x.slice(), zm = x.slice(); zp[j] += e; zm[j] -= e; const a1 = f(zp), a2 = f(zm); for (let i = 0; i < 5; i++) F[i][j] = (a1[i] - a2[i]) / (2 * e); }
        x = f(x); P = madd(mm(mm(F, P), mt(F)), Q);
        const H = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]; for (let j = 0; j < 2; j++) { const zp = [x[0], x[1]], zm = [x[0], x[1]]; zp[j] += e; zm[j] -= e; const a1 = am(...zp), a2 = am(...zm); for (let i = 0; i < 3; i++) H[i][j] = (a1[i] - a2[i]) / (2 * e); }
        const S = madd(mm(mm(H, P), mt(H)), Rm), Kg = mm(mm(P, mt(H)), inv3(S)), y = am(x[0], x[1]).map((v, i) => a[i] - v);
        x = x.map((v, i) => v + Kg[i].reduce((acc, k, j) => acc + k * y[j], 0)); P = mm(madd(eye(5), mm(Kg, H), -1), P);
        est.push(x.slice());
      } }
    const errs = []; for (let k = Math.floor(N / 3); k < N; k++) for (let i = 0; i < 2; i++) errs.push(deg(Math.abs(est[k][i] - data[k][0][i])));
    const rms = Math.sqrt(errs.reduce((a, v) => a + v * v, 0) / errs.length), mx = Math.max(...errs);
    const tt = [], tr = [], es = []; for (let k = 0; k < N; k += 5) { tt.push(k * T); tr.push(deg(data[k][0][0])); es.push(clamp(deg(est[k][0]), -60, 60)); }
    p.setRange([0, 30], [-35, 35]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'roll (°)' }); P.line([10, 10], [-35, 35], C.dim, 1, [4, 4]); P.line(tt, tr, C.fog, 2); P.line(tt, es, rms < 2 ? C.lime : C.bad, 1.5); };
    p.redraw();
    const name = { gyro: 'gyro only', acc: 'accelerometer only', comp: `complementary α ${s.alpha}`, ekf: 'EKF with bias states' }[s.est];
    read.innerHTML = `${name}: roll and pitch RMS error ${f2(rms)}°, max ${f2(mx)}° (after 10 s) · ${rms < 2 ? ok('meets the 2° RMS spec') : bad('misses the 2° RMS spec')}${s.est === 'ekf' ? ` · bias estimate ${f3(est[N - 1][2])}, ${f3(est[N - 1][3])} rad/s (true ${f3(s.bias * BIAS[0])}, ${f3(s.bias * BIAS[1])})` : ''}`;
  };
  ctrls.append(select('Estimator', [['gyro', 'gyro only'], ['acc', 'accelerometer only'], ['comp', 'complementary'], ['ekf', 'EKF with bias']], s.est, (v) => { s.est = v; redraw(); }, 'att-est'),
    slider('Gyro bias (× the lesson values)', { min: 0, max: 3, step: 0.1, value: s.bias, fmt: f1 }, (v) => { s.bias = v; redraw(); }),
    slider('Manoeuvre acceleration (m/s²)', { min: 0, max: 1.5, step: 0.05, value: s.dist, fmt: f2 }, (v) => { s.dist = v; redraw(); }),
    slider('Complementary α', { min: 0.9, max: 0.999, step: 0.001, value: s.alpha, fmt: f3 }, (v) => { s.alpha = v; redraw(); }));
  redraw();
};

// ---- shared: quad roll axis with the cascaded controller ----
const quadLoops = (P) => {
  const C1 = (w) => cadd(cadd(cx(P.kpr), cx(0, -P.kir / w)), cdiv(cx(0, P.kdr * w), cx(1, w / 200)));
  const Gp = (w) => cdiv(cmul(cx(P.kt), cexpj(-P.delay * w)), cmul(cx(1, P.taum * w), cx(0, P.Ixx * w)));
  const Li = (w) => cmul(C1(w), Gp(w)), Lo = (w) => { const l = Li(w); return cdiv(cmul(cx(P.kpa), cdiv(l, cadd(cx(1), l))), cx(0, w)); };
  return { Li, Lo };
};
const quadStep = (P, { tgt = 20, tEnd = 1.5, gust = 0, noise = 0, seed = 1 } = {}) => {
  const dt = 2e-4, nd = Math.round(P.delay / dt), buf = Array(nd + 1).fill(0), sub = 10, G = gauss(rng(seed)); let phi = 0, pr = 0, tau = 0, integ = 0, df = 0, pe = 0, u = 0, tpk = 0; const ys = [];
  for (let k = 0; k < tEnd / dt; k++) { const t = k * dt;
    if (k % sub === 0) { const e = P.kpa * (rad(tgt) - (phi + noise * 0.01 * G())) - (pr + noise * 0.05 * G()); integ += e * 0.002; df += 0.002 * 200 * ((e - pe) / 0.002 - df); pe = e; const raw = P.kpr * e + P.kir * integ + P.kdr * df; u = clamp(raw, -1.5, 1.5); if (u !== raw) integ -= e * 0.002; }
    buf.push(u); const ud = buf.shift(); tau += (dt / P.taum) * (P.kt * ud - tau); tpk = Math.max(tpk, Math.abs(tau)); pr += (dt * (tau + (t >= 1 && t < 1.2 ? gust : 0))) / P.Ixx; phi += dt * pr; if (k % 25 === 0) ys.push(deg(phi)); }
  return { ys, dtp: 25 * dt, tpk };
};
const QNOM = { Ixx: 0.012, taum: 0.02, delay: 0.006, kt: 1, kpr: 0.36, kir: 1.0, kdr: 0.004, kpa: 6 };

// ---- p20-l09: cascaded rate and attitude loops ----
W.cascade = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { ...QNOM };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 1.5], y: [0, 30], label: 'Roll response to a 20 degree step through both loops' });
  const redraw = () => {
    const { Li, Lo } = quadLoops(s), mi = margin(Li, 0.1, 3000), mo = margin(Lo, 0.1, 3000), r = quadStep(s), ys = r.ys, pk = Math.max(...ys), ov = (100 * (pk - 20)) / 20;
    const fin = ys[ys.length - 1], i90 = ys.findIndex((y) => y >= 18), unstable = !isFinite(pk) || Math.abs(fin - 20) > 5 || mi.pm < 0 || mo.pm < 0;
    const ym = clamp(pk * 1.15, 25, 60); p.setRange([0, 1.5], [Math.min(0, Math.min(...ys)) - 1, ym]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'roll (°)' }); P.line([0, 1.5], [20, 20], C.dim, 1, [4, 4]); P.line(ys.map((_, i) => i * r.dtp), ys.map((y) => clamp(y, -90, 90)), unstable ? C.bad : ov > 10 ? C.warn : C.lime, 2); };
    p.redraw();
    const sep = mi.wc / mo.wc, good = mi.pm > 45 && mo.pm > 45 && sep > 4;
    read.innerHTML = `rate loop: crossover ${f1(mi.wc)} rad/s, PM ${f1(mi.pm)}° · attitude loop: crossover ${f2(mo.wc)} rad/s, PM ${f1(mo.pm)}° · separation ${f1(sep)}× · ` +
      (unstable ? bad('unstable') : `90 % in ${i90 < 0 ? '> 1500' : Math.round(1000 * i90 * r.dtp)} ms, overshoot ${f1(ov)} %, peak torque ${f3(r.tpk)} N·m`) + ` · ${good ? ok('margins above 45°') : sp(C.warn, 'margin or separation too small')}`;
  };
  ctrls.append(slider('Rate loop kp (N·m·s/rad)', { min: 0.05, max: 1.2, step: 0.01, value: s.kpr, fmt: f2 }, (v) => { s.kpr = v; redraw(); }),
    slider('Attitude loop kp (1/s)', { min: 1, max: 40, step: 0.5, value: s.kpa, fmt: f1 }, (v) => { s.kpa = v; redraw(); }),
    slider('Motor lag (ms)', { min: 5, max: 60, step: 1, value: 1000 * s.taum }, (v) => { s.taum = v / 1000; redraw(); }),
    slider('Loop delay (ms)', { min: 0, max: 30, step: 1, value: 1000 * s.delay }, (v) => { s.delay = v / 1000; redraw(); }));
  redraw();
};

// ---- p20-l10: Monte Carlo robustness over the parameter envelope ----
W.montecarlo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { env: 1, kpr: 0.36, kpa: 6, seed: 42 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 25], y: [0, 90], label: 'Minimum phase margin of each perturbed drone against its loop delay' });
  const redraw = () => {
    const r = rng(s.seed), U = (a, b) => a + (b - a) * r(), e = s.env, pts = [];
    for (let k = 0; k < 300; k++) { const P = { ...QNOM, kpr: s.kpr, kpa: s.kpa, Ixx: 0.012 * U(1 - 0.3 * e, 1 + 0.3 * e), taum: Math.max(0.002, U(0.025 - 0.015 * e, 0.025 + 0.015 * e)), delay: Math.max(0, U(0.007 - 0.005 * e, 0.007 + 0.005 * e)), kt: U(1 - 0.2 * e, 1 + 0.2 * e) };
      const { Li, Lo } = quadLoops(P), m = Math.min(margin(Li, 0.1, 3000, 600).pm, margin(Lo, 0.1, 3000, 600).pm); pts.push([1000 * P.delay, m, P]); }
    const ms = pts.map((q) => q[1]).sort((a, b) => a - b), below = pts.filter((q) => q[1] < 30).length, worst = pts.reduce((a, q) => (q[1] < a[1] ? q : a));
    p.setRange([0, Math.max(14, 1000 * (0.007 + 0.005 * e) * 1.1)], [Math.min(0, ms[0] - 5), 95]);
    p.draw = (P) => { P.axes({ xl: 'loop delay (ms)', yl: 'min phase margin (°)' }); P.line([0, 40], [30, 30], C.bad, 1.5, [5, 4]); pts.forEach(([x, y]) => P.dot(x, y, y < 30 ? C.bad : C.lime, 2.5)); P.dot(worst[0], worst[1], C.warn, 5); };
    p.redraw();
    const w = worst[2];
    read.innerHTML = `300 drones, envelope ×${f1(e)}: minimum ${f1(ms[0])}°, 5th percentile ${f1(ms[14])}°, median ${f1(ms[150])}° · ${below ? bad(`${below} below the 30° floor`) : ok('none below 30°')} · ` +
      sp(C.warn, `worst: Ixx ${(w.Ixx * 1000).toFixed(1)} g·m², motor ${f1(1000 * w.taum)} ms, delay ${f1(1000 * w.delay)} ms, thrust ×${f2(w.kt)}`);
  };
  ctrls.append(slider('Envelope size (× the lesson)', { min: 0.2, max: 2, step: 0.1, value: s.env, fmt: f1 }, (v) => { s.env = v; redraw(); }),
    slider('Rate loop kp', { min: 0.1, max: 1, step: 0.01, value: s.kpr, fmt: f2 }, (v) => { s.kpr = v; redraw(); }),
    slider('Attitude loop kp', { min: 2, max: 20, step: 0.5, value: s.kpa, fmt: f1 }, (v) => { s.kpa = v; redraw(); }),
    button('New samples', () => { s.seed += 1; redraw(); }, 'mc-resample'));
  redraw();
};

// ---- p20-l11: arm torque sizing ----
const CATALOGUE = [['S20', 2.0, 0.06], ['S35', 3.5, 0.08], ['G60', 6.0, 0.17], ['G120', 12.0, 0.35]];
W.armsizing = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { L2: 0.25, L3: 0.2, load: 0.2, alpha: 3, q2: 0, q3: 0 };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.9, maxH: 300, x: [-0.2, 0.55], y: [-0.25, 0.5], equal: true, label: 'Side view of the arm at the chosen pose' });
  const q = new Plot(d2, { aspect: 0.9, maxH: 300, x: [0, 2], y: [0, 13], label: 'Required torque against the chosen motor' });
  const redraw = () => {
    const g = 9.81, M2 = 0.3 * (s.L2 / 0.25), M3 = 0.2 * (s.L3 / 0.2), ME = 0.15, ML = s.load;
    const tq = (a2, a3) => { const xe = s.L2 * Math.cos(a2), xc3 = xe + (s.L3 / 2) * Math.cos(a2 + a3), xt = xe + s.L3 * Math.cos(a2 + a3); return [g * (M2 * (s.L2 / 2) * Math.cos(a2) + ME * xe + M3 * xc3 + ML * xt), g * (M3 * (xc3 - xe) + ML * (xt - xe))]; };
    const now = tq(rad(s.q2), rad(s.q3)), wst = [0, 0]; for (let a = -90; a <= 90; a += 2) for (let b = -150; b <= 150; b += 5) { const t = tq(rad(a), rad(b)); wst[0] = Math.max(wst[0], Math.abs(t[0])); wst[1] = Math.max(wst[1], Math.abs(t[1])); }
    const Ish = (M2 * s.L2 ** 2) / 3 + ME * s.L2 ** 2 + M3 * (s.L2 ** 2 + s.L2 * s.L3 + s.L3 ** 2 / 3) + ML * (s.L2 + s.L3) ** 2, Iel = (M3 * s.L3 ** 2) / 3 + ML * s.L3 ** 2;
    const need = [1.5 * (wst[0] + s.alpha * Ish), 1.5 * (wst[1] + s.alpha * Iel)], pick = need.map((n) => CATALOGUE.find((c) => c[1] >= n));
    const e = [s.L2 * Math.cos(rad(s.q2)), 0.1 + s.L2 * Math.sin(rad(s.q2))], t = [e[0] + s.L3 * Math.cos(rad(s.q2 + s.q3)), e[1] + s.L3 * Math.sin(rad(s.q2 + s.q3))];
    p.draw = (P) => { rect(P, -0.05, -0.25, 0.05, 0.1, null, C.dim); P.line([0, e[0], t[0]], [0.1, e[1], t[1]], C.lime, 4); P.dot(0, 0.1, C.signal, 5); P.dot(e[0], e[1], C.signal, 5); P.dot(t[0], t[1], C.warn, 6); P.line([-0.2, 0.55], [-0.25, -0.25], C.dim, 1); };
    const ymax = Math.max(13, ...need) * 1.1; q.setRange([0, 2], [0, ymax]);
    q.draw = (P) => { P.axes({ xl: '', yl: 'N·m' }); need.forEach((n, i) => { const c = pick[i]; if (c) rect(P, 0.15 + i, 0, 0.85 + i, c[1], null, C.signal); rect(P, 0.3 + i, 0, 0.7 + i, n, c ? C.lime : C.bad, null); P.text(i ? 'elbow' : 'shoulder', 0.15 + i, ymax * 0.86, C.bone); }); };
    p.redraw(); q.redraw();
    const desc = (i) => (pick[i] ? `${pick[i][0]} (${pick[i][1]} N·m) at ${Math.round((100 * need[i]) / pick[i][1])} %` : bad('no motor in the catalogue is big enough'));
    read.innerHTML = `pose torque: shoulder ${f3(now[0])}, elbow ${f3(now[1])} N·m · worst static ${f3(wst[0])} and ${f3(wst[1])} N·m (arm horizontal) · required with ${f1(s.alpha)} rad/s² and SF 1.5: ${f3(need[0])} and ${f3(need[1])} N·m · shoulder ${desc(0)}, elbow ${desc(1)}${pick[1] && pick[1][2] > ME ? ' · ' + sp(C.warn, 'elbow motor heavier than the 0.15 kg assumed: iterate') : ''}`;
  };
  ctrls.append(slider('Upper arm (m)', { min: 0.15, max: 0.4, step: 0.01, value: s.L2, fmt: f2 }, (v) => { s.L2 = v; redraw(); }),
    slider('Forearm (m)', { min: 0.1, max: 0.35, step: 0.01, value: s.L3, fmt: f2 }, (v) => { s.L3 = v; redraw(); }),
    slider('Payload with gripper (kg)', { min: 0, max: 1, step: 0.05, value: s.load, fmt: f2 }, (v) => { s.load = v; redraw(); }),
    slider('Required acceleration (rad/s²)', { min: 0, max: 10, step: 0.5, value: s.alpha, fmt: f1 }, (v) => { s.alpha = v; redraw(); }),
    slider('Shoulder angle (°)', { min: -90, max: 90, step: 1, value: s.q2 }, (v) => { s.q2 = v; redraw(); }),
    slider('Elbow angle (°)', { min: -150, max: 150, step: 1, value: s.q3 }, (v) => { s.q3 = v; redraw(); }));
  redraw();
};

// ---- p20-l12: IK and quintic pick-and-place ----
W.pickplace = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const s = { pick: [0.3, -0.1], place: [0.05, 0.32], t: 0, vmax: 3, amax: 3 };
  const H = 0.1, L2 = 0.25, L3 = 0.2, LIM = [180, 90, 149].map(rad), CPR = 4096;
  const fk = (q) => { const r = L2 * Math.cos(q[1]) + L3 * Math.cos(q[1] + q[2]), z = H + L2 * Math.sin(q[1]) + L3 * Math.sin(q[1] + q[2]); return [r * Math.cos(q[0]), r * Math.sin(q[0]), z]; };
  const ik = (pt) => { const yaw = Math.atan2(pt[1], pt[0]), r = Math.hypot(pt[0], pt[1]), z = pt[2] - H, c3 = (r * r + z * z - L2 * L2 - L3 * L3) / (2 * L2 * L3); if (Math.abs(c3) > 1) return null;
    const q3 = -Math.acos(c3), q2 = Math.atan2(z, r) - Math.atan2(L3 * Math.sin(q3), L2 + L3 * Math.cos(q3)), q = [yaw, q2, q3]; return q.every((v, i) => Math.abs(v) <= LIM[i]) ? q : null; };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 1, maxH: 300, x: [-0.45, 0.45], y: [-0.45, 0.45], equal: true, label: 'Top view: drag the pick and place points' });
  const q = new Plot(d2, { aspect: 1, maxH: 300, x: [-0.05, 0.5], y: [-0.1, 0.45], equal: true, label: 'Side view of the arm in its own vertical plane' });
  const tsl = slider('Time along the motion (%)', { min: 0, max: 100, step: 1, value: 0 }, (v) => { s.t = v; redraw(); });
  const redraw = () => {
    const pk = [...s.pick, 0.02], pl = [...s.place, 0.12], way = [[pk[0], pk[1], 0.08], pk, [pk[0], pk[1], 0.08], [pl[0], pl[1], 0.18], pl, [pl[0], pl[1], 0.18]], qs = way.map(ik);
    let txt, arm = null, tip = null;
    if (qs.some((v) => !v)) { txt = bad('a waypoint is out of reach or past a joint limit: rejected, not clipped'); }
    else { const seg = []; for (let i = 0; i < 5; i++) { const dq = Math.max(...qs[i].map((v, j) => Math.abs(qs[i + 1][j] - v))); seg.push(Math.max((15 / 8) * (dq / s.vmax), Math.sqrt(((10 / Math.sqrt(3)) * dq) / s.amax), 0.2)); }
      const tot = seg.reduce((a, b) => a + b, 0); let tt = (s.t / 100) * tot, i = 0; while (i < 4 && tt > seg[i]) { tt -= seg[i]; i++; } const u = clamp(tt / seg[i], 0, 1), b = 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5; arm = qs[i].map((v, j) => v + (qs[i + 1][j] - v) * b);
      let worst = 0; qs.slice(1).forEach((qq, k) => { const qq2 = qq.map((v) => Math.round(v / ((2 * Math.PI) / CPR)) * ((2 * Math.PI) / CPR)), e = fk(qq2); worst = Math.max(worst, Math.hypot(e[0] - way[k + 1][0], e[1] - way[k + 1][1], e[2] - way[k + 1][2])); });
      let pv = 0, pa = 0; seg.forEach((T, k) => { const dq = Math.max(...qs[k].map((v, j) => Math.abs(qs[k + 1][j] - v))); pv = Math.max(pv, (15 / 8) * (dq / T)); pa = Math.max(pa, ((10 / Math.sqrt(3)) * dq) / T ** 2); });
      tip = fk(arm); txt = `segments ${seg.map(f2).join(', ')} s, total ${f2(tot)} s · peak joint speed ${f3(pv)} rad/s, acceleration ${f3(pa)} rad/s² · worst waypoint error with 12-bit encoders ${f3(1000 * worst)} mm ${worst < 1e-3 ? ok('within 1 mm') : bad('over 1 mm')}`; }
    p.draw = (P) => { const cs = []; for (let k = 0; k <= 48; k++) cs.push([0.45 * Math.cos((k / 48) * 6.283), 0.45 * Math.sin((k / 48) * 6.283)]); P.poly(cs, null, C.dim); P.dot(0, 0, C.dim, 5);
      P.handle(s.pick[0], s.pick[1], C.warn); P.text('pick', s.pick[0] + 0.03, s.pick[1], C.warn); P.handle(s.place[0], s.place[1], C.signal); P.text('place', s.place[0] + 0.03, s.place[1], C.signal); if (tip) { P.line([0, tip[0]], [0, tip[1]], C.lime, 3); P.dot(tip[0], tip[1], C.lime, 5); } };
    q.draw = (P) => { P.line([-0.05, 0.5], [0, 0], C.dim, 1); if (arm) { const e = [L2 * Math.cos(arm[1]), H + L2 * Math.sin(arm[1])], t = [e[0] + L3 * Math.cos(arm[1] + arm[2]), e[1] + L3 * Math.sin(arm[1] + arm[2])]; P.line([0, 0, e[0], t[0]], [0, H, e[1], t[1]], C.lime, 4); P.dot(e[0], e[1], C.signal, 4); P.dot(t[0], t[1], C.warn, 5); } };
    p.redraw(); q.redraw(); read.innerHTML = txt;
  };
  const setS = (c, v) => { const inp = c.querySelector('input'); inp.value = v; inp.dispatchEvent(new Event('input')); };
  const sl = { px: slider('Pick x (m)', { min: -0.44, max: 0.44, step: 0.01, value: s.pick[0], fmt: f2 }, (v) => { s.pick = [v, s.pick[1]]; redraw(); }),
    py: slider('Pick y (m)', { min: -0.44, max: 0.44, step: 0.01, value: s.pick[1], fmt: f2 }, (v) => { s.pick = [s.pick[0], v]; redraw(); }),
    qx: slider('Place x (m)', { min: -0.44, max: 0.44, step: 0.01, value: s.place[0], fmt: f2 }, (v) => { s.place = [v, s.place[1]]; redraw(); }),
    qy: slider('Place y (m)', { min: -0.44, max: 0.44, step: 0.01, value: s.place[1], fmt: f2 }, (v) => { s.place = [s.place[0], v]; redraw(); }) };
  p.handles(() => [s.pick, s.place], (i, x, y) => { const r = Math.hypot(x, y), k = r > 0.44 ? 0.44 / r : 1; const a = (x * k).toFixed(2), b = (y * k).toFixed(2); if (i === 0) { setS(sl.px, a); setS(sl.py, b); } else { setS(sl.qx, a); setS(sl.qy, b); } }, el);
  ctrls.append(tsl, sl.px, sl.py, sl.qx, sl.qy, slider('Joint speed limit (rad/s)', { min: 0.5, max: 6, step: 0.1, value: s.vmax, fmt: f1 }, (v) => { s.vmax = v; redraw(); }),
    slider('Joint acceleration limit (rad/s²)', { min: 0.5, max: 10, step: 0.1, value: s.amax, fmt: f1 }, (v) => { s.amax = v; redraw(); }));
  redraw();
};

// ---- p20-l13: computed-torque tracking ----
W.cttrack = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { model: true, w: 25, load: 0.2 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 1.6], y: [0, 3], label: 'Tip tracking error during a fast move' });
  const L2 = 0.25, L3 = 0.2, g = 9.81, TM = [6, 2], CPR = 4096;
  const par = (load) => { const m2 = 0.45, lc2 = (0.3 * 0.125 + 0.15 * 0.25) / m2, I2 = (0.3 * L2 ** 2) / 12 + 0.3 * (0.125 - lc2) ** 2 + 0.15 * (L2 - lc2) ** 2, m3 = 0.2 + load, lc3 = (0.2 * 0.1 + load * L3) / m3, I3 = (0.2 * L3 ** 2) / 12 + 0.2 * (0.1 - lc3) ** 2 + load * (L3 - lc3) ** 2; return [m2, lc2, I2, m3, lc3, I3]; };
  const dyn = (q, qd, P) => { const [m2, lc2, I2, m3, lc3, I3] = P, c3 = Math.cos(q[1]), s3 = Math.sin(q[1]);
    const M = [[m2 * lc2 ** 2 + I2 + m3 * (L2 ** 2 + lc3 ** 2 + 2 * L2 * lc3 * c3) + I3, m3 * (lc3 ** 2 + L2 * lc3 * c3) + I3], [m3 * (lc3 ** 2 + L2 * lc3 * c3) + I3, m3 * lc3 ** 2 + I3]], hh = -m3 * L2 * lc3 * s3;
    return [M, [hh * (2 * qd[0] * qd[1] + qd[1] ** 2), -hh * qd[0] ** 2], [g * ((m2 * lc2 + m3 * L2) * Math.cos(q[0]) + m3 * lc3 * Math.cos(q[0] + q[1])), g * m3 * lc3 * Math.cos(q[0] + q[1])]]; };
  const tip = (q) => [L2 * Math.cos(q[0]) + L3 * Math.cos(q[0] + q[1]), L2 * Math.sin(q[0]) + L3 * Math.sin(q[0] + q[1])];
  const redraw = () => {
    const Pt = par(s.load), Pm = par(0.15), q0 = [-0.3, 1.2], q1 = [0.6, -0.4], Tm = 1.2, kp = 3 * s.w ** 2, kd = 3 * s.w, ki = s.w ** 3, Q = (2 * Math.PI) / CPR;
    let x = [...q0, 0, 0], tau = [0, 0], qp = null, integ = [0, 0], qdf = [0, 0], mvE = 0, finE = 0, tpk = [0, 0]; const ts = [], es = [];
    const f = (z) => { const [M, c, G] = dyn([z[0], z[1]], [z[2], z[3]], Pt), r = [0, 1].map((i) => tau[i] - c[i] - G[i] - 0.02 * z[2 + i]), det = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return [z[2], z[3], (M[1][1] * r[0] - M[0][1] * r[1]) / det, (M[0][0] * r[1] - M[1][0] * r[0]) / det]; };
    for (let k = 0; k < 16000; k++) { const t = k * 1e-4;
      if (k % 10 === 0) { const u = clamp(t / Tm, 0, 1), mv_ = t < Tm ? 1 : 0, ref = [0, 1].map((i) => { const d = q1[i] - q0[i]; return [q0[i] + d * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5), (mv_ * d * (30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4)) / Tm, (mv_ * d * (60 * u - 180 * u ** 2 + 120 * u ** 3)) / Tm ** 2]; });
        const qm = [Math.round(x[0] / Q) * Q, Math.round(x[1] / Q) * Q]; if (!qp) qp = qm.slice(); qdf = qdf.map((v, i) => v + 0.3 * ((qm[i] - qp[i]) / 1e-3 - v)); qp = qm.slice();
        const vv = [0, 1].map((i) => { const e = ref[i][0] - qm[i]; integ[i] += e * 1e-3; return ref[i][2] + kd * (ref[i][1] - qdf[i]) + kp * e + ki * integ[i]; });
        let cmd; if (s.model) { const [M, c, G] = dyn(qm, qdf, Pm); cmd = [0, 1].map((i) => M[i][0] * vv[0] + M[i][1] * vv[1] + c[i] + G[i] + 0.02 * qdf[i]); } else cmd = vv.map((v) => 0.05 * v);
        tau = cmd.map((v, i) => clamp(v, -TM[i], TM[i])); tpk = tpk.map((v, i) => Math.max(v, Math.abs(tau[i])));
        const a = tip([x[0], x[1]]), b = tip([ref[0][0], ref[1][0]]), e = 1000 * Math.hypot(a[0] - b[0], a[1] - b[1]); if (t <= Tm) mvE = Math.max(mvE, e); if (t >= Tm + 0.2) finE = Math.max(finE, e); if (k % 50 === 0) { ts.push(t); es.push(e); } }
      x = rk4(f, x, 1e-4); }
    const ym = Math.max(2.5, Math.min(50, mvE * 1.2)); p.setRange([0, 1.6], [0, ym]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'tip error (mm)' }); P.line([0, 1.6], [2, 2], C.warn, 1, [4, 4]); P.line([0, 1.6], [1, 1], C.bad, 1, [4, 4]); P.line([1.2, 1.2], [0, ym], C.dim, 1, [2, 4]); P.line(ts, es.map((v) => Math.min(v, ym)), s.model ? C.lime : C.warn, 2); };
    p.redraw();
    const pass = mvE < 2 && finE < 1;
    read.innerHTML = `${s.model ? 'computed torque (payload modelled as 0.15 kg)' : 'same gains, constant inertia, no model'}, true payload ${f2(s.load)} kg: worst ${f3(mvE)} mm moving, ${f3(finE)} mm settled · peak torque ${f3(tpk[0])} and ${f3(tpk[1])} N·m · ${pass ? ok('meets 2 mm moving, 1 mm settled') : bad('misses the spec')}`;
  };
  ctrls.append(toggle('Use the dynamic model', s.model, (v) => { s.model = v; redraw(); }, { id: 'ct-model' }),
    slider('Bandwidth w (rad/s)', { min: 5, max: 50, step: 1, value: s.w }, (v) => { s.w = v; redraw(); }),
    slider('True payload (kg)', { min: 0, max: 0.5, step: 0.01, value: s.load, fmt: f2 }, (v) => { s.load = v; redraw(); }));
  redraw();
};

// ---- p20-l14: terrace irrigation pump ----
W.pumptank = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { inflow: 1, start: 0.6, stuck: false, failed: false };
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 24], y: [-15, 105], label: 'Tank and sump levels over one day, with the pump state' });
  const AT = 8, AS = 5, HT = 1.5, HS = 1.2, Q = Math.sqrt(8 / 2.7e5);
  const redraw = () => {
    const G = gauss(rng(11)); let tank = 0.5 * HT, sump = 0.8 * HS, on = false, locked = false, lockT = 0, low = [], starts = [], nst = 0, dry = 0, empty = 0, lock = 0; const ts = [], yt = [], ys = [], yp = [];
    for (let t = 0; t < 86400; t++) { const hr = t / 3600, dem = (hr >= 6 && hr < 9) || (hr >= 15 && hr < 18) ? 0.003 * (1 + 0.3 * G()) : 0.0004 * (1 + 0.3 * G()), inflow = s.inflow * 0.003;
      const sm = s.failed ? 9 : sump + 0.005 * G(), sw = s.stuck ? true : sump > 0.2, cur = (sump > 0.05 ? 4 : 2.2) + 0.05 * G(); starts = starts.filter((x) => t - x < 3600);
      const dr = sm < 0.25 || !sw;
      if (on) { low = low.concat([cur < 2.8]).slice(-30); if (low.filter(Boolean).length >= 3) { on = false; locked = true; lockT = t; lock++; } else if (dr) on = false; else if (tank / HT >= 0.9) on = false; }
      else { if (locked && sm >= 0.8 && sw && t - lockT > 600) locked = false; if (!locked && !dr && sm >= 0.8 && tank / HT <= s.start && starts.length < 6) { on = true; starts.push(t); nst++; low = []; } }
      const q = on && sump > 0.05 ? Q : 0; if (on && sump <= 0.05) dry++;
      sump = clamp(sump + (inflow - q) / AS, 0, HS); tank = clamp(tank + (q - Math.min(Math.max(dem, 0), tank * AT)) / AT, 0, HT); if (tank <= 0.001) empty++;
      if (t % 120 === 0) { ts.push(hr); yt.push((100 * tank) / HT); ys.push((100 * sump) / HS); yp.push(on ? -4 : -11); } }
    p.draw = (P) => { P.axes({ xl: 'hour', yl: 'level (%)' }); [[6, 9], [15, 18]].forEach(([a, b]) => rect(P, a, 0, b, 100, 'rgba(111,211,255,0.08)', null)); P.line([0, 24], [100 * s.start, 100 * s.start], C.dim, 1, [4, 4]); P.line([0, 24], [90, 90], C.dim, 1, [4, 4]);
      P.line(ts, yt, C.lime, 2); P.line(ts, ys, C.signal, 2); P.line(ts, yp, C.warn, 2); P.text('tank', 0.3, yt[0] + 4, C.lime); P.text('sump', 0.3, ys[0] - 6, C.signal); P.text('pump', 0.3, -2, C.warn); };
    p.redraw();
    read.innerHTML = `operating point ${f2(1000 * Q)} L/s · ${nst} starts · tank empty ${f1(empty / 60)} min · dry running ${dry} s, ${lock} current lockouts · ` +
      (dry > 3 * Math.max(1, lock) ? bad('runs dry') : dry ? sp(C.warn, 'the current monitor caught dry running') : ok('never ran dry')) + (empty ? ' · ' + sp(C.warn, 'supply below demand: a sizing problem') : '');
  };
  ctrls.append(slider('Canal inflow (× normal)', { min: 0, max: 1.5, step: 0.05, value: s.inflow, fmt: f2 }, (v) => { s.inflow = v; redraw(); }),
    slider('Pump start level (fraction full)', { min: 0.2, max: 0.85, step: 0.05, value: s.start, fmt: f2 }, (v) => { s.start = v; redraw(); }),
    toggle('Float switch stuck OK', s.stuck, (v) => { s.stuck = v; redraw(); }, { id: 'pt-stuck' }),
    toggle('Level sensor failed high', s.failed, (v) => { s.failed = v; redraw(); }, { id: 'pt-failed' }));
  redraw();
};

// ---- p20-l15: rope drive supervisor (educational) ----
W.ropedrive = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { st: 'running', fault: 'drive fault' };
  const VN = 5, AR = 0.3, AC = 0.8, AE = 1.6, AB = 0.4, DT = 0.01;
  const CAT0 = ['estop', 'derailment', 'overspeed', 'rollback', 'rope slip', 'brake fault'], CAT1 = ['wind high', 'safety line lost', 'drive fault'];
  const STATES = ['stopped', 'starting', 'running', 'stopping', 'controlled stop', 'emergency stop', 'locked out'];
  const REACH = { stopped: [[], null, 0.5], starting: [[['start', 0]], null, 2], running: [[['start', 0]], null, 25], stopping: [[['start', 0], ['stop', 20]], null, 22], 'controlled stop': [[['start', 0]], ['wind high', 20], 21], 'emergency stop': [[['start', 0]], ['estop', 20], 20.5], 'locked out': [[['start', 0]], ['estop', 20], 30] };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.75, maxH: 300, x: [0, 60], y: [-1, 6], label: 'Line speed through the scenario' });
  const q = new Plot(d2, { aspect: 0.75, maxH: 300, x: [0, 10], y: [0, 8], label: 'Supervisor states visited after the fault' });
  const run = () => {
    let state = 'stopped', latched = new Set(), tStop = 0, v = 0, a = 0, t = 0, peak = 0, tInj = REACH[s.st][2]; const [plan, pulse] = REACH[s.st], ts = [], vs = [], seen = [], ev = [];
    const step = (faults, cmd) => { if (v > 1.15 * VN) faults.add('overspeed'); if (v < -0.1) faults.add('rollback'); faults.forEach((f) => latched.add(f));
      const c0 = [...faults].some((f) => CAT0.includes(f)), c1 = [...faults].some((f) => CAT1.includes(f));
      if (state === 'locked out') { if (cmd === 'reset' && !faults.size) { latched.clear(); state = 'stopped'; } }
      else if (state === 'emergency stop' && Math.abs(v) < 0.02) state = 'locked out';
      else if (c0 || (state === 'controlled stop' && tStop > 1 && a > -0.75 * AC)) state = 'emergency stop';
      else if (c1 && ['starting', 'running', 'stopping'].includes(state)) { state = 'controlled stop'; tStop = 0; }
      else if (state === 'stopped') { if (latched.size) state = 'locked out'; else if (cmd === 'start') state = 'starting'; }
      else if (state === 'starting' && v >= VN - 1e-6) state = 'running';
      else if (['starting', 'running'].includes(state) && cmd === 'stop') state = 'stopping';
      else if (['stopping', 'controlled stop'].includes(state) && Math.abs(v) < 0.02) state = latched.size ? 'locked out' : 'stopped';
      tStop += DT; };
    const drive = (faults) => { const torque = ['starting', 'running', 'stopping', 'controlled stop'].includes(state), brakes = ['stopped', 'emergency stop', 'locked out'].includes(state);
      if (brakes) { const cap = AE * (faults.has('brake fault') ? 0.6 : 1); if (Math.abs(v) <= cap * DT) { v = 0; a = 0; return; } a = v > 0 ? -cap : cap; }
      else if (torque && !faults.has('drive fault')) a = state === 'starting' ? Math.min(AR, (VN - v) / DT) : { running: 0, stopping: -AR, 'controlled stop': -AC }[state];
      else a = -AB; v += a * DT; };
    while (t < tInj + 30) { const cmd = (plan.find(([, tc]) => Math.abs(t - tc) < DT / 2) || [null])[0], faults = new Set(); if (pulse && t >= pulse[1] && t < pulse[1] + 0.1) faults.add(pulse[0]);
      if (t >= tInj) faults.add(s.fault); const before = state; step(faults, cmd); drive(faults);
      if (t >= tInj) { peak = Math.max(peak, Math.abs(a)); if (!seen.length || seen[seen.length - 1] !== state) { seen.push(state); ev.push(t - tInj); } }
      if (Math.round(t / DT) % 10 === 0) { ts.push(t); vs.push(v); } t += DT; }
    const startAt = (() => { const st0 = state; step(new Set([s.fault]), 'reset'); step(new Set([s.fault]), 'start'); return state === st0 && state === 'locked out'; })();
    return { ts, vs, seen, ev, peak, state, v, refused: startAt, tInj };
  };
  const redraw = () => {
    const r = run(), safe = r.state === 'locked out' && Math.abs(r.v) < 0.02 && r.refused, tmax = r.tInj + 30; p.setRange([0, tmax], [-1, 6]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'speed (m/s)' }); P.line([r.tInj, r.tInj], [-1, 6], C.bad, 1.5, [4, 4]); P.text('fault', r.tInj + 0.5, 5.6, C.bad); P.line(r.ts, r.vs, C.lime, 2); };
    q.draw = (P) => { STATES.forEach((n, i) => { const y = 7.4 - i * 1.05, hit = r.seen.includes(n), fin = n === r.state; rect(P, 0.2, y - 0.4, 9.8, y + 0.4, fin ? 'rgba(198,255,26,0.15)' : null, hit ? (fin ? C.lime : C.warn) : C.dim);
      P.text(n + (CAT0.includes(s.fault) && n === 'emergency stop' ? ' (cat 0)' : CAT1.includes(s.fault) && n === 'controlled stop' ? ' (cat 1)' : ''), 0.45, y - 0.12, hit ? C.bone : C.dim); }); };
    p.redraw(); q.redraw();
    read.innerHTML = `${s.fault} while ${s.st}: ${r.seen.map((n, i) => `${n} at +${f2(r.ev[i])} s`).join(' → ')} · peak deceleration ${f2(r.peak)} m/s² · ` + (safe ? ok('safe: stopped, torque off, brakes on, restart refused while the fault is present') : bad('not safe'));
  };
  ctrls.append(select('State when the fault occurs', STATES.map((n) => [n, n]), s.st, (v) => { s.st = v; redraw(); }, 'rd-state'),
    select('Fault', CAT0.concat(CAT1).map((n) => [n, n]), s.fault, (v) => { s.fault = v; redraw(); }, 'rd-fault'));
  redraw();
};

// ---- p20-l16: portfolio traceability ----
W.portfolio = (el) => {
  const { body, read, ctrls } = frame(el);
  const CAPS = ['balancing robot', 'quadcopter', 'robot arm', 'irrigation pump', 'rope drive supervisor'], ART = ['requirements', 'model', 'code', 'tests', 'results', 'demo'], NREQ = [4, 4, 3, 2, 2];
  const have = CAPS.map(() => ART.map(() => true)); const s = { cap: 0 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 10], y: [0, 6.2], label: 'Artifacts present for each capstone' });
  const tg = ART.map((a, j) => toggle(`${a[0].toUpperCase() + a.slice(1)} present`, true, (v) => { have[s.cap][j] = v; redraw(); }, { id: `pf-${a}` }));
  const sync = () => tg.forEach((t, j) => t.set(have[s.cap][j]));
  const redraw = () => {
    const gaps = []; CAPS.forEach((c, i) => ART.forEach((a, j) => { if (!have[i][j]) gaps.push(`${c}: no ${a}`); }));
    CAPS.forEach((c, i) => { if (have[i][0] && !have[i][3]) gaps.push(`${c}: ${NREQ[i]} requirements without tests`); if (have[i][3] && !have[i][4]) gaps.push(`${c}: tests without recorded results`); });
    p.draw = (P) => { ART.forEach((a, j) => P.text(a.slice(0, 5), 3.3 + j * 1.1, 5.85, C.fog));
      CAPS.forEach((c, i) => { const y = 4.9 - i * 1.05; P.text(c.length > 14 ? c.slice(0, 13) + '…' : c, 0.05, y - 0.1, i === s.cap ? C.lime : C.bone); ART.forEach((a, j) => rect(P, 3.3 + j * 1.1, y - 0.35, 4.2 + j * 1.1, y + 0.35, have[i][j] ? C.lime : C.bad, null)); }); };
    p.redraw();
    const nreq = NREQ.reduce((a, b) => a + b, 0);
    read.innerHTML = gaps.length ? bad(`${gaps.length} problem${gaps.length > 1 ? 's' : ''}: `) + gaps.join('; ') : ok(`5 capstones, ${nreq} requirements all traced to tests with results, every capstone has all six artifacts`);
  };
  ctrls.append(select('Capstone', CAPS.map((c, i) => [String(i), c]), '0', (v) => { s.cap = +v; sync(); redraw(); }, 'pf-cap'), ...tg);
  redraw();
};

export default W;
