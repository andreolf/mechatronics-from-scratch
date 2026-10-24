// Lesson widgets. Each one is touch-first: sliders and taps work everywhere; dragging on touch needs the "Drag" toggle.
import { Plot, frame, slider, select, toggle, h, C, f3 } from './plot.js';
import MORE from './signals.js';
import CIRCUITS from './circuits.js';
import DIGITAL from './digital.js';
import SENSORS from './sensors.js';
import DSP from './dsp.js';
import ACTUATORS from './actuators.js';
import EMBEDDED from './embedded.js';
import BUSES from './buses.js';
import DYNAMICS from './dynamics.js';
import CONTROL from './control.js';
import MODERN from './modern.js';

const W = {};
const log10 = Math.log10;

W.tolerance = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { x: 12, lr: -4, la: -6, le: -3.4 };
  const p = new Plot(body, { aspect: 0.36, maxH: 220, x: [1e-13, 1e3], y: [0, 3], logx: true, label: 'Error versus tolerance bound on a log scale' });
  p.draw = (P) => {
    P.axes({ xl: '|error| (log scale)' });
    const bound = 10 ** s.la + 10 ** s.lr * Math.abs(s.x), err = 10 ** s.le;
    const ok = err <= bound;
    P.ctx.fillStyle = '#c6ff1a26'; P.ctx.fillRect(P.sx(1e-13), P.sy(2.4), P.sx(bound) - P.sx(1e-13), P.sy(1.6) - P.sy(2.4));
    P.ctx.fillStyle = C.lime; P.ctx.fillRect(P.sx(bound) - 1, P.sy(2.6), 2, P.sy(1.4) - P.sy(2.6));
    P.text('allowed: atol + rtol·|x|', 1e-12, 2.6, C.lime);
    P.line([1e-13, err], [0.9, 0.9], ok ? C.signal : C.bad, 6);
    P.text('|x̂ − x|', 1e-12, 0.45, ok ? C.signal : C.bad);
    read.innerHTML = `bound <b>${f3(bound)}</b> · error <b>${f3(err)}</b> · <b style="color:${ok ? C.lime : C.bad}">${ok ? 'pass' : 'fail'}</b>`;
    el.dataset.pass = String(ok);
  };
  ctrls.append(
    slider('Expected value x', { min: 0, max: 100, step: 0.5, value: s.x, fmt: (v) => v.toFixed(1) }, (v) => { s.x = v; p.redraw(); }),
    slider('Error |x̂ − x|', { min: -13, max: 2, step: 0.1, value: s.le, fmt: (v) => '1e' + v.toFixed(1) }, (v) => { s.le = v; p.redraw(); }),
    slider('rtol', { min: -12, max: -1, step: 0.5, value: s.lr, fmt: (v) => '1e' + v }, (v) => { s.lr = v; p.redraw(); }),
    slider('atol', { min: -12, max: -1, step: 0.5, value: s.la, fmt: (v) => '1e' + v }, (v) => { s.la = v; p.redraw(); }),
  );
  p.redraw();
};

W.vectors = (el) => {
  const { body, read } = frame(el, { interact: true });
  const v = [[3, 1], [1, 2.5]];
  const p = new Plot(body, { aspect: 0.75, maxH: 440, x: [-4, 4], y: [-3, 4], equal: true, label: 'Two vectors a and b with their dot and cross products' });
  p.draw = (P) => {
    P.axes();
    const [a, b] = v, dot = a[0] * b[0] + a[1] * b[1], cr = a[0] * b[1] - a[1] * b[0], na = Math.hypot(...a), nb = Math.hypot(...b);
    P.poly([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], cr >= 0 ? '#c6ff1a1a' : '#ff6b5b1a');
    const k = dot / (na * na); P.line([b[0], k * a[0]], [b[1], k * a[1]], C.dim, 1.5, [4, 4]); P.arrow(0, 0, k * a[0], k * a[1], C.warn, 4);
    P.arrow(0, 0, a[0], a[1], C.lime); P.arrow(0, 0, b[0], b[1], C.signal); P.handle(a[0], a[1], C.lime); P.handle(b[0], b[1], C.signal);
    P.text('a', a[0] + 0.15, a[1] + 0.15, C.lime); P.text('b', b[0] + 0.15, b[1] + 0.15, C.signal);
    const th = Math.acos(Math.max(-1, Math.min(1, dot / (na * nb)))) * 180 / Math.PI;
    read.innerHTML = `a = (${a.map((x) => x.toFixed(2)).join(', ')}) · b = (${b.map((x) => x.toFixed(2)).join(', ')})<br>a·b = <b>${dot.toFixed(3)}</b> · θ = <b>${th.toFixed(1)}°</b> · (a×b)<sub>z</sub> = <b>${cr.toFixed(3)}</b> (signed area) · projection of b on a in amber`;
  };
  p.handles(() => v, (i, x, y) => { v[i] = [Math.round(x * 4) / 4, Math.round(y * 4) / 4]; p.redraw(); }, el);
  p.redraw();
};

function eig2(a, b, c, d) { const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det; if (disc < 0) return { complex: true, re: tr / 2, im: Math.sqrt(-disc) }; const s = Math.sqrt(disc); const l = [tr / 2 + s, tr / 2 - s]; const vecs = l.map((L) => (Math.abs(b) > 1e-9 ? [b, L - a] : Math.abs(c) > 1e-9 ? [L - d, c] : L === a ? [1, 0] : [0, 1])).map(([x, y]) => { const n = Math.hypot(x, y); return [x / n, y / n]; }); return { l, vecs }; }
W.matrix2d = (el, args) => {
  const mode = args.mode || 'map';
  const { body, read, ctrls } = frame(el);
  const m = { a: 1.5, b: 0.5, c: 0.25, d: 1, ...(args.m || {}) };
  const p = new Plot(body, { aspect: 0.72, maxH: 440, x: [-3, 3], y: [-2.5, 2.5], equal: true, label: 'A 2 by 2 matrix acting on the plane' });
  p.draw = (P) => {
    P.axes();
    const T = ([x, y]) => [m.a * x + m.b * y, m.c * x + m.d * y], det = m.a * m.d - m.b * m.c;
    if (mode === 'svd') {
      const circ = [], ell = []; for (let i = 0; i <= 120; i++) { const t = (i / 120) * 2 * Math.PI; circ.push([Math.cos(t), Math.sin(t)]); ell.push(T([Math.cos(t), Math.sin(t)])); }
      P.line(circ.map((q) => q[0]), circ.map((q) => q[1]), C.dim, 1.5, [4, 4]); P.line(ell.map((q) => q[0]), ell.map((q) => q[1]), C.lime, 2);
      const ata = eig2(m.a * m.a + m.c * m.c, m.a * m.b + m.c * m.d, m.a * m.b + m.c * m.d, m.b * m.b + m.d * m.d);
      const s = ata.l.map((x) => Math.sqrt(Math.max(0, x)));
      ata.vecs.forEach((vv, i) => { P.arrow(0, 0, vv[0], vv[1], C.dim, 1.5); const u = T(vv); P.arrow(0, 0, u[0], u[1], i ? C.signal : C.warn, 3); });
      read.innerHTML = `σ₁ = <b>${s[0].toFixed(3)}</b> (amber) · σ₂ = <b>${s[1].toFixed(3)}</b> (blue) · κ = σ₁/σ₂ = <b>${s[1] > 1e-9 ? (s[0] / s[1]).toFixed(2) : '∞'}</b> · |det| = σ₁σ₂ = <b>${Math.abs(det).toFixed(3)}</b>`;
      return;
    }
    for (let k = -3; k <= 3; k++) { const a1 = T([k, -3]), a2 = T([k, 3]), b1 = T([-3, k]), b2 = T([3, k]); P.line([a1[0], a2[0]], [a1[1], a2[1]], '#2c3124', 1); P.line([b1[0], b2[0]], [b1[1], b2[1]], '#2c3124', 1); }
    P.poly([[0, 0], T([1, 0]), T([1, 1]), T([0, 1])], det >= 0 ? '#c6ff1a22' : '#ff6b5b26', det >= 0 ? '#c6ff1a88' : '#ff6b5b88');
    const e1 = T([1, 0]), e2 = T([0, 1]); P.arrow(0, 0, e1[0], e1[1], C.lime); P.arrow(0, 0, e2[0], e2[1], C.signal);
    let extra = '';
    if (mode === 'eigen') {
      const e = eig2(m.a, m.b, m.c, m.d);
      if (e.complex) extra = ` · eigenvalues <b>${e.re.toFixed(3)} ± ${e.im.toFixed(3)}i</b> (no real eigen-direction: the map rotates)`;
      else { e.vecs.forEach((vv, i) => { P.line([-3 * vv[0], 3 * vv[0]], [-3 * vv[1], 3 * vv[1]], C.warn, 1, [6, 5]); P.arrow(0, 0, e.l[i] * vv[0], e.l[i] * vv[1], C.warn, 3); }); extra = ` · λ₁ = <b>${e.l[0].toFixed(3)}</b>, λ₂ = <b>${e.l[1].toFixed(3)}</b> (amber: Av = λv)`; }
    }
    read.innerHTML = `A e₁ = (${e1.map((x) => x.toFixed(2))}) lime · A e₂ = (${e2.map((x) => x.toFixed(2))}) blue · det A = <b style="color:${Math.abs(det) < 1e-9 ? C.bad : C.bone}">${det.toFixed(3)}</b>${Math.abs(det) < 1e-9 ? ' (singular: the plane collapses)' : ''}${extra}`;
  };
  const sl = (k, label) => slider(label, { min: -2, max: 2, step: 0.05, value: m[k], fmt: (v) => v.toFixed(2) }, (v) => { m[k] = v; p.redraw(); });
  ctrls.append(sl('a', 'a₁₁'), sl('b', 'a₁₂'), sl('c', 'a₂₁'), sl('d', 'a₂₂'));
  p.redraw();
};

function randn(r) { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
W.lsq = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sigma: 0.02, n: 20, seed: 1, offset: true }; const kt = 0.075, tau0 = 0.01;
  const p = new Plot(body, { aspect: 0.62, maxH: 400, x: [0, 10], y: [-0.1, 0.9], label: 'Least-squares fit of torque against current' });
  p.draw = (P) => {
    P.axes({ xl: 'current I [A]', yl: 'torque τ [N·m]' });
    const r = mulberry(s.seed), I = [], T = [];
    for (let i = 0; i < s.n; i++) { const x = 0.5 + (9 * i) / (s.n - 1); I.push(x); T.push(kt * x + tau0 + s.sigma * randn(r)); }
    // normal equations for [k, c] (or k only)
    let k, c = 0;
    if (s.offset) { const n = I.length, sx = I.reduce((a, b) => a + b), sy = T.reduce((a, b) => a + b), sxx = I.reduce((a, b) => a + b * b, 0), sxy = I.reduce((a, x, i) => a + x * T[i], 0); const D = n * sxx - sx * sx; k = (n * sxy - sx * sy) / D; c = (sxx * sy - sx * sxy) / D; }
    else { k = I.reduce((a, x, i) => a + x * T[i], 0) / I.reduce((a, x) => a + x * x, 0); }
    let rss = 0; I.forEach((x, i) => { const f = k * x + c; rss += (T[i] - f) ** 2; P.line([x, x], [T[i], f], C.bad, 1); });
    P.fn((x) => kt * x + tau0, C.dim, 1.5, [5, 5]); P.fn((x) => k * x + c, C.lime, 2.5);
    I.forEach((x, i) => P.dot(x, T[i], C.signal, 3.5));
    read.innerHTML = `fit: k_t = <b>${k.toFixed(5)}</b> N·m/A (true 0.07500, error ${(100 * (k - kt) / kt).toFixed(2)} %)${s.offset ? ` · offset ${c.toFixed(4)} N·m` : ''} · residual sum of squares <b>${rss.toExponential(2)}</b>`;
  };
  ctrls.append(
    slider('Noise σ [N·m]', { min: 0, max: 0.1, step: 0.005, value: s.sigma, fmt: (v) => v.toFixed(3) }, (v) => { s.sigma = v; p.redraw(); }),
    slider('Samples', { min: 3, max: 60, step: 1, value: s.n }, (v) => { s.n = v; p.redraw(); }),
    h('div', { class: 'toggles' }, toggle('Fit an offset too', true, (v) => { s.offset = v; p.redraw(); }), (() => { const b = h('button', { class: 'tog', type: 'button' }, 'New noise'); b.addEventListener('click', () => { s.seed++; p.redraw(); }); return b; })()),
  );
  p.redraw();
};

// orthographic pseudo-3D view of a rotated frame
function rotZYX(yaw, pitch, roll) { const [cy, sy, cp, sp, cr, sr] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch), Math.cos(roll), Math.sin(roll)]; return [[cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr], [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr], [-sp, cp * sr, cp * cr]]; }
W.rotation = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { yaw: 30, pitch: 20, roll: 0 };
  const p = new Plot(body, { aspect: 0.7, maxH: 420, x: [-1.6, 1.6], y: [-1.3, 1.3], equal: true, label: 'A body frame rotated by yaw, pitch and roll' });
  const az = -0.9, el0 = 0.45; // camera
  const proj = ([x, y, z]) => { const X = x * Math.cos(az) - y * Math.sin(az), Y = x * Math.sin(az) + y * Math.cos(az); return [X, z * Math.cos(el0) - Y * Math.sin(el0)]; };
  p.draw = (P) => {
    const R = rotZYX(s.yaw * Math.PI / 180, s.pitch * Math.PI / 180, s.roll * Math.PI / 180);
    const ap = (v, col, w, lab) => { const q = proj(v); P.arrow(0, 0, q[0], q[1], col, w); if (lab) P.text(lab, q[0] * 1.08, q[1] * 1.08, col); };
    ap([1.2, 0, 0], C.rule2, 1.2, 'x₀'); ap([0, 1.2, 0], C.rule2, 1.2, 'y₀'); ap([0, 0, 1.2], C.rule2, 1.2, 'z₀');
    const col = (j) => [R[0][j], R[1][j], R[2][j]];
    const wing = [[0.9, 0, 0], [-0.5, 0.7, 0], [-0.3, 0, 0], [-0.5, -0.7, 0]].map((v) => proj([0, 1, 2].map((i) => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2])));
    P.poly(wing, '#c6ff1a1f', '#c6ff1a99');
    ap(col(0), C.bad, 3, 'x_b'); ap(col(1), C.lime, 3, 'y_b'); ap(col(2), C.signal, 3, 'z_b');
    const lock = Math.abs(Math.abs(s.pitch) - 90) < 0.5;
    read.innerHTML = `R = [${R.map((r) => r.map((x) => (x >= 0 ? ' ' : '') + x.toFixed(3)).join(' ')).join(' ; ')}]<br>det R = <b>${(R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0])).toFixed(6)}</b>${lock ? ' · <b style="color:#ffb547">gimbal lock: yaw and roll now turn the body about the same axis</b>' : ''}`;
    el.dataset.lock = String(lock);
  };
  ctrls.append(
    slider('Yaw ψ (about z)', { min: -180, max: 180, step: 1, value: s.yaw, fmt: (v) => v + '°' }, (v) => { s.yaw = v; p.redraw(); }),
    slider('Pitch θ (about y)', { min: -90, max: 90, step: 1, value: s.pitch, fmt: (v) => v + '°' }, (v) => { s.pitch = v; p.redraw(); }),
    slider('Roll φ (about x)', { min: -180, max: 180, step: 1, value: s.roll, fmt: (v) => v + '°' }, (v) => { s.roll = v; p.redraw(); }),
  );
  p.redraw();
};

W.fderror = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lh: -5 }; const f = Math.sin, df = Math.cos(1), x = 1;
  const p = new Plot(body, { aspect: 0.62, maxH: 400, x: [1e-15, 1], y: [1e-16, 1], logx: true, logy: true, label: 'Finite difference error against step size' });
  const fe = (hh) => Math.abs((f(x + hh) - f(x)) / hh - df) || 1e-17, ce = (hh) => Math.abs((f(x + hh) - f(x - hh)) / (2 * hh) - df) || 1e-17;
  p.draw = (P) => {
    P.axes({ xl: 'step h', yl: '|error|' });
    P.fn(fe, C.warn, 2, null, 400); P.fn(ce, C.lime, 2, null, 400);
    const hh = 10 ** s.lh; P.line([hh, hh], [1e-16, 1], C.fog, 1, [4, 4]); P.dot(hh, fe(hh), C.warn, 5); P.dot(hh, ce(hh), C.lime, 5);
    read.innerHTML = `f = sin x at x = 1 · h = 1e${s.lh.toFixed(1)} · forward error <b style="color:#ffb547">${fe(hh).toExponential(2)}</b> · central error <b style="color:#c6ff1a">${ce(hh).toExponential(2)}</b>`;
  };
  ctrls.append(slider('Step h', { min: -15, max: 0, step: 0.1, value: s.lh, fmt: (v) => '1e' + v.toFixed(1) }, (v) => { s.lh = v; p.redraw(); }));
  p.redraw();
};

W.taylor = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { order: 1, th: 30 };
  const p = new Plot(body, { aspect: 0.62, maxH: 400, x: [-Math.PI, Math.PI], y: [-1.6, 1.6], label: 'sin and its Taylor polynomials' });
  const T = (x, n) => { let t = x, sum = x; for (let k = 3; k <= n; k += 2) { t *= -x * x / ((k - 1) * k); sum += t; } return sum; };
  p.draw = (P) => {
    P.axes({ xl: 'θ [rad]' }); P.fn(Math.sin, C.bone, 2.5); P.fn((x) => T(x, s.order), C.lime, 2, [6, 4]);
    const th = s.th * Math.PI / 180; P.line([th, th], [-1.6, 1.6], C.fog, 1, [3, 4]); P.dot(th, Math.sin(th), C.bone); P.dot(th, T(th, s.order), C.lime);
    const rel = Math.abs(T(th, s.order) - Math.sin(th)) / Math.abs(Math.sin(th) || 1);
    read.innerHTML = `order ${s.order} at θ = ${s.th}° (${th.toFixed(4)} rad): sin θ = <b>${Math.sin(th).toFixed(6)}</b>, polynomial = <b>${T(th, s.order).toFixed(6)}</b>, relative error <b>${(100 * rel).toFixed(4)} %</b>`;
  };
  ctrls.append(
    select('Polynomial order', [['1', '1: θ'], ['3', '3: θ − θ³/6'], ['5', '5'], ['7', '7']], '1', (v) => { s.order = +v; p.redraw(); }, 'taylor-order'),
    slider('Angle θ', { min: -180, max: 180, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; p.redraw(); }),
  );
  p.redraw();
};

W.riemann = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 6, m: 'trap' };
  const v = (t) => 4 + 2 * Math.sin(t / 2) + 0.5 * t - 0.04 * t * t; // scooter speed [m/s], 0..12 s
  const exact = (() => { const F = (t) => 4 * t - 4 * Math.cos(t / 2) + 0.25 * t * t - 0.04 * t ** 3 / 3; return F(12) - F(0); })();
  const p = new Plot(body, { aspect: 0.6, maxH: 380, x: [0, 12], y: [0, 9], label: 'Numerical integration of a speed log' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]', yl: 'v [m/s]' });
    const n = s.m === 'simp' && s.n % 2 ? s.n + 1 : s.n, hh = 12 / n; let A = 0;
    for (let i = 0; i < n; i++) {
      const a = i * hh, b = a + hh;
      if (s.m === 'left') { P.poly([[a, 0], [a, v(a)], [b, v(a)], [b, 0]], '#c6ff1a1f', '#c6ff1a88'); A += hh * v(a); }
      else if (s.m === 'trap') { P.poly([[a, 0], [a, v(a)], [b, v(b)], [b, 0]], '#c6ff1a1f', '#c6ff1a88'); A += hh * (v(a) + v(b)) / 2; }
    }
    if (s.m === 'simp') { for (let i = 0; i < n; i += 2) { const a = i * hh, m = a + hh, b = a + 2 * hh; const xs = [], ys = []; for (let k = 0; k <= 20; k++) { const t = a + (k / 20) * 2 * hh; const L = (t - m) * (t - b) / ((a - m) * (a - b)) * v(a) + (t - a) * (t - b) / ((m - a) * (m - b)) * v(m) + (t - a) * (t - m) / ((b - a) * (b - m)) * v(b); xs.push(t); ys.push(L); } P.poly([[a, 0], ...xs.map((x, k) => [x, ys[k]]), [b, 0]], '#c6ff1a1f', '#c6ff1a88'); A += hh / 3 * (v(a) + 4 * v(m) + v(b)); } }
    P.fn(v, C.bone, 2.5);
    read.innerHTML = `${n} intervals · distance <b>${A.toFixed(6)} m</b> · exact ${exact.toFixed(6)} m · error <b>${(A - exact).toExponential(2)} m</b>`;
  };
  ctrls.append(
    select('Rule', [['left', 'Left Riemann sum'], ['trap', 'Trapezoid'], ['simp', 'Simpson']], 'trap', (v) => { s.m = v; p.redraw(); }, 'riemann-rule'),
    slider('Intervals n', { min: 1, max: 48, step: 1, value: s.n }, (v) => { s.n = v; p.redraw(); }),
  );
  p.redraw();
};

W.response = (el, args) => {
  const first = args.order === 1;
  const { body, read, ctrls } = frame(el);
  const s = { tau: 0.5, zeta: 0.3, wn: 4 };
  const p = new Plot(body, { aspect: 0.58, maxH: 380, x: [0, first ? 3 : 5], y: [0, first ? 1.15 : 1.9], label: first ? 'First-order step response' : 'Second-order step response' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]', yl: 'x / u' }); P.line([0, 10], [1, 1], C.dim, 1, [4, 4]);
    if (first) { P.fn((t) => 1 - Math.exp(-t / s.tau), C.lime, 2.5); P.line([s.tau, s.tau], [0, 0.632], C.warn, 1, [3, 3]); P.dot(s.tau, 1 - Math.exp(-1), C.warn, 5); read.innerHTML = `τ = ${s.tau.toFixed(2)} s · at t = τ the output reaches <b>63.2 %</b> · settles to 2 % after about 4τ = <b>${(4 * s.tau).toFixed(2)} s</b>`; return; }
    const { zeta: z, wn } = s; const xs = [], ys = []; let x = 0, v = 0, mx = 0; const dt = 0.002;
    for (let t = 0; t <= 5; t += dt) { xs.push(t); ys.push(x); mx = Math.max(mx, x); const a = wn * wn * (1 - x) - 2 * z * wn * v; v += a * dt; x += v * dt; }
    P.line(xs, ys, C.lime, 2.5);
    const pred = z < 1 ? Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)) : 0;
    read.innerHTML = `ζ = ${z.toFixed(2)} (${z < 1 ? 'underdamped' : z === 1 ? 'critically damped' : 'overdamped'}) · ω<sub>n</sub> = ${wn} rad/s · overshoot measured <b>${(100 * Math.max(0, mx - 1)).toFixed(1)} %</b>, formula e<sup>−ζπ/√(1−ζ²)</sup> = <b>${(100 * pred).toFixed(1)} %</b>`;
  };
  if (first) ctrls.append(slider('Time constant τ', { min: 0.1, max: 1.5, step: 0.05, value: s.tau, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.tau = v; p.redraw(); }));
  else ctrls.append(slider('Damping ratio ζ', { min: 0.05, max: 2, step: 0.05, value: s.zeta, fmt: (v) => v.toFixed(2) }, (v) => { s.zeta = v; p.redraw(); }), slider('Natural frequency ωn', { min: 1, max: 10, step: 0.5, value: s.wn, fmt: (v) => v + ' rad/s' }, (v) => { s.wn = v; p.redraw(); }));
  p.redraw();
};

W.integrators = (el, args) => {
  const { body, read, ctrls } = frame(el);
  const stiff = args.system === 'stiff';
  const s = { m: args.method || 'euler', h: stiff ? 0.015 : 0.1 };
  const lam = -100; // stiff: x' = lam (x - cos t)
  const T = stiff ? 1.5 : 30;
  const p = new Plot(body, { aspect: 0.6, maxH: 400, x: [0, T], y: stiff ? [-0.5, 1.6] : [-2.5, 2.5], label: 'Numerical integration compared with the exact solution' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]', yl: 'x' });
    const hh = s.h, n = Math.ceil(T / hh); const ts = [0], xs = [stiff ? 1.5 : 1]; let x = xs[0], v = 0, t = 0;
    if (stiff) {
      const f = (t, x) => lam * (x - Math.cos(t));
      for (let k = 0; k < n; k++) {
        if (s.m === 'euler') x = x + hh * f(t, x);
        else if (s.m === 'implicit') x = (x - hh * lam * Math.cos(t + hh)) / (1 - hh * lam);
        else { const k1 = f(t, x), k2 = f(t + hh / 2, x + hh / 2 * k1), k3 = f(t + hh / 2, x + hh / 2 * k2), k4 = f(t + hh, x + hh * k3); x += hh / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
        t += hh; ts.push(t); xs.push(x); if (Math.abs(x) > 1e6) break;
      }
      P.fn((t) => Math.cos(t), C.dim, 1.5, [5, 5]); P.line(ts, xs, C.lime, 2);
      const g = s.m === 'euler' ? Math.abs(1 + hh * lam) : s.m === 'implicit' ? 1 / Math.abs(1 - hh * lam) : NaN;
      read.innerHTML = `x′ = −100 (x − cos t) · h = ${hh.toFixed(4)} s · |amplification| = <b style="color:${g > 1 ? C.bad : C.lime}">${Number.isFinite(g) ? g.toFixed(3) : 'RK4'}</b>${g > 1 ? ' > 1: unstable' : ''} · explicit limit h &lt; 2/100 = 0.02 s`;
      return;
    }
    const E = [0.5]; // omega = 1: x'' = -x
    for (let k = 0; k < n; k++) {
      if (s.m === 'euler') { const nx = x + hh * v, nv = v - hh * x; x = nx; v = nv; }
      else if (s.m === 'symplectic') { v -= hh * x; x += hh * v; }
      else { const f = (x, v) => [v, -x]; const k1 = f(x, v), k2 = f(x + hh / 2 * k1[0], v + hh / 2 * k1[1]), k3 = f(x + hh / 2 * k2[0], v + hh / 2 * k2[1]), k4 = f(x + hh * k3[0], v + hh * k3[1]); x += hh / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v += hh / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); }
      t += hh; ts.push(t); xs.push(x); E.push(0.5 * (x * x + v * v)); if (Math.abs(x) > 1e6) break;
    }
    P.fn(Math.cos, C.dim, 1.5, [5, 5]); P.line(ts, xs, C.lime, 2);
    read.innerHTML = `x″ = −x, x(0) = 1 · h = ${hh.toFixed(3)} s · energy after ${T} s: <b>${(E[E.length - 1] / 0.5).toFixed(4)}×</b> the start · final error <b>${Math.abs(x - Math.cos(t)).toExponential(2)}</b>`;
  };
  const methods = stiff ? [['euler', 'Explicit Euler'], ['implicit', 'Implicit Euler'], ['rk4', 'RK4']] : [['euler', 'Explicit Euler'], ['symplectic', 'Semi-implicit Euler'], ['rk4', 'RK4']];
  ctrls.append(
    select('Method', methods, s.m, (v) => { s.m = v; p.redraw(); }, 'integrator-method'),
    slider('Step h', stiff ? { min: 0.002, max: 0.1, step: 0.001, value: s.h, fmt: (v) => v.toFixed(3) + ' s' } : { min: 0.01, max: 1, step: 0.01, value: s.h, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.h = v; p.redraw(); }),
  );
  p.redraw();
};

W.phase = (el, args) => {
  const { body, read, ctrls } = frame(el);
  const s = { sys: args.system || 'pendulum', c: 0.2, trajs: [[-2.5, 2.2], [0.5, 0]] };
  const p = new Plot(body, { aspect: 0.62, maxH: 420, x: [-7, 7], y: [-3.5, 3.5], label: 'Phase portrait; tap to start a trajectory' });
  const f = (x, y) => (s.sys === 'pendulum' ? [y, -9.81 / 1 * Math.sin(x) / 3 - s.c * y] : [y, s.c * 5 * (1 - x * x) * y - x]);
  const rk = (x, y, hh) => { const k1 = f(x, y), k2 = f(x + hh / 2 * k1[0], y + hh / 2 * k1[1]), k3 = f(x + hh / 2 * k2[0], y + hh / 2 * k2[1]), k4 = f(x + hh * k3[0], y + hh * k3[1]); return [x + hh / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y + hh / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; };
  p.draw = (P) => {
    if (s.sys === 'pendulum') P.setRange([-7, 7], [-3.5, 3.5]); else P.setRange([-3.5, 3.5], [-4.5, 4.5]);
    P.axes({ xl: s.sys === 'pendulum' ? 'θ [rad]' : 'x', yl: s.sys === 'pendulum' ? 'ω [rad/s]' : 'ẋ' });
    const { x0, x1, y0, y1 } = P.view;
    for (let i = 0; i <= 22; i++) for (let j = 0; j <= 14; j++) { const x = x0 + (i / 22) * (x1 - x0), y = y0 + (j / 14) * (y1 - y0); const [u, v] = f(x, y); const n = Math.hypot(u, v) || 1, L = 0.022 * (x1 - x0); P.line([x, x + (u / n) * L], [y, y + (v / n) * L * (y1 - y0) / (x1 - x0) * 1.6], '#3c4232', 1.2); }
    for (const [a, b] of s.trajs) { let x = a, y = b; const xs = [x], ys = [y]; for (let k = 0; k < 3000; k++) { [x, y] = rk(x, y, 0.01); xs.push(x); ys.push(y); } P.line(xs, ys, C.lime, 1.8); P.dot(a, b, C.signal, 4); }
    if (s.sys === 'pendulum') { for (let k = -2; k <= 2; k++) P.dot(k * Math.PI, 0, k % 2 ? C.bad : C.warn, 5); read.innerHTML = 'Equilibria at ω = 0: θ = 2kπ (hanging, amber, stable) and θ = (2k+1)π (upright, red, saddle). Tap the plot to start a trajectory.'; }
    else { P.dot(0, 0, C.bad, 5); read.innerHTML = 'Van der Pol: one unstable equilibrium at the origin, and every trajectory joins the same limit cycle. Tap to start a trajectory.'; }
  };
  p.cv.addEventListener('click', (e) => { const r = p.cv.getBoundingClientRect(); s.trajs.push([p.wx(e.clientX - r.left), p.wy(e.clientY - r.top)]); if (s.trajs.length > 6) s.trajs.shift(); p.redraw(); });
  ctrls.append(
    select('System', [['pendulum', 'Pendulum (g/l = 3.27)'], ['vdp', 'Van der Pol']], s.sys, (v) => { s.sys = v; s.trajs = v === 'pendulum' ? [[-2.5, 2.2], [0.5, 0]] : [[0.1, 0], [3, 3]]; p.redraw(); }, 'phase-system'),
    slider('Damping / μ', { min: 0, max: 1, step: 0.05, value: s.c, fmt: (v) => v.toFixed(2) }, (v) => { s.c = v; p.redraw(); }),
  );
  p.redraw();
};

W.newton = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { x0: 3 }; const f = (x) => x ** 3 - 2 * x - 5, df = (x) => 3 * x * x - 2, root = 2.0945514815423265;
  const p = new Plot(body, { aspect: 0.62, maxH: 400, x: [-1, 4], y: [-12, 40], label: "Newton's method iterations" });
  p.draw = (P) => {
    P.axes({ xl: 'x', yl: 'f(x) = x³ − 2x − 5' }); P.fn(f, C.bone, 2.5);
    let x = s.x0; const rows = [];
    for (let k = 0; k < 6; k++) { const fx = f(x), d = df(x); rows.push(`${k}: x = ${x.toFixed(12)}  error ${Math.abs(x - root).toExponential(2)}`); if (Math.abs(d) < 1e-12) break; const nx = x - fx / d; P.line([x, x], [0, fx], C.dim, 1, [3, 3]); P.line([x, nx], [fx, 0], C.lime, 1.8); P.dot(x, fx, C.signal, 4); x = nx; if (Math.abs(x) > 1e3) break; }
    read.innerHTML = rows.join('<br>');
  };
  ctrls.append(slider('Start x₀', { min: -1, max: 4, step: 0.05, value: s.x0, fmt: (v) => v.toFixed(2) }, (v) => { s.x0 = v; p.redraw(); }));
  p.redraw();
};

W.gd = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a: 0.08 }; const L1 = 1, L2 = 10; // f = 0.5 (L1 x^2 + L2 y^2)
  const p = new Plot(body, { aspect: 0.62, maxH: 400, x: [-3, 3], y: [-2, 2], equal: true, label: 'Gradient descent on an elongated bowl' });
  p.draw = (P) => {
    P.axes();
    for (const c of [0.5, 2, 4.5, 8, 12.5]) { const xs = [], ys = []; for (let i = 0; i <= 100; i++) { const t = (i / 100) * 2 * Math.PI; xs.push(Math.sqrt(2 * c / L1) * Math.cos(t)); ys.push(Math.sqrt(2 * c / L2) * Math.sin(t)); } P.line(xs, ys, '#2f3527', 1.2); }
    let x = 2.6, y = 1.2; const xs = [x], ys = [y];
    for (let k = 0; k < 40; k++) { x -= s.a * L1 * x; y -= s.a * L2 * y; xs.push(x); ys.push(y); if (Math.abs(y) > 50) break; }
    P.line(xs, ys, C.lime, 1.8); xs.forEach((q, i) => P.dot(q, ys[i], C.signal, 2.5));
    const f = 0.5 * (L1 * x * x + L2 * y * y), stable = s.a < 2 / L2;
    read.innerHTML = `f = ½(x² + 10y²) · step α = ${s.a.toFixed(3)} · stable while α &lt; 2/L = <b>0.200</b> · after 40 steps f = <b style="color:${stable ? C.lime : C.bad}">${f.toExponential(2)}</b>`;
  };
  ctrls.append(slider('Step size α', { min: 0.01, max: 0.22, step: 0.005, value: s.a, fmt: (v) => v.toFixed(3) }, (v) => { s.a = v; p.redraw(); }));
  p.redraw();
};

Object.assign(W, MORE, CIRCUITS, DIGITAL, SENSORS, DSP, ACTUATORS, EMBEDDED, BUSES, DYNAMICS, CONTROL, MODERN);

export function hydrateWidgets(root) {
  root.querySelectorAll('.widget[data-widget]').forEach((el) => {
    if (el.dataset.ready) return; const fn = W[el.dataset.widget];
    if (!fn) { el.innerHTML = `<p class="widget-read">Missing widget: ${el.dataset.widget}</p>`; return; }
    let args = {}; try { args = JSON.parse(el.dataset.args || '{}'); } catch { /* defaults */ }
    fn(el, args); el.dataset.ready = '1';
  });
}
export const widgetNames = Object.keys(W);
