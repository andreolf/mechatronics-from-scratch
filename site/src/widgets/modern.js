// Widgets for Phase 14 (modern control and estimation). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const row = (...k) => h('div', { class: 'btn-row' }, ...k);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const deg = (r) => r * 180 / Math.PI, rad = (d) => d * Math.PI / 180;
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));

// ---- small dense linear algebra (arrays of rows) ----
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const mv = (A, x) => A.map((r) => r.reduce((s, v, k) => s + v * x[k], 0));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const madd = (A, B, s = 1) => A.map((r, i) => r.map((v, j) => v + s * B[i][j]));
const msc = (A, s) => A.map((r) => r.map((v) => v * s));
const vadd = (a, b, s = 1) => a.map((v, i) => v + s * b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
function solve(A, Bm) { // solves A X = B (B matrix), Gaussian elimination with partial pivoting
  const n = A.length, M = A.map((r, i) => r.concat(Bm[i])), m = Bm[0].length;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k < n + m; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r.slice(n).map((v) => v / M[i][i]));
}
const inv = (A) => solve(A, eye(A.length));
const norm1 = (A) => Math.max(...A.map((r) => r.reduce((s, v) => s + Math.abs(v), 0)));
function expm(A) { // scaling and squaring with a (6, 6) Pade approximant
  const n = A.length, nr = norm1(A), s = nr > 0 ? Math.max(0, Math.ceil(Math.log2(nr)) + 1) : 0;
  const M = msc(A, 1 / 2 ** s); let c = 1, N = eye(n), D = eye(n), X = eye(n);
  for (let k = 1; k <= 6; k++) { c *= (6 - k + 1) / (k * (12 - k + 1)); X = mm(X, M); N = madd(N, X, c); D = madd(D, X, (k % 2 ? -1 : 1) * c); }
  let E = solve(D, N); for (let i = 0; i < s; i++) E = mm(E, E); return E;
}
function zoh(A, B, T) { // B is a column (array); returns [Ad, Bd column]
  const n = A.length, M = zeros(n + 1, n + 1);
  for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i][j] = A[i][j] * T; M[i][n] = B[i] * T; }
  const E = expm(M); return [E.slice(0, n).map((r) => r.slice(0, n)), E.slice(0, n).map((r) => r[n])];
}
// single-input discrete LQR by Riccati iteration; returns gain row K (u = -Kx) and iteration history
function dlqr(Ad, Bd, Qd, Rd, tol = 1e-11, maxIt = 20000) {
  let P = Qd.map((r) => r.slice()); const hist = []; let K;
  for (let it = 0; it < maxIt; it++) {
    const PB = mv(P, Bd), den = Rd + dot(Bd, PB); K = mv(tr(Ad), PB).map((v) => v / den);
    const Acl = Ad.map((r, i) => r.map((v, j) => v - Bd[i] * K[j])), Pa = madd(Qd, mm(tr(Acl), mm(P, Acl)));
    const Pn = Pa.map((r, i) => r.map((v, j) => (v + Pa[j][i]) / 2 + Rd * K[i] * K[j]));
    let d = 0, mx = 0; for (let i = 0; i < P.length; i++) for (let j = 0; j < P.length; j++) { d = Math.max(d, Math.abs(Pn[i][j] - P[i][j])); mx = Math.max(mx, Math.abs(Pn[i][j])); }
    hist.push(d / mx); P = Pn; if (d / mx < tol) break;
  }
  const PB = mv(P, Bd), den = Rd + dot(Bd, PB); K = mv(tr(Ad), PB).map((v) => v / den);
  return { K, P, hist };
}
// continuous LQR approximated by a fine-step discrete design (cost sampled every T)
function lqrc(A, B, Q, R, T = 0.002) { const [Ad, Bd] = zoh(A, B, T); return dlqr(Ad, Bd, msc(Q, T), R * T).K; }
// complex helpers and roots for eigenvalues
const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const pv = (p, s) => p.reduce((acc, c) => { const m = cm(acc, s); return [m[0] + c, m[1]]; }, [0, 0]);
function roots(p) {
  const a = p.map((c) => c / p[0]), n = a.length - 1; if (n < 1) return [];
  const R0 = 1 + Math.max(...a.slice(1).map(Math.abs)) ** (1 / 1);
  let z = Array.from({ length: n }, (_, i) => { const r = Math.min(R0, 1 + Math.abs(a[n]) ** (1 / n)); return [r * Math.cos(0.4 + 2 * Math.PI * i / n), r * Math.sin(0.4 + 2 * Math.PI * i / n)]; });
  for (let it = 0; it < 800; it++) {
    let mvv = 0;
    z = z.map((zi, i) => { let d = [1, 0]; z.forEach((zj, j) => { if (j !== i) d = cm(d, [zi[0] - zj[0], zi[1] - zj[1]]); }); const st = cdv(pv(a, zi), d); mvv = Math.max(mvv, Math.hypot(st[0], st[1]) / (1 + Math.hypot(zi[0], zi[1]))); return [zi[0] - st[0], zi[1] - st[1]]; });
    if (mvv < 1e-14) break;
  }
  return z;
}
function charpoly(A) { // Faddeev-LeVerrier
  const n = A.length; let M = zeros(n, n); const c = [1];
  for (let k = 1; k <= n; k++) { M = madd(mm(A, M), eye(n), c[k - 1]); const AM = mm(A, M); let t = 0; for (let i = 0; i < n; i++) t += AM[i][i]; c.push(-t / k); }
  return c;
}
const eig = (A) => roots(charpoly(A));
function ackermann(A, B, poles) { // single input; poles as [re, im] pairs closed under conjugation
  const n = A.length; let p = [[1, 0]];
  for (const z of poles) { const q = new Array(p.length + 1).fill(0).map(() => [0, 0]); p.forEach((c, i) => { q[i] = [q[i][0] + c[0], q[i][1] + c[1]]; const m = cm(c, [-z[0], -z[1]]); q[i + 1] = [q[i + 1][0] + m[0], q[i + 1][1] + m[1]]; }); p = q; }
  const a = p.map((c) => c[0]);
  let phi = zeros(n, n), Ak = eye(n); for (let i = n; i >= 0; i--) { phi = madd(phi, Ak, a[i]); Ak = mm(Ak, A); }
  const cols = [B]; for (let i = 1; i < n; i++) cols.push(mv(A, cols[i - 1]));
  const Cc = tr(cols), last = inv(Cc)[n - 1];
  return mv(tr(phi), last);
}
const pair = (wn, z) => [[-z * wn, wn * Math.sqrt(Math.max(0, 1 - z * z))], [-z * wn, -wn * Math.sqrt(Math.max(0, 1 - z * z))]];
function rankOf(M, tol = 1e-9) { // row echelon rank
  const A = M.map((r) => r.slice()); const rows = A.length, cols = A[0].length; let rk = 0; const scale = Math.max(1, ...A.flat().map(Math.abs));
  for (let c = 0; c < cols && rk < rows; c++) {
    let p = rk; for (let r = rk + 1; r < rows; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < tol * scale) continue;
    [A[rk], A[p]] = [A[p], A[rk]];
    for (let r = 0; r < rows; r++) if (r !== rk) { const f = A[r][c] / A[rk][c]; for (let k = c; k < cols; k++) A[r][k] -= f * A[rk][k]; }
    rk++;
  }
  return { rank: rk, R: A };
}
function nullspace(M, tol = 1e-9) {
  const { rank: rk, R } = rankOf(M, tol), cols = M[0].length, piv = [];
  for (let r = 0; r < rk; r++) piv.push(R[r].findIndex((v) => Math.abs(v) > tol));
  const free = [...Array(cols).keys()].filter((c) => !piv.includes(c));
  return free.map((f) => { const v = new Array(cols).fill(0); v[f] = 1; piv.forEach((pc, r) => { v[pc] = -R[r][f] / R[r][pc]; }); return v; });
}
// ellipse of a 2x2 covariance at k sigma
function ellipse(P, c, k = 2, n = 60) {
  const a = P[0][0], b = P[0][1], d = P[1][1], t = (a + d) / 2, q = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b));
  const l1 = t + q, l2 = Math.max(0, t - q), th = 0.5 * Math.atan2(2 * b, a - d);
  return Array.from({ length: n + 1 }, (_, i) => { const u = 2 * Math.PI * i / n, x = k * Math.sqrt(l1) * Math.cos(u), y = k * Math.sqrt(l2) * Math.sin(u); return [c[0] + x * Math.cos(th) - y * Math.sin(th), c[1] + x * Math.sin(th) + y * Math.cos(th)]; });
}
const lineXY = (P, pts, color, w, dash) => P.line(pts.map((p) => p[0]), pts.map((p) => p[1]), color, w, dash);
const fmtz = (z) => z[0].toFixed(2) + (Math.abs(z[1]) > 1e-6 ? (z[1] > 0 ? '+' : '−') + Math.abs(z[1]).toFixed(2) + 'j' : '');

// ---- shared models ----
const CP = { M: 0.8, m: 0.25, l: 0.45, g: 9.81 };
function cartpoleAB() {
  const { M, m, l, g } = CP, tot = M + m, den = l * (4 / 3 - m / tot), p2 = g / den, beta = 1 / (tot * den);
  return [[[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], [0, 1 / tot + m * l * beta / tot, 0, -beta]];
}
function cpDeriv(q, F) { // the live lab's nonlinear cart-pole
  const { M, m, l, g } = CP, [, xd, th, thd] = q, sn = Math.sin(th), cs = Math.cos(th), tot = M + m;
  const temp = (F + m * l * thd * thd * sn) / tot;
  const thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd;
  return [xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd];
}
function rk4(f, x, dt) {
  const n = x.length, k1 = f(x), t = new Array(n);
  for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k1[i];
  const k2 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt / 2 * k2[i];
  const k3 = f(t); for (let i = 0; i < n; i++) t[i] = x[i] + dt * k3[i];
  const k4 = f(t); const o = new Array(n);
  for (let i = 0; i < n; i++) o[i] = x[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return o;
}

// p14-l01: trajectories from e^(At)
W.expmtraj = (el) => {
  const { body, read, ctrls } = frame(el);
  const SYS = { node: [[0, 1], [-2, -3]], spiral: [[-0.5, 2], [-2, -0.5]], centre: [[0, 1], [-1, 0]], saddle: [[0.5, 0], [0, -1]], jordan: [[-1, 1], [0, -1]] };
  const s = { sys: 'spiral', t: 1.5 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-2, 2], y: [-2, 2], equal: true, label: 'State trajectories in the phase plane' });
  p.draw = (P) => {
    P.axes({ xl: 'x₁', yl: 'x₂' }); const A = SYS[s.sys];
    const ts = linspace(0, 6, 241), step = expm(msc(A, 6 / 240));
    for (let k = 0; k < 8; k++) {
      let x = [1.6 * Math.cos(k * Math.PI / 4 + 0.2), 1.6 * Math.sin(k * Math.PI / 4 + 0.2)]; const pts = [x];
      for (let i = 1; i < ts.length; i++) { x = mv(step, x); pts.push(x); }
      lineXY(P, pts, k === 0 ? C.lime : C.rule2, k === 0 ? 2.5 : 1.5);
    }
    const x0 = [1.6 * Math.cos(0.2), 1.6 * Math.sin(0.2)], E = expm(msc(A, s.t)), xt = mv(E, x0);
    P.dot(x0[0], x0[1], C.fog, 4); P.dot(xt[0], xt[1], C.warn, 6);
    const ev = eig(A);
    read.innerHTML = `eigenvalues ${ev.map(fmtz).join(', ')} · ${sp(C.warn, `e^(At) at t = ${s.t.toFixed(2)} s`)} = [[${E[0].map((v) => v.toFixed(3)).join(', ')}], [${E[1].map((v) => v.toFixed(3)).join(', ')}]] · x(t) = (${xt.map((v) => v.toFixed(3)).join(', ')})`;
  };
  ctrls.append(select('System', [['node', 'Stable node (−1, −2)'], ['spiral', 'Stable spiral'], ['centre', 'Centre (undamped)'], ['saddle', 'Saddle'], ['jordan', 'Jordan block (defective)']], s.sys, (v) => { s.sys = v; p.redraw(); }, 'expm-sys'),
    slider('Time t', { min: 0, max: 6, step: 0.05, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; p.redraw(); }));
  p.redraw();
};

// p14-l02: reachable set from random bounded inputs
W.reachset = (el) => {
  const { body, read, ctrls } = frame(el);
  const SYS = { dint: [[[0, 1], [0, 0]], [0, 1], 'double integrator'], lags2: [[[-1, 0], [0, -2]], [1, 1], 'lags 1/(s+1), 1/(s+2)'], lags1: [[[-1, 0], [0, -1]], [1, 1], 'two identical lags 1/(s+1)'], one: [[[-1, 0], [0, -2]], [1, 0], 'input on one state only'] };
  const s = { sys: 'lags1', T: 2 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, label: 'End points of many bounded input histories' });
  p.draw = (P) => {
    const [A, B, name] = SYS[s.sys], seg = 10, [Ad, Bd] = zoh(A, B, s.T / seg), r = rng(5), pts = [];
    for (let k = 0; k < 400; k++) { let x = [0, 0]; for (let j = 0; j < seg; j++) { const u = k < 8 ? ((k >> (j % 3)) & 1 ? 1 : -1) : 2 * r() - 1; x = vadd(mv(Ad, x), Bd, u); } pts.push(x); }
    const mx = Math.max(0.3, ...pts.flat().map(Math.abs)) * 1.15; P.setRange([-mx, mx], [-mx, mx]); P.axes({ xl: 'x₁', yl: 'x₂' });
    pts.forEach((q) => P.dot(q[0], q[1], C.lime, 2.2)); P.dot(0, 0, C.warn, 5);
    const rk = rankOf(tr([B, mv(A, B)])).rank;
    read.innerHTML = `${name} · |u| ≤ 1 for ${s.T.toFixed(1)} s · rank [B AB] = ${rk} → ${rk === 2 ? ok('controllable: the cloud fills an area') : bad('not controllable: every end point lies on a line')}`;
  };
  ctrls.append(select('System', Object.entries(SYS).map(([k, v]) => [k, v[2]]), s.sys, (v) => { s.sys = v; p.redraw(); }, 'reach-sys'),
    slider('Time allowed', { min: 0.5, max: 5, step: 0.1, value: s.T, fmt: (v) => v.toFixed(1) + ' s' }, (v) => { s.T = v; p.redraw(); }));
  p.redraw();
};

// p14-l03: cart-pole sensors and observability
W.obsensors = (el) => {
  const { body, read, ctrls } = frame(el);
  const NAMES = ['x', 'ẋ', 'θ', 'θ̇'], s = { on: [false, false, true, false] };
  const [A] = cartpoleAB(), COL = [C.lime, C.signal, C.warn, C.fog];
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 1.5], y: [-1, 1], label: 'Sensor readings for two different starting states' });
  p.draw = (P) => {
    const Cm = NAMES.map((_, i) => [0, 1, 2, 3].map((j) => (j === i ? 1 : 0))).filter((_, i) => s.on[i]);
    P.axes({ xl: 't (s)', yl: 'reading' });
    if (!Cm.length) { read.innerHTML = 'no sensors selected: nothing is observable'; return; }
    const O = []; let CA = Cm; for (let k = 0; k < 4; k++) { O.push(...CA); CA = mm(CA, A); }
    const rk = rankOf(O).rank, N = nullspace(O), v = N.length ? N[0] : [1, 0, 0, 0];
    const vn = Math.hypot(...v), x0 = [0, 0, 0.05, 0], x1 = vadd(x0, v.map((c) => 0.3 * c / vn));
    const ts = linspace(0, 1.5, 151), step = expm(msc(A, 0.01)); let a = x0, b = x1; const ya = [], yb = [];
    for (let i = 0; i < ts.length; i++) { ya.push(mv(Cm, a)); yb.push(mv(Cm, b)); a = mv(step, a); b = mv(step, b); }
    const all = ya.flat().concat(yb.flat()).map(Math.abs), ym = Math.min(5, Math.max(0.1, ...all)) * 1.1; P.setRange([0, 1.5], [-ym, ym]); P.axes({ xl: 't (s)', yl: 'reading' });
    const idx = NAMES.map((_, i) => i).filter((i) => s.on[i]);
    idx.forEach((si, c) => { P.line(ts, ya.map((y) => y[c]), COL[si], 2.5); P.line(ts, yb.map((y) => y[c]), COL[si], 1.8, [6, 4]); });
    read.innerHTML = `sensors ${idx.map((i) => sp(COL[i], NAMES[i])).join(', ')} · rank of the observability matrix ${rk} of 4 → ${rk === 4 ? ok('observable') : bad('not observable')} · solid and dashed start ${rk === 4 ? 'from two states 0.3 apart (readings differ)' : 'from two states differing along the unobservable direction (' + v.map((c) => (c / vn).toFixed(2)).join(', ') + '): identical readings'}`;
  };
  ctrls.append(...NAMES.map((n, i) => toggle(`Sensor ${n}`, s.on[i], (val) => { s.on[i] = val; p.redraw(); }, { id: `obs-${i}` })));
  p.redraw();
};

// p14-l04: pole placement on an anti-sway crane
W.poleplace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { wt: 0.8, zt: 0.8, ws: 1.2, zs: 0.7 }; const M = 500, m = 1000, L = 8, g = 9.81;
  const A = [[0, 1, 0, 0], [0, 0, m * g / M, 0], [0, 0, 0, 1], [0, 0, -(M + m) * g / (M * L), 0]], B = [0, 1 / M, 0, -1 / (M * L)];
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 30], y: [0, 12], label: 'Trolley position during a 10 m move' });
  const q = new Plot(body, { aspect: 0.4, maxH: 210, x: [0, 30], y: [-15, 15], label: 'Load sway angle' });
  let sim = null;
  const compute = () => {
    const K = ackermann(A, B, [...pair(s.wt, s.zt), ...pair(s.ws, s.zs)]);
    const Acl = A.map((r, i) => r.map((v, j) => v - B[i] * K[j])), E = expm(msc(Acl, 0.05));
    let e = [-10, 0, 0, 0]; const ts = [], xs = [], ph = [], Fs = [];
    for (let k = 0; k <= 600; k++) { ts.push(k * 0.05); xs.push(e[0] + 10); ph.push(deg(e[2])); Fs.push(-dot(K, e)); e = mv(E, e); }
    sim = { K, ts, xs, ph, Fs };
  };
  p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'trolley (m)' }); P.line([0, 30], [10, 10], C.dim, 1, [3, 3]); P.line(sim.ts, sim.xs, C.lime, 2.5); };
  q.draw = (P) => { const mx = Math.max(2, ...sim.ph.map(Math.abs)) * 1.15; P.setRange([0, 30], [-mx, mx]); P.axes({ xl: 't (s)', yl: 'sway (°)' }); P.line(sim.ts, sim.ph, C.signal, 2.2); };
  const redraw = () => {
    compute(); p.redraw(); q.redraw();
    const late = Math.max(...sim.ph.slice(300).map(Math.abs));
    read.innerHTML = `open-loop sway ${Math.sqrt((M + m) * g / (M * L)).toFixed(3)} rad/s, undamped · Ackermann K = (${sim.K.map((v) => v.toFixed(0)).join(', ')}) · peak force ${(Math.max(...sim.Fs.map(Math.abs)) / 1000).toFixed(2)} kN · ${sp(C.signal, `peak sway ${Math.max(...sim.ph.map(Math.abs)).toFixed(1)}°`)}, after 15 s ${late.toFixed(3)}° · illustrative crane: 500 kg trolley, 1 t load, 8 m rope`;
  };
  ctrls.append(slider('Trolley poles ω_n', { min: 0.3, max: 2, step: 0.05, value: s.wt, fmt: (v) => v.toFixed(2) + ' rad/s' }, (v) => { s.wt = v; redraw(); }),
    slider('Trolley poles ζ', { min: 0.3, max: 1, step: 0.05, value: s.zt, fmt: (v) => v.toFixed(2) }, (v) => { s.zt = v; redraw(); }),
    slider('Sway poles ω_n', { min: 0.5, max: 3, step: 0.05, value: s.ws, fmt: (v) => v.toFixed(2) + ' rad/s' }, (v) => { s.ws = v; redraw(); }),
    slider('Sway poles ζ', { min: 0.1, max: 1, step: 0.05, value: s.zs, fmt: (v) => v.toFixed(2) }, (v) => { s.zs = v; redraw(); }));
  redraw();
};

// p14-l05: LQR trade-off on a double integrator
W.lqrtrade = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lq: 1 };
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 8], y: [-1.2, 1.2], label: 'Position and force after starting 1 m from the target' });
  const q = new Plot(body, { aspect: 0.5, maxH: 260, x: [0.01, 100], y: [0.01, 100], logx: true, logy: true, label: 'Trade-off between state cost and effort cost' });
  const costs = (qq) => { // integrals of x^2 and u^2 from x0 = (1, 0), closed form via the Lyapunov equation
    const k1 = Math.sqrt(qq), k2 = Math.sqrt(2 * Math.sqrt(qq));
    const Acl = [[0, 1], [-k1, -k2]];
    const lyap = (Qc) => { const M = [[2 * Acl[0][0], 2 * Acl[1][0], 0], [Acl[0][1], Acl[0][0] + Acl[1][1], Acl[1][0]], [0, 2 * Acl[0][1], 2 * Acl[1][1]]]; const r = solve(M, [[-Qc[0][0]], [-Qc[0][1]], [-Qc[1][1]]]); return r[0][0]; };
    return { k1, k2, Jx: lyap([[1, 0], [0, 0]]), Ju: lyap([[k1 * k1, k1 * k2], [k1 * k2, k2 * k2]]) };
  };
  p.draw = (P) => {
    const { k1, k2 } = costs(10 ** s.lq), E = expm([[0, 0.02], [-k1 * 0.02, -k2 * 0.02]]); let x = [1, 0]; const ts = [], xs = [], us = [];
    for (let i = 0; i <= 400; i++) { ts.push(i * 0.02); xs.push(x[0]); us.push(-(k1 * x[0] + k2 * x[1])); x = mv(E, x); }
    const um = Math.max(1.2, ...us.map(Math.abs) ) * 1.1; P.setRange([0, 8], [-um, Math.max(1.2, um * 0.3)]); P.axes({ xl: 't (s)', yl: 'x (m), u (N/kg)' });
    P.line(ts, us, C.warn, 2); P.line(ts, xs, C.lime, 2.5);
  };
  q.draw = (P) => {
    P.axes({ xl: '∫u² dt', yl: '∫x² dt' }); const qs = linspace(-2, 3, 60).map((v) => 10 ** v), cs = qs.map(costs);
    P.line(cs.map((c) => c.Ju), cs.map((c) => c.Jx), C.rule2, 2); const c = costs(10 ** s.lq); P.dot(c.Ju, c.Jx, C.lime, 6);
  };
  const redraw = () => {
    p.redraw(); q.redraw(); const c = costs(10 ** s.lq);
    read.innerHTML = `Q = diag(${(10 ** s.lq).toPrecision(3)}, 0), R = 1 · K = (${c.k1.toFixed(3)}, ${c.k2.toFixed(3)}) · ω_n = ${Math.sqrt(c.k1).toFixed(2)} rad/s, ζ = 0.707 · ${sp(C.lime, `∫x² = ${c.Jx.toFixed(3)}`)}, ${sp(C.warn, `∫u² = ${c.Ju.toFixed(3)}`)} · total cost q∫x² + ∫u² = ${((10 ** s.lq) * c.Jx + c.Ju).toFixed(3)} = P₁₁ = ${(Math.sqrt(2) * (10 ** s.lq) ** 0.75).toFixed(3)}`;
  };
  ctrls.append(slider('State weight q (log₁₀)', { min: -2, max: 3, step: 0.05, value: s.lq, fmt: (v) => (10 ** v).toPrecision(3) }, (v) => { s.lq = v; redraw(); }));
  redraw();
};

// p14-l06: convergence of the discrete Riccati iteration
W.riccaticonv = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { T: 20 }; const [A, B] = cartpoleAB(), Q = [[5, 0, 0, 0], [0, 1, 0, 0], [0, 0, 50, 0], [0, 0, 0, 1]];
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 2000], y: [1e-12, 1], logy: true, label: 'Relative change in P per iteration' });
  p.draw = (P) => {
    const T = s.T / 1000, [Ad, Bd] = zoh(A, B, T), { K, hist } = dlqr(Ad, Bd, msc(Q, T), 0.05 * T, 1e-11);
    const n = hist.length; P.setRange([0, Math.max(50, n * 1.05)], [1e-12, 1]); P.axes({ xl: 'iteration', yl: 'change' });
    P.line(hist.map((_, i) => i + 1), hist.map((v) => Math.max(v, 1e-12)), C.lime, 2.5);
    const Acl = Ad.map((r, i) => r.map((v, j) => v - Bd[i] * K[j])), rho = Math.max(...eig(Acl).map((z) => Math.hypot(z[0], z[1])));
    const i0 = Math.floor(n / 2), pred = hist[i0] * (rho ** 2) ** (n - 1 - i0);
    P.line([i0 + 1, n], [hist[i0], pred], C.warn, 1.5, [5, 4]);
    read.innerHTML = `T = ${s.T} ms · converged to 1e-11 in ${sp(C.lime, n + ' iterations')} · closed-loop spectral radius ρ = ${rho.toFixed(4)}, ${sp(C.warn, `predicted rate ρ² = ${(rho * rho).toFixed(4)} per step`)} · K = (${K.map((v) => v.toFixed(2)).join(', ')})`;
  };
  ctrls.append(slider('Sample time T', { min: 5, max: 100, step: 5, value: s.T, fmt: (v) => v + ' ms' }, (v) => { s.T = v; p.redraw(); }));
  p.redraw();
};

// linearise the lab cart-pole (with its friction) at upright, by central differences
function cpLinear() {
  const A = [0, 1, 2, 3].map(() => new Array(4).fill(0)), B = new Array(4).fill(0), e = 1e-6;
  for (let j = 0; j < 4; j++) { const xp = [0, 0, 0, 0], xm = [0, 0, 0, 0]; xp[j] = e; xm[j] = -e; const fp = cpDeriv(xp, 0), fm = cpDeriv(xm, 0); for (let i = 0; i < 4; i++) A[i][j] = (fp[i] - fm[i]) / (2 * e); }
  const fp = cpDeriv([0, 0, 0, 0], e), fm = cpDeriv([0, 0, 0, 0], -e); for (let i = 0; i < 4; i++) B[i] = (fp[i] - fm[i]) / (2 * e);
  return [A, B];
}
// run the lab cart-pole under a policy: physics 1 kHz, control 200 Hz, 20 ms actuator lag, 30 N limit
function cpRun(policy, th0, T = 8) {
  const h = 1e-3, every = 5, dt = h * every; let s = [0, 0, th0, 0], F = 0, Fc = 0, fell = null; const mem = {}, ts = [], th = [], xs = [];
  for (let k = 0; k < T / h; k++) {
    if (k % every === 0) { Fc = Math.max(-30, Math.min(30, policy(s, dt, mem))); ts.push(k * h); th.push(s[2]); xs.push(s[0]); }
    F += h / 0.02 * (Fc - F); s = rk4((q) => cpDeriv(q, F), s, h);
    if (Math.abs(s[2]) > 1.2) { fell = k * h; ts.push(k * h); th.push(s[2]); xs.push(s[0]); break; }
  }
  return { ts, th, xs, fell };
}
const pidPolicy = (s, dt, mem) => { // lesson p13-l07's PID
  const th = s[2], a = Math.exp(-dt / 0.012);
  mem.d = a * (mem.d || 0) + (1 - a) * (th - (mem.prev ?? th)) / dt; mem.prev = th;
  mem.i = Math.max(-0.5, Math.min(0.5, (mem.i || 0) + th * dt));
  return 38 * th + 6 * mem.i + 7 * mem.d + 1.6 * s[0] + 2.6 * s[1];
};
const settleIdx = (arr, tol) => { for (let i = arr.length - 1; i >= 0; i--) if (Math.abs(arr[i]) > tol) return i + 1; return 0; };

// p14-l07: LQR against PID on the nonlinear cart-pole
W.lqrcartpole = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th0: 15, lq: Math.log10(50), pid: true };
  const [A, B] = cpLinear();
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 8], y: [-20, 20], label: 'Pole angle during recovery' });
  const q = new Plot(body, { aspect: 0.4, maxH: 210, x: [0, 8], y: [-0.6, 0.6], label: 'Cart position during recovery' });
  let L, Pd, K;
  const compute = () => {
    K = lqrc(A, B, [[5, 0, 0, 0], [0, 1, 0, 0], [0, 0, 10 ** s.lq, 0], [0, 0, 0, 1]], 0.05);
    L = cpRun((st) => -dot(K, st), rad(s.th0)); Pd = cpRun(pidPolicy, rad(s.th0));
  };
  p.draw = (P) => {
    const m = Math.max(5, s.th0 * 1.2); P.setRange([0, 8], [-m, m]); P.axes({ xl: 't (s)', yl: 'θ (°)' });
    if (s.pid) P.line(Pd.ts, Pd.th.map(deg), C.warn, 2); P.line(L.ts, L.th.map(deg), C.lime, 2.5);
  };
  q.draw = (P) => {
    const m = Math.max(0.2, ...L.xs.map(Math.abs), ...(s.pid ? Pd.xs.map(Math.abs) : [0])) * 1.15; P.setRange([0, 8], [-m, m]); P.axes({ xl: 't (s)', yl: 'cart (m)' });
    if (s.pid) P.line(Pd.ts, Pd.xs, C.warn, 2); P.line(L.ts, L.xs, C.lime, 2.5);
  };
  const desc = (r) => (r.fell != null ? bad(`falls at ${r.fell.toFixed(2)} s`) : `angle within 0.5° from ${(settleIdx(r.th, rad(0.5)) * 0.005).toFixed(2)} s, cart within 1 cm from ${(settleIdx(r.xs, 0.01) * 0.005).toFixed(2)} s`);
  const redraw = () => {
    compute(); p.redraw(); q.redraw();
    read.innerHTML = `start ${s.th0}° · ${sp(C.lime, 'LQR')} K = (${K.map((v) => v.toFixed(1)).join(', ')}): ${desc(L)}${s.pid ? ` · ${sp(C.warn, 'PID')}: ${desc(Pd)}` : ''} · nonlinear lab model with 30 N limit and 20 ms lag`;
  };
  ctrls.append(slider('Starting tilt', { min: 2, max: 60, step: 1, value: s.th0, fmt: (v) => v + '°' }, (v) => { s.th0 = v; redraw(); }),
    slider('Angle weight Q_θ', { min: 0.5, max: 3, step: 0.05, value: s.lq, fmt: (v) => (10 ** v).toFixed(0) }, (v) => { s.lq = v; redraw(); }),
    toggle('Show PID', s.pid, (v) => { s.pid = v; redraw(); }, { id: 'lqr-pid' }));
  redraw();
};

// p14-l08: LQR with a prefilter against LQI on the motor
W.lqi = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { load: 0.05, plant: 'exact' };
  const KX = [0.6632, 2.0315], KI = 223.61, KL = [0.34617, 0.95065], NBAR = 1.00127;   // from the lesson's code
  const run = (useI) => {
    const L = 0.002, k = 0.05, b = 2e-5, R = s.plant === 'R' ? 1.56 : 1.2, J = s.plant === 'J' ? 4e-4 : 2e-4, dt = 2e-5;
    let i = 0, w = 0, z = 0; const ts = [], ws = [];
    for (let n = 0; n < 0.8 / dt; n++) {
      const t = n * dt, V = useI ? -(KX[0] * i + KX[1] * w) + KI * z : -(KL[0] * i + KL[1] * w) + NBAR * 200, tl = t >= 0.3 ? s.load : 0;
      i += dt * (V - R * i - k * w) / L; w += dt * (k * i - b * w - tl) / J; z += dt * (200 - w);
      if (n % 100 === 0) { ts.push(t); ws.push(w); }
    }
    return { ts, ws };
  };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 0.8], y: [180, 210], label: 'Motor speed with and without integral action' });
  p.draw = (P) => {
    const a = run(false), b = run(true), lo = Math.min(190, ...a.ws.slice(10), ...b.ws.slice(10)) - 2;
    P.setRange([0, 0.8], [Math.max(150, lo), 206]); P.axes({ xl: 't (s)', yl: 'rad/s' });
    P.line([0, 0.8], [200, 200], C.dim, 1, [3, 3]); P.line(a.ts, a.ws, C.warn, 2); P.line(b.ts, b.ws, C.lime, 2.5);
    read.innerHTML = `target 200 rad/s, ${s.load.toFixed(3)} N·m load at 0.3 s, motor ${s.plant === 'exact' ? 'as modelled' : s.plant === 'R' ? 'with R 30 % high' : 'with J doubled'} · final speed: ${sp(C.warn, `LQR + prefilter ${a.ws[a.ws.length - 1].toFixed(2)}`)}, ${sp(C.lime, `LQI ${b.ws[b.ws.length - 1].toFixed(2)}`)} rad/s`;
  };
  ctrls.append(slider('Load torque', { min: 0, max: 0.1, step: 0.005, value: s.load, fmt: (v) => v.toFixed(3) + ' N·m' }, (v) => { s.load = v; p.redraw(); }),
    select('Real motor', [['exact', 'As modelled'], ['R', 'Resistance 30 % high'], ['J', 'Inertia doubled']], s.plant, (v) => { s.plant = v; p.redraw(); }, 'lqi-plant'));
  p.redraw();
};

// p14-l09: Luenberger observer on the cart-pole
W.luenberger = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { p: 20, noise: 1 };
  const [A, B] = cartpoleAB(), K = lqrc(A, B, [[5, 0, 0, 0], [0, 1, 0, 0], [0, 0, 50, 0], [0, 0, 0, 1]], 0.05);
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 3], y: [-1.5, 1.5], label: 'True and estimated pole angular rate' });
  p.draw = (P) => {
    // the observer here uses the cart encoder alone (single output, so Ackermann's formula on the dual applies)
    const Cx = [1, 0, 0, 0], Lg = ackermann(tr(A), Cx, [-s.p, -1.1 * s.p, -1.2 * s.p, -1.3 * s.p].map((v) => [v, 0]));
    const h = 1e-3, [Ad, Bd] = zoh(A, B, h), r = rng(3), sx = 0.0005 * s.noise, sth = rad(0.1) * s.noise;
    let x = [0, 0, rad(5), 0], xh = [0, 0, 0, 0], prevTh = x[2]; const ts = [], tru = [], est = [], fd = [];
    for (let k = 0; k < 3000; k++) {
      const F = -dot(K, x), y = x[0] + sx * gauss(r), yth = x[2] + sth * gauss(r);
      const dx = vadd(vadd(mv(A, xh), B, F), Lg, y - xh[0]); xh = vadd(xh, dx, h);
      if (k % 5 === 0) { ts.push(k * h); tru.push(x[3]); est.push(xh[3]); fd.push((yth - prevTh) / h); }
      prevTh = yth; x = vadd(mv(Ad, x), Bd, F);
    }
    const all = tru.map(Math.abs), m = Math.max(0.5, ...all) * 1.4; P.setRange([0, 3], [-m, m]); P.axes({ xl: 't (s)', yl: 'θ̇ (rad/s)' });
    P.line(ts, fd.map((v) => Math.max(-m, Math.min(m, v))), C.rule2, 1); P.line(ts, tru, C.lime, 2.5); P.line(ts, est, C.warn, 2, [6, 4]);
    const e = tru.map((v, i) => v - est[i]).slice(200), rmsE = Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length);
    read.innerHTML = `${sp(C.lime, 'true θ̇')}, ${sp(C.warn, 'observer estimate')} (from the cart encoder alone; the lesson's observer also uses the pole encoder), ${sp(C.fog, 'grey: differentiated pole encoder')} · observer poles −${s.p} … −${(1.3 * s.p).toFixed(0)} · estimate RMS error after 1 s ${rmsE.toFixed(3)} rad/s · encoder noise ${(sx * 1000).toFixed(2)} mm, ${deg(sth).toFixed(2)}°`;
  };
  ctrls.append(slider('Observer speed', { min: 3, max: 40, step: 1, value: s.p, fmt: (v) => v + ' rad/s' }, (v) => { s.p = v; p.redraw(); }),
    slider('Encoder noise', { min: 0, max: 5, step: 0.25, value: s.noise, fmt: (v) => '×' + v.toFixed(2) }, (v) => { s.noise = v; p.redraw(); }));
  p.redraw();
};

// p14-l10: separation principle, eigenvalues of the combined loop
W.separation = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lq: Math.log10(50), p: 6 };
  const [A, B] = cartpoleAB(), Cx = [1, 0, 0, 0];
  const p = new Plot(body, { aspect: 0.7, maxH: 360, x: [-12, 1], y: [-5, 5], label: 'Closed-loop eigenvalues of observer-based control' });
  p.draw = (P) => {
    const K = lqrc(A, B, [[5, 0, 0, 0], [0, 1, 0, 0], [0, 0, 10 ** s.lq, 0], [0, 0, 0, 1]], 0.05);
    const op = [-s.p, -1.1 * s.p, -1.2 * s.p, -1.3 * s.p], Lg = ackermann(tr(A), Cx, op.map((v) => [v, 0]));
    const ABK = A.map((r, i) => r.map((v, j) => v - B[i] * K[j])), ALC = A.map((r, i) => r.map((v, j) => v - Lg[i] * Cx[j]));
    const big = zeros(8, 8); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { big[i][j] = A[i][j]; big[i][j + 4] = -B[i] * K[j]; big[i + 4][j] = Lg[i] * Cx[j]; big[i + 4][j + 4] = ABK[i][j] - Lg[i] * Cx[j]; }
    const ec = eig(ABK), eo = eig(ALC), eb = eig(big);
    const xm = Math.min(-2, ...eb.map((z) => z[0])) * 1.15, ym = Math.max(2, ...eb.map((z) => Math.abs(z[1]))) * 1.3;
    P.setRange([xm, 1], [-ym, ym]); P.axes({ xl: 'Re s', yl: 'Im s' });
    eb.forEach((z) => P.dot(z[0], z[1], C.bone, 3));
    ec.forEach((z) => P.handle(z[0], z[1], C.lime)); eo.forEach((z) => P.handle(z[0], z[1], C.signal));
    const d = Math.max(...ec.concat(eo).map((w) => Math.min(...eb.map((z) => Math.hypot(z[0] - w[0], z[1] - w[1])))));
    read.innerHTML = `${sp(C.lime, 'controller poles eig(A − BK)')}: ${ec.map(fmtz).join(', ')} · ${sp(C.signal, 'observer poles eig(A − LC)')}: ${eo.map(fmtz).join(', ')} · white dots: eigenvalues of the full 8-state loop, within ${d.toExponential(1)} of the union`;
  };
  ctrls.append(slider('Controller angle weight Q_θ', { min: 0.5, max: 3, step: 0.05, value: s.lq, fmt: (v) => (10 ** v).toFixed(0) }, (v) => { s.lq = v; p.redraw(); }),
    slider('Observer speed', { min: 1, max: 12, step: 0.5, value: s.p, fmt: (v) => v.toFixed(1) + ' rad/s' }, (v) => { s.p = v; p.redraw(); }));
  p.redraw();
};

// p14-l11: discrete LQR against emulation
W.dlqr = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { T: 50 }; const [A, B] = cartpoleAB(), Q = [[5, 0, 0, 0], [0, 1, 0, 0], [0, 0, 50, 0], [0, 0, 0, 1]];
  const Kc = lqrc(A, B, Q, 0.05, 0.001);
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 4], y: [-8, 8], label: 'Pole angle after a tilt: continuous, discrete and emulated designs' });
  p.draw = (P) => {
    const T = s.T / 1000, [Ad, Bd] = zoh(A, B, T), Kd = dlqr(Ad, Bd, msc(Q, T), 0.05 * T).K;
    const fine = expm(msc(A.map((r, i) => r.map((v, j) => v - B[i] * Kc[j])), 0.005)); let xc = [0, 0, 0.1, 0]; const tc = [], yc = [];
    for (let k = 0; k <= 800; k++) { tc.push(k * 0.005); yc.push(deg(xc[2])); xc = mv(fine, xc); }
    const stair = (K) => { let x = [0, 0, 0.1, 0]; const ts = [], ys = []; const n = Math.ceil(4 / T); for (let k = 0; k <= n; k++) { ts.push(k * T); ys.push(deg(x[2])); x = vadd(mv(Ad, x), Bd, -dot(K, x)); } return { ts, ys }; };
    const d = stair(Kd), e = stair(Kc);
    P.axes({ xl: 't (s)', yl: 'θ (°)' });
    P.line(tc, yc, C.fog, 2, [5, 4]); P.line(e.ts, e.ys.map((v) => Math.max(-50, Math.min(50, v))), C.bad, 2); P.line(d.ts, d.ys, C.lime, 2.5);
    d.ts.forEach((t, i) => P.dot(t, d.ys[i], C.lime, 2.5));
    const rho = (K) => Math.max(...eig(Ad.map((r, i) => r.map((v, j) => v - Bd[i] * K[j]))).map((z) => Math.hypot(z[0], z[1])));
    const rd = rho(Kd), re = rho(Kc);
    read.innerHTML = `T = ${s.T} ms · ${sp(C.fog, 'continuous LQR')} dashed · ${sp(C.lime, 'discrete LQR')} K = (${Kd.map((v) => v.toFixed(2)).join(', ')}), spectral radius ${rd.toFixed(3)} · ${sp(C.bad, 'continuous gain emulated')}: spectral radius ${re.toFixed(3)} ${re < 1 ? ok('stable') : bad('unstable')}`;
  };
  ctrls.append(slider('Sample time T', { min: 5, max: 200, step: 5, value: s.T, fmt: (v) => v + ' ms' }, (v) => { s.T = v; p.redraw(); }));
  p.redraw();
};

// p14-l12: Kalman filter covariance ellipse, predict and update
W.kfellipse = (el) => {
  const { body, read, ctrls } = frame(el);
  const dt = 0.5, q = 0.5, Fm = [[1, dt], [0, 1]], Qm = [[q * dt ** 3 / 3, q * dt ** 2 / 2], [q * dt ** 2 / 2, q * dt]];
  const s = { R: 1, P: [[4, 0], [0, 1]], prev: null, x: [0, 1], last: 'start', K: null, n: 0 };
  const r = rng(11);
  const p = new Plot(body, { aspect: 0.8, maxH: 360, x: [-6, 6], y: [-4, 4], equal: true, label: 'Two-sigma covariance ellipse in position and velocity' });
  p.draw = (P) => {
    P.axes({ xl: 'position error (m)', yl: 'velocity error (m/s)' });
    if (s.prev) lineXY(P, ellipse(s.prev, [0, 0]), C.fog, 1.5, [5, 4]);
    lineXY(P, ellipse(s.P, [0, 0]), s.last === 'update' ? C.lime : C.warn, 2.5);
    const sd = [Math.sqrt(s.P[0][0]), Math.sqrt(s.P[1][1])];
    read.innerHTML = `step ${s.n}: ${s.last} · σ_position ${sd[0].toFixed(3)} m, σ_velocity ${sd[1].toFixed(3)} m/s, correlation ${(s.P[0][1] / (sd[0] * sd[1])).toFixed(2)}${s.K ? ` · last gain K = (${s.K.map((v) => v.toFixed(3)).join(', ')})` : ''} · R = ${s.R} m²`;
  };
  const predict = () => { s.prev = s.P; s.P = madd(mm(Fm, mm(s.P, tr(Fm))), Qm); s.last = 'predict (P grows and shears)'; s.n++; p.redraw(); };
  const update = () => {
    s.prev = s.P; const S = s.P[0][0] + s.R, K = [s.P[0][0] / S, s.P[1][0] / S];
    const IKH = [[1 - K[0], 0], [-K[1], 1]], Pn = madd(mm(IKH, mm(s.P, tr(IKH))), [[K[0] * K[0] * s.R, K[0] * K[1] * s.R], [K[0] * K[1] * s.R, K[1] * K[1] * s.R]]);
    s.P = Pn; s.K = K; s.last = 'update (position fix squeezes P)'; s.n++; gauss(r); p.redraw();
  };
  const reset = () => { s.P = [[4, 0], [0, 1]]; s.prev = null; s.K = null; s.n = 0; s.last = 'start'; p.redraw(); };
  ctrls.append(row(btn('Predict', predict, 'kf-predict'), btn('Update', update, 'kf-update'), btn('Reset', reset, 'kf-reset')),
    slider('Measurement variance R', { min: 0.1, max: 4, step: 0.1, value: s.R, fmt: (v) => v.toFixed(1) + ' m²' }, (v) => { s.R = v; p.redraw(); }));
  p.redraw();
};

// p14-l13: tracking a scooter from noisy fixes
W.kftrack = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sig: 5, lq: -1 };
  const road = (t) => { const d = 8.3 * t; return [d, 60 * Math.sin(d / 200) + 10 * Math.sin(d / 80)]; };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [0, 500], y: [-80, 80], label: 'True road, noisy fixes and the Kalman track' });
  p.draw = (P) => {
    const q = 10 ** s.lq, dt = 1, r = rng(2), R = s.sig ** 2, N = 60;
    const F = [[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]], a = q * dt ** 3 / 3, b = q * dt ** 2 / 2, c = q * dt;
    const Q = [[a, 0, b, 0], [0, a, 0, b], [b, 0, c, 0], [0, b, 0, c]];
    const truth = [], z = [], est = [], covs = [];
    for (let k = 0; k < N; k++) { const t = road(k); truth.push(t); z.push([t[0] + s.sig * gauss(r), t[1] + s.sig * gauss(r)]); }
    let x = [z[0][0], z[0][1], 0, 0], Pm = [[R, 0, 0, 0], [0, R, 0, 0], [0, 0, 100, 0], [0, 0, 0, 100]];
    for (let k = 0; k < N; k++) {
      if (k) { x = mv(F, x); Pm = madd(mm(F, mm(Pm, tr(F))), Q); }
      const S = [[Pm[0][0] + R, Pm[0][1]], [Pm[1][0], Pm[1][1] + R]], Si = inv(S);
      const PHt = Pm.map((rw) => [rw[0], rw[1]]), K = mm(PHt, Si), y = [z[k][0] - x[0], z[k][1] - x[1]];
      x = vadd(x, mv(K, y)); const KH = K.map((rw) => [rw[0], rw[1], 0, 0]); Pm = mm(madd(eye(4), KH, -1), Pm);
      est.push(x.slice()); covs.push([[Pm[0][0], Pm[0][1]], [Pm[1][0], Pm[1][1]]]);
    }
    P.axes({ xl: 'east (m)', yl: 'north (m)' });
    P.line(truth.map((t) => t[0]), truth.map((t) => t[1]), C.fog, 2, [5, 4]);
    z.forEach((q2) => P.dot(q2[0], q2[1], C.warn, 2.5));
    P.line(est.map((e) => e[0]), est.map((e) => e[1]), C.lime, 2.5);
    for (let k = 5; k < N; k += 6) lineXY(P, ellipse(covs[k], est[k]), C.signal, 1.2);
    const rms = (arr) => Math.sqrt(arr.slice(5).reduce((sum, e, i) => sum + (e[0] - truth[i + 5][0]) ** 2 + (e[1] - truth[i + 5][1]) ** 2, 0) / (N - 5));
    const sp2 = Math.sqrt(est.slice(5).reduce((sum, e, i) => sum + (e[2] - 8.3) ** 2, 0) / (N - 5));
    read.innerHTML = `${sp(C.fog, 'true road')} · ${sp(C.warn, 'fixes')} (σ = ${s.sig} m, 1 per second): RMS ${rms(z).toFixed(2)} m · ${sp(C.lime, 'Kalman track')} (q = ${q.toPrecision(2)}): RMS ${rms(est).toFixed(2)} m · ${sp(C.signal, '2σ ellipses')} every 6 s · speed estimate east ≈ ${est[N - 1][2].toFixed(1)} m/s (true 8.3), RMS deviation ${sp2.toFixed(2)} m/s · illustrative road`;
  };
  ctrls.append(slider('Fix noise σ', { min: 1, max: 15, step: 0.5, value: s.sig, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.sig = v; p.redraw(); }),
    slider('Assumed q (log₁₀)', { min: -3, max: 1, step: 0.1, value: s.lq, fmt: (v) => (10 ** v).toPrecision(2) + ' m²/s³' }, (v) => { s.lq = v; p.redraw(); }));
  p.redraw();
};

// p14-l14: innovations and NIS against chi-square bounds
W.nisplot = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lq: Math.log10(2) }; const dt = 0.1, qT = 2, r = 0.09, N = 600;
  const Qof = (q) => [[q * dt ** 3 / 3, q * dt ** 2 / 2], [q * dt ** 2 / 2, q * dt]];
  const data = (() => { const g = rng(8), L = (() => { const Q = Qof(qT), a = Math.sqrt(Q[0][0]), b = Q[1][0] / a, c = Math.sqrt(Q[1][1] - b * b); return [[a, 0], [b, c]]; })(); let x = [0, 0]; const z = []; for (let k = 0; k < N; k++) { const w = [gauss(g), gauss(g)]; x = vadd([x[0] + dt * x[1], x[1]], mv(L, w)); z.push(x[0] + Math.sqrt(r) * gauss(g)); } return z; })();
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 60], y: [-2, 2], label: 'Innovations with two-sigma bounds' });
  const q = new Plot(body, { aspect: 0.4, maxH: 210, x: [0, 60], y: [0, 3], label: 'Running average NIS with its chi-square band' });
  let res;
  const compute = () => {
    const qa = 10 ** s.lq, Q = Qof(qa); let x = [data[0], 0], P = [[r, 0], [0, 10]]; const ts = [], inn = [], bd = [], avg = [], lo = [], hi = []; let sum = 0;
    for (let k = 1; k < N; k++) {
      x = [x[0] + dt * x[1], x[1]]; P = madd(mm([[1, dt], [0, 1]], mm(P, [[1, 0], [dt, 1]])), Q);
      const S = P[0][0] + r, y = data[k] - x[0], K = [P[0][0] / S, P[1][0] / S];
      x = [x[0] + K[0] * y, x[1] + K[1] * y]; P = [[(1 - K[0]) * P[0][0], (1 - K[0]) * P[0][1]], [P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]]];
      sum += y * y / S; ts.push(k * dt); inn.push(y); bd.push(2 * Math.sqrt(S)); avg.push(sum / k);
      const sd = Math.sqrt(2 / k); lo.push(Math.max(0, 1 - 1.96 * sd)); hi.push(1 + 1.96 * sd);
    }
    res = { ts, inn, bd, avg, lo, hi, qa };
  };
  p.draw = (P) => {
    const m = Math.max(1, ...res.bd, ...res.inn.map(Math.abs)) * 1.1; P.setRange([0, 60], [-m, m]); P.axes({ xl: 't (s)', yl: 'innovation (m)' });
    P.line(res.ts, res.bd, C.fog, 1.5, [4, 4]); P.line(res.ts, res.bd.map((v) => -v), C.fog, 1.5, [4, 4]); P.line(res.ts, res.inn, C.lime, 1.5);
  };
  q.draw = (P) => {
    const m = Math.max(2, Math.min(12, Math.max(...res.avg.slice(20)) * 1.15)); P.setRange([0, 60], [0, m]); P.axes({ xl: 't (s)', yl: 'average NIS' });
    P.line(res.ts, res.hi, C.fog, 1.2, [3, 3]); P.line(res.ts, res.lo, C.fog, 1.2, [3, 3]); P.line(res.ts, res.avg, C.warn, 2.5);
  };
  const redraw = () => {
    compute(); p.redraw(); q.redraw();
    const out = res.inn.filter((v, i) => Math.abs(v) > res.bd[i]).length / res.inn.length, a = res.avg[res.avg.length - 1], inB = a > res.lo[res.lo.length - 1] && a < res.hi[res.hi.length - 1];
    read.innerHTML = `true q = ${qT}, assumed ${res.qa.toPrecision(3)} m²/s³ · ${sp(C.lime, 'innovations')} outside ${sp(C.fog, '±2√S')}: ${(out * 100).toFixed(1)} % (expect 4.6 %) · ${sp(C.warn, 'average NIS')} ${a.toFixed(3)} ${inB ? ok('inside the 95 % band') : bad(a > 1 ? 'above the band: overconfident' : 'below the band: too cautious')}`;
  };
  ctrls.append(slider('Assumed q (log₁₀)', { min: -2, max: 2.5, step: 0.05, value: s.lq, fmt: (v) => (10 ** v).toPrecision(3) }, (v) => { s.lq = v; redraw(); }));
  redraw();
};

// p14-l15: EKF on a swinging pendulum
W.ekfpend = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th0: 1.2, lin: true };
  const g = 9.81, l = 0.5, c = 0.1, dt = 0.02, sig = rad(2);
  const f = (x) => rk4((q) => [q[1], -g / l * Math.sin(q[0]) - c * q[1]], x, dt);
  const jac = (x) => { const e = 1e-6, a = f([x[0] + e, x[1]]), b = f([x[0] - e, x[1]]), cc = f([x[0], x[1] + e]), d = f([x[0], x[1] - e]); return [[(a[0] - b[0]) / (2 * e), (cc[0] - d[0]) / (2 * e)], [(a[1] - b[1]) / (2 * e), (cc[1] - d[1]) / (2 * e)]]; };
  const q = 0.01, Q = [[q * dt ** 3 / 3, q * dt ** 2 / 2], [q * dt ** 2 / 2, q * dt]], R = sig * sig, F0 = jac([0, 0]);
  const p = new Plot(body, { aspect: 0.45, maxH: 240, x: [0, 6], y: [-3, 3], label: 'Pendulum angle and estimates' });
  const pr = new Plot(body, { aspect: 0.45, maxH: 240, x: [0, 6], y: [-8, 8], label: 'Angular rate and estimates' });
  let res;
  const compute = () => {
    const r = rng(4); let x = [s.th0, 0]; const ts = [], tru = [], z = [];
    for (let k = 0; k < 300; k++) { x = f(x); ts.push((k + 1) * dt); tru.push(x.slice()); z.push(x[0] + sig * gauss(r)); }
    const filt = (linear) => {
      let xh = [-0.8, 2], P = [[1, 0], [0, 4]]; const out = [];
      for (const zk of z) {
        let Fk; if (linear) { Fk = F0; xh = mv(F0, xh); } else { Fk = jac(xh); xh = f(xh); }
        P = madd(mm(Fk, mm(P, tr(Fk))), Q); const S = P[0][0] + R, K = [P[0][0] / S, P[1][0] / S], y = zk - xh[0];
        xh = [xh[0] + K[0] * y, xh[1] + K[1] * y]; P = [[(1 - K[0]) * P[0][0], (1 - K[0]) * P[0][1]], [P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]]]; out.push(xh.slice());
      }
      return out;
    };
    res = { ts, tru, z, ekf: filt(false), lin: filt(true) };
  };
  p.draw = (P) => { const m = Math.max(0.5, s.th0) * 1.3; P.setRange([0, 6], [-m, m]); P.axes({ xl: 't (s)', yl: 'θ (rad)' }); res.z.forEach((v, i) => { if (i % 2 === 0) P.dot(res.ts[i], v, C.dim, 1.6); }); P.line(res.ts, res.tru.map((x) => x[0]), C.fog, 2); if (s.lin) P.line(res.ts, res.lin.map((x) => x[0]), C.warn, 1.8); P.line(res.ts, res.ekf.map((x) => x[0]), C.lime, 2, [6, 3]); };
  pr.draw = (P) => { const m = Math.max(2, ...res.tru.map((x) => Math.abs(x[1]))) * 1.3; P.setRange([0, 6], [-m, m]); P.axes({ xl: 't (s)', yl: 'θ̇ (rad/s)' }); P.line(res.ts, res.tru.map((x) => x[1]), C.fog, 2); if (s.lin) P.line(res.ts, res.lin.map((x) => Math.max(-m, Math.min(m, x[1]))), C.warn, 1.8); P.line(res.ts, res.ekf.map((x) => x[1]), C.lime, 2, [6, 3]); };
  const redraw = () => {
    compute(); p.redraw(); pr.redraw();
    const rmsR = (e) => Math.sqrt(e.slice(100).reduce((a, x, i) => a + (x[1] - res.tru[i + 100][1]) ** 2, 0) / (e.length - 100));
    read.innerHTML = `swing from ${s.th0.toFixed(2)} rad, filters start at −0.8 rad, 2 rad/s · ${sp(C.fog, 'truth')}, dots: 2° noisy angle readings at 50 Hz · rate RMS error after 2 s: ${sp(C.lime, `EKF ${rmsR(res.ekf).toFixed(3)}`)}${s.lin ? `, ${sp(C.warn, `small-angle KF ${rmsR(res.lin).toFixed(3)}`)}` : ''} rad/s`;
  };
  ctrls.append(slider('Swing amplitude', { min: 0.2, max: 2.8, step: 0.1, value: s.th0, fmt: (v) => v.toFixed(1) + ' rad' }, (v) => { s.th0 = v; redraw(); }),
    toggle('Show small-angle KF', s.lin, (v) => { s.lin = v; redraw(); }, { id: 'ekf-lin' }));
  redraw();
};

// p14-l16: unscented transform of a range-bearing uncertainty
W.unscented = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sth: 30, sr: 0.2 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-12, 12], y: [-2, 13], equal: true, label: 'Monte Carlo cloud, sigma points and the two approximations' });
  p.draw = (P) => {
    const st = rad(s.sth), r0 = 10, b0 = Math.PI / 2, g = rng(9), pts = [];
    for (let k = 0; k < 1500; k++) { const rr = r0 + s.sr * gauss(g), bb = b0 + st * gauss(g); pts.push([rr * Math.cos(bb), rr * Math.sin(bb)]); }
    const mean = [0, 1].map((i) => pts.reduce((a, q) => a + q[i], 0) / pts.length), cov = [[0, 0], [0, 0]];
    pts.forEach((q) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cov[i][j] += (q[i] - mean[i]) * (q[j] - mean[j]) / (pts.length - 1); });
    const n = 2, lam = 1, sq = [Math.sqrt((n + lam)) * s.sr, Math.sqrt(n + lam) * st];
    const X = [[r0, b0], [r0 + sq[0], b0], [r0, b0 + sq[1]], [r0 - sq[0], b0], [r0, b0 - sq[1]]], Wt = [lam / (n + lam), ...Array(4).fill(1 / (2 * (n + lam)))];
    const Y = X.map(([rr, bb]) => [rr * Math.cos(bb), rr * Math.sin(bb)]), mu = [0, 1].map((i) => Y.reduce((a, y, k) => a + Wt[k] * y[i], 0));
    const Pu = [[0, 0], [0, 0]]; Y.forEach((y, k) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Pu[i][j] += Wt[k] * (y[i] - mu[i]) * (y[j] - mu[j]); });
    const J = [[Math.cos(b0), -r0 * Math.sin(b0)], [Math.sin(b0), r0 * Math.cos(b0)]], Pl = mm(J, mm([[s.sr ** 2, 0], [0, st * st]], tr(J))), ml = [r0 * Math.cos(b0), r0 * Math.sin(b0)];
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); pts.forEach((q) => P.dot(q[0], q[1], 'rgba(164,168,156,.45)', 1.5));
    lineXY(P, ellipse(cov, mean), C.fog, 2); lineXY(P, ellipse(Pl, ml), C.warn, 2, [6, 4]); lineXY(P, ellipse(Pu, mu), C.lime, 2.5);
    Y.forEach((y) => P.dot(y[0], y[1], C.signal, 5)); P.dot(mean[0], mean[1], C.fog, 5); P.dot(ml[0], ml[1], C.warn, 5); P.dot(mu[0], mu[1], C.lime, 5); P.dot(0, 0, C.bone, 4);
    read.innerHTML = `sensor at the origin, target at 10 m ± ${s.sr} m, bearing ± ${s.sth}° · mean y: ${sp(C.fog, `Monte Carlo ${mean[1].toFixed(2)}`)}, ${sp(C.lime, `unscented ${mu[1].toFixed(2)}`)}, ${sp(C.warn, `linearised ${ml[1].toFixed(2)}`)} m · var y: ${cov[1][1].toFixed(2)}, ${Pu[1][1].toFixed(2)}, ${Pl[1][1].toFixed(3)} m² · ${sp(C.signal, 'sigma points')} after the transform`;
  };
  ctrls.append(slider('Bearing uncertainty', { min: 2, max: 60, step: 1, value: s.sth, fmt: (v) => '±' + v + '°' }, (v) => { s.sth = v; p.redraw(); }),
    slider('Range uncertainty', { min: 0.05, max: 2, step: 0.05, value: s.sr, fmt: (v) => '±' + v.toFixed(2) + ' m' }, (v) => { s.sr = v; p.redraw(); }));
  p.redraw();
};

// p14-l17: attitude from gyro and accelerometer
W.attitude = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kp: 1, on: true }; const g = 9.81, dt = 0.005, T = 60, bias = [0.03, -0.02, 0.01];
  const truthE = (t) => [0.20 * Math.sin(0.7 * t) + 0.08 * Math.sin(2.3 * t + 0.4), 0.15 * Math.sin(0.5 * t + 1) + 0.05 * Math.sin(1.9 * t), 0.1 * t];
  const imu = (() => {
    const r = rng(12), out = [];
    for (let k = 0; k < T / dt; k++) {
      const t = k * dt, e = truthE(t), e1 = truthE(t + 1e-4), e0 = truthE(t - 1e-4), ed = e1.map((v, i) => (v - e0[i]) / 2e-4), [ph, th] = e;
      const w = [ed[0] - ed[2] * Math.sin(th), ed[1] * Math.cos(ph) + ed[2] * Math.cos(th) * Math.sin(ph), -ed[1] * Math.sin(ph) + ed[2] * Math.cos(th) * Math.cos(ph)].map((v, i) => v + bias[i] + 0.01 * gauss(r));
      const a = [-Math.sin(th), Math.cos(th) * Math.sin(ph), Math.cos(th) * Math.cos(ph)].map((v) => g * v + 0.5 * gauss(r));
      out.push({ t, e, w, a });
    }
    return out;
  })();
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const mahony = (kp, useAcc) => {
    let q = [1, 0, 0, 0], I = [0, 0, 0]; const out = [];
    for (const { w, a } of imu) {
      let wc = w.slice();
      if (useAcc) {
        const [qw, qx, qy, qz] = q, v = [2 * (qx * qz - qw * qy), 2 * (qw * qx + qy * qz), qw * qw - qx * qx - qy * qy + qz * qz], n = Math.hypot(...a), an = a.map((x) => x / n);
        const e = [an[1] * v[2] - an[2] * v[1], an[2] * v[0] - an[0] * v[2], an[0] * v[1] - an[1] * v[0]];
        I = I.map((x, i) => x + 0.1 * e[i] * dt); wc = wc.map((x, i) => x + kp * e[i] + I[i]);
      }
      const dq = qmul(q, [0, ...wc]); q = q.map((x, i) => x + 0.5 * dq[i] * dt); const qn = Math.hypot(...q); q = q.map((x) => x / qn);
      out.push(Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])));
    }
    return out;
  };
  const gyroOnly = mahony(0, false), accRoll = imu.map(({ a }) => Math.atan2(a[1], a[2]));
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 60], y: [-30, 30], label: 'Roll angle: truth, gyro only, accelerometer only and the filter' });
  p.draw = (P) => {
    const filt = s.on ? mahony(s.kp, true) : gyroOnly, ts = imu.map((d) => d.t), tru = imu.map((d) => deg(d.e[0]));
    const m = Math.max(20, ...gyroOnly.map((v) => Math.abs(deg(v)))) * 1.1; P.setRange([0, 60], [-m, m]); P.axes({ xl: 't (s)', yl: 'roll (°)' });
    const step = 4, pick = (arr) => arr.filter((_, i) => i % step === 0), tt = pick(ts);
    P.line(tt, pick(accRoll).map(deg), 'rgba(255,181,71,.35)', 1); P.line(tt, pick(gyroOnly).map(deg), C.bad, 1.8); P.line(tt, pick(tru), C.fog, 2.5); P.line(tt, pick(filt).map(deg), C.lime, 2, [6, 3]);
    const rmsE = (arr) => Math.sqrt(arr.slice(4000).reduce((a, v, i) => a + (deg(v) - tru[i + 4000]) ** 2, 0) / (arr.length - 4000));
    read.innerHTML = `${sp(C.fog, 'true roll')} · ${sp(C.warn, 'accelerometer alone')} ${rmsE(accRoll).toFixed(2)}° RMS · ${sp(C.bad, 'gyro alone')} ${rmsE(gyroOnly).toFixed(1)}° RMS (bias 0.03 rad/s) · ${sp(C.lime, s.on ? `complementary filter K_p = ${s.kp}` : 'filter off (= gyro alone)')} ${rmsE(filt).toFixed(2)}° RMS after 20 s · illustrative MEMS IMU at 200 Hz`;
  };
  ctrls.append(toggle('Accelerometer correction on', s.on, (v) => { s.on = v; p.redraw(); }, { id: 'att-on' }),
    slider('Filter gain K_p', { min: 0.05, max: 10, step: 0.05, value: s.kp, fmt: (v) => v.toFixed(2) + ' rad/s' }, (v) => { s.kp = v; p.redraw(); }));
  p.redraw();
};

// p14-l18: MPC with a sliding prediction window
W.mpcwindow = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { N: 20, umax: 1, k: 10 }; const T = 0.1, A = [[1, T], [0, 1]], Bv = [T * T / 2, T], Q = [[1, 0], [0, 0.1]], R = 0.01;
  const Pt = dlqr(A, Bv, Q, R, 1e-12).P;
  let sim = null;
  const compute = () => {
    const N = s.N, Apow = [eye(2)]; for (let i = 1; i <= N; i++) Apow.push(mm(A, Apow[i - 1]));
    const Su = zeros(2 * N, N), Sx = zeros(2 * N, 2);
    for (let k = 0; k < N; k++) { for (let j = 0; j <= k; j++) { const v = mv(Apow[k - j], Bv); Su[2 * k][j] = v[0]; Su[2 * k + 1][j] = v[1]; } Sx[2 * k] = Apow[k + 1][0].slice(); Sx[2 * k + 1] = Apow[k + 1][1].slice(); }
    const Qb = zeros(2 * N, 2 * N); for (let k = 0; k < N; k++) { const Qk = k === N - 1 ? Pt : Q; Qb[2 * k][2 * k] = Qk[0][0]; Qb[2 * k][2 * k + 1] = Qk[0][1]; Qb[2 * k + 1][2 * k] = Qk[1][0]; Qb[2 * k + 1][2 * k + 1] = Qk[1][1]; }
    const H = madd(msc(mm(tr(Su), mm(Qb, Su)), 2), msc(eye(N), 2 * R)), Fm = msc(mm(tr(Su), mm(Qb, Sx)), 2);
    let Lc = 0; { let v = new Array(N).fill(1); for (let i = 0; i < 50; i++) { const w = mv(H, v), n = Math.hypot(...w); v = w.map((x) => x / n); Lc = n; } }
    let x = [-5, 0], U = new Array(N).fill(0); const xs = [x], us = [], plans = [];
    for (let step = 0; step < 80; step++) {
      const f = mv(Fm, x); let Y = U.slice(), t = 1, Uk = U.slice();
      for (let it = 0; it < 300; it++) { const gr = vadd(mv(H, Y), f), Un = Y.map((y, i) => Math.max(-s.umax, Math.min(s.umax, y - gr[i] / Lc))); const tn = (1 + Math.sqrt(1 + 4 * t * t)) / 2; Y = Un.map((v, i) => v + (t - 1) / tn * (v - Uk[i])); Uk = Un; t = tn; }
      const pred = mv(Su, Uk).map((v, i) => v + dot(Sx[i], x)); plans.push({ U: Uk.slice(), X: Array.from({ length: N }, (_, k) => [pred[2 * k], pred[2 * k + 1]]) });
      const u = Uk[0]; us.push(u); x = vadd(mv(A, x), Bv, u); xs.push(x); U = Uk.slice(1).concat([Uk[N - 1]]);
    }
    sim = { xs, us, plans };
  };
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 8], y: [-6, 1.5], label: 'Cart position with the current prediction window' });
  const q = new Plot(body, { aspect: 0.4, maxH: 210, x: [0, 8], y: [-1.2, 1.2], label: 'Applied force and the planned force sequence' });
  p.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'position (m)' }); P.line([0, 8], [0, 0], C.dim, 1, [3, 3]);
    const k = s.k, pl = sim.plans[k], ts = sim.xs.map((_, i) => i * T);
    rect4(P, k * T, (k + s.N) * T, -6, 1.5);
    P.line(ts, sim.xs.map((x) => x[0]), C.lime, 2.5); P.line([k * T, ...pl.X.map((_, i) => (k + i + 1) * T)], [sim.xs[k][0], ...pl.X.map((x) => x[0])], C.signal, 2, [6, 4]);
    P.dot(k * T, sim.xs[k][0], C.warn, 6);
  };
  q.draw = (P) => {
    const m = s.umax * 1.3; P.setRange([0, 8], [-m, m]); P.axes({ xl: 't (s)', yl: 'force (N/kg)' });
    P.line([0, 8], [s.umax, s.umax], C.bad, 1, [3, 3]); P.line([0, 8], [-s.umax, -s.umax], C.bad, 1, [3, 3]);
    const k = s.k, pl = sim.plans[k];
    const stair = (vals, t0) => { const xs = [], ys = []; vals.forEach((v, i) => { xs.push(t0 + i * T, t0 + (i + 1) * T); ys.push(v, v); }); return [xs, ys]; };
    const [ax, ay] = stair(sim.us, 0); P.line(ax, ay, C.lime, 2.2); const [bx, by] = stair(pl.U, k * T); P.line(bx, by, C.signal, 2, [6, 4]);
  };
  function rect4(P, x0, x1, y0, y1) { P.poly([[x0, y0], [Math.min(8, x1), y0], [Math.min(8, x1), y1], [x0, y1]], 'rgba(111,211,255,.08)', null); }
  const redraw = (re = true) => {
    if (re) compute(); p.redraw(); q.redraw();
    const os = Math.max(...sim.xs.map((x) => x[0])), mu = Math.max(...sim.us.map(Math.abs));
    read.innerHTML = `step ${s.k} (t = ${(s.k * T).toFixed(1)} s): ${sp(C.signal, `plan for the next ${s.N} moves (${(s.N * T).toFixed(1)} s)`)}, only the first is applied · ${sp(C.lime, 'applied')} · max |u| ${mu.toFixed(3)} ≤ ${s.umax} · overshoot ${Math.max(0, os).toFixed(2)} m · final position ${sim.xs[sim.xs.length - 1][0].toFixed(3)} m`;
  };
  ctrls.append(slider('Time step', { min: 0, max: 79, step: 1, value: s.k, fmt: (v) => String(v) }, (v) => { s.k = v; redraw(false); }),
    select('Horizon N', [['5', '5 steps'], ['10', '10 steps'], ['20', '20 steps'], ['30', '30 steps']], String(s.N), (v) => { s.N = +v; redraw(); }, 'mpc-n'),
    slider('Force limit', { min: 0.5, max: 3, step: 0.25, value: s.umax, fmt: (v) => '±' + v.toFixed(2) }, (v) => { s.umax = v; redraw(); }));
  redraw();
};

export default W;
