// Widgets for Phase 16 (motion planning and trajectories). Sliders, selects, toggles and buttons only, plus optional drag handles.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';
import { button } from '../ui.js';

const W = {};
const D2R = Math.PI / 180;
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const setSlider = (lbl, v) => { const i = lbl.querySelector('input'); i.value = v; i.dispatchEvent(new Event('input')); };
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const wrapA = (d) => { let r = (d + Math.PI) % (2 * Math.PI); if (r < 0) r += 2 * Math.PI; return r - Math.PI; };
// filled rectangle in world coordinates
const rect = (P, x0, y0, x1, y1, color) => { const c = P.ctx, X0 = P.sx(x0), X1 = P.sx(x1), Y0 = P.sy(y0), Y1 = P.sy(y1); c.fillStyle = color; c.fillRect(Math.min(X0, X1), Math.min(Y0, Y1), Math.abs(X1 - X0) + 0.6, Math.abs(Y1 - Y0) + 0.6); };
const circ = (P, x, y, r, fill, stroke) => { const c = P.ctx, R = Math.abs(P.sx(x + r) - P.sx(x)); c.beginPath(); c.arc(P.sx(x), P.sy(y), R, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } };

// ---- the arm lab arm and the obstacles of lessons 01 and 09 ----
const ARM = [1.0, 0.8];
const AOBS = [[1.1, 0.9, 0.25], [-0.9, 0.8, 0.3], [0.2, -1.2, 0.3]];
function segPt(ax, ay, bx, by, px, py) { const dx = bx - ax, dy = by - ay, u = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(ax + u * dx - px, ay + u * dy - py); }
function armPts(q1, q2) { const ex = ARM[0] * Math.cos(q1), ey = ARM[0] * Math.sin(q1); return [[0, 0], [ex, ey], [ex + ARM[1] * Math.cos(q1 + q2), ey + ARM[1] * Math.sin(q1 + q2)]]; }
function armClear(q1, q2) { const p = armPts(q1, q2); let best = Infinity; for (let s = 0; s < 2; s++) for (const [cx, cy, r] of AOBS) best = Math.min(best, segPt(p[s][0], p[s][1], p[s + 1][0], p[s + 1][1], cx, cy) - r); return best; }
const CN = 90; // 4 degree C-space cells for drawing
let CGRID = null;
function cgrid() { if (CGRID) return CGRID; CGRID = new Float32Array(CN * CN); for (let i = 0; i < CN; i++) for (let j = 0; j < CN; j++) CGRID[i * CN + j] = armClear(-Math.PI + 2 * Math.PI * (i + 0.5) / CN, -Math.PI + 2 * Math.PI * (j + 0.5) / CN); return CGRID; }
function drawCspace(P, margin = 0) {
  const G = cgrid(), d = 360 / CN;
  for (let i = 0; i < CN; i++) for (let j = 0; j < CN; j++) { const c = G[i * CN + j]; if (c < margin) rect(P, -180 + i * d, -180 + j * d, -180 + (i + 1) * d, -180 + (j + 1) * d, c < 0 ? 'rgba(255,107,91,.55)' : 'rgba(255,181,71,.35)'); }
}
function drawArmWs(P, q1, q2, color) {
  for (const [cx, cy, r] of AOBS) circ(P, cx, cy, r, 'rgba(255,107,91,.25)', C.bad);
  const p = armPts(q1, q2); P.line(p.map((v) => v[0]), p.map((v) => v[1]), color, 5); P.dot(0, 0, C.fog, 6); P.dot(p[1][0], p[1][1], C.bone, 4); P.dot(p[2][0], p[2][1], color, 4);
}
// breadth-first search on the drawing grid with wrap-around, cells blocked below `margin`
function cBfs(s, g, margin) {
  const G = cgrid(), prev = new Int32Array(CN * CN).fill(-2), Q = [s]; prev[s] = -1;
  for (let h0 = 0; h0 < Q.length; h0++) { const c = Q[h0]; if (c === g) break; const i = Math.floor(c / CN), j = c % CN;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const n = ((i + di + CN) % CN) * CN + ((j + dj + CN) % CN); if (prev[n] === -2 && G[n] >= margin) { prev[n] = c; Q.push(n); } } }
  if (prev[g] === -2) return null; const path = [g]; while (prev[path[path.length - 1]] >= 0) path.push(prev[path[path.length - 1]]); return path.reverse();
}
const cellOf = (d1, d2) => (Math.floor((d1 + 180) / 4) % CN) * CN + (Math.floor((d2 + 180) / 4) % CN);
const cellDeg = (c) => [-180 + (Math.floor(c / CN) + 0.5) * 4, -180 + (c % CN + 0.5) * 4];

// ---- p16-l01: workspace and C-space side by side ----
W.cspace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q1: 0, q2: 30, path: false, along: 0 };
  const wrap = h('div', { class: 'two-up', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px' }); body.append(wrap);
  const a = h('div'), b = h('div'); wrap.append(a, b);
  const p = new Plot(a, { aspect: 0.95, maxH: 360, x: [-2, 2], y: [-1.9, 2], equal: true, label: 'The arm and the obstacles in the workspace' });
  const q = new Plot(b, { aspect: 0.95, maxH: 360, x: [-180, 180], y: [-180, 180], equal: true, label: 'The same arm as a point in configuration space' });
  let path = null;
  const getPath = () => path || (path = cBfs(cellOf(0, 30), cellOf(120, -30), 0.05));
  p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); const c = armClear(s.q1 * D2R, s.q2 * D2R); drawArmWs(P, s.q1 * D2R, s.q2 * D2R, c < 0 ? C.bad : C.lime); };
  q.draw = (P) => {
    P.axes({ xl: 'q1 (°)', yl: 'q2 (°)' }); drawCspace(P, s.path ? 0.05 : 0);
    if (s.path) { const pp = getPath(); if (pp) { const pts = pp.map(cellDeg); for (let k = 1; k < pts.length; k++) if (Math.abs(pts[k][0] - pts[k - 1][0]) < 90 && Math.abs(pts[k][1] - pts[k - 1][1]) < 90) P.line([pts[k - 1][0], pts[k][0]], [pts[k - 1][1], pts[k][1]], C.signal, 2.5); }
      P.dot(0, 30, C.bone, 5); P.dot(120, -30, C.warn, 5); }
    const c = armClear(s.q1 * D2R, s.q2 * D2R); P.dot(s.q1, s.q2, c < 0 ? C.bad : C.lime, 6);
  };
  const redraw = () => {
    p.redraw(); q.redraw(); const c = armClear(s.q1 * D2R, s.q2 * D2R);
    read.innerHTML = `q = (${s.q1}°, ${s.q2}°) · clearance ${c < 0 ? bad((c * 100).toFixed(1) + ' cm: collision') : ok((c * 100).toFixed(1) + ' cm')} · ${s.path ? `${sp(C.signal, 'breadth-first path')} on a 4° grid from (0°, 30°) to ${sp(C.warn, '(120°, −30°)')}, cells under the 5 cm margin in amber` : 'red cells: joint angles where the arm hits an obstacle'}`;
  };
  const s1 = slider('Shoulder q1', { min: -180, max: 180, step: 1, value: s.q1, fmt: (v) => v + '°' }, (v) => { s.q1 = v; redraw(); });
  const s2 = slider('Elbow q2', { min: -180, max: 180, step: 1, value: s.q2, fmt: (v) => v + '°' }, (v) => { s.q2 = v; redraw(); });
  const sa = slider('Along the path', { min: 0, max: 100, step: 1, value: 0, fmt: (v) => v + ' %' }, (v) => {
    const pp = getPath(); if (!pp) return; s.path = true; tg.set(true); const c = cellDeg(pp[Math.round(v / 100 * (pp.length - 1))]);
    s.q1 = Math.round(c[0]); s.q2 = Math.round(c[1]); s1.querySelector('input').value = s.q1; s1.querySelector('output').textContent = s.q1 + '°'; s2.querySelector('input').value = s.q2; s2.querySelector('output').textContent = s.q2 + '°'; redraw(); });
  const tg = toggle('Show a planned path', s.path, (v) => { s.path = v; redraw(); }, { id: 'cs-path' });
  ctrls.append(s1, s2, sa, tg);
  redraw();
};

// ---- p16-l02: cubic and quintic trajectories ----
function solveLin(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / r[i]); }
const polyD = (c, t, d) => { let s = 0; for (let k = d; k < c.length; k++) { let f = 1; for (let m = 0; m < d; m++) f *= k - m; s += c[k] * f * t ** (k - d); } return s; };
W.polytraj = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kind: 'cubic', D: 1, T: 2, v0: 0, vf: 0 };
  const mk = (lbl, yl) => new Plot(body, { aspect: 0.3, maxH: 160, x: [0, 2], y: yl, label: lbl });
  const ps = [mk('Position', [-0.2, 1.2]), mk('Velocity', [-1, 1]), mk('Acceleration', [-2, 2])];
  const coef = () => { const T = s.T; if (s.kind === 'cubic') return solveLin([[1, 0, 0, 0], [0, 1, 0, 0], [1, T, T * T, T ** 3], [0, 1, 2 * T, 3 * T * T]], [0, s.v0, s.D, s.vf]);
    return solveLin([[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0], [1, T, T * T, T ** 3, T ** 4, T ** 5], [0, 1, 2 * T, 3 * T * T, 4 * T ** 3, 5 * T ** 4], [0, 0, 2, 6 * T, 12 * T * T, 20 * T ** 3]], [0, s.v0, 0, s.D, s.vf, 0]); };
  const redraw = () => {
    const c = coef(), n = 300, ts = [], ys = [[], [], []];
    for (let i = 0; i <= n; i++) { const t = s.T * i / n; ts.push(t); for (let d = 0; d < 3; d++) ys[d].push(polyD(c, t, d)); }
    const pk = ys.map((y) => Math.max(...y.map(Math.abs)));
    const names = ['q (rad)', 'q̇ (rad/s)', 'q̈ (rad/s²)'], cols = [C.lime, C.signal, C.warn];
    ps.forEach((P, d) => { const m = Math.max(pk[d], d ? 0.2 : Math.max(s.D, 0.2)) * 1.2; P.setRange([0, s.T], d ? [-m, m] : [Math.min(0, ...ys[0]) - 0.1 * m, m]); P.draw = (Q) => { Q.axes({ xl: d === 2 ? 't (s)' : '', yl: names[d] }); Q.line(ts, ys[d], cols[d], 2.2); }; P.redraw(); });
    const a0 = ys[2][0];
    read.innerHTML = `${s.kind}: coefficients ${c.map((v) => (Math.abs(v) < 5e-13 ? 0 : v).toFixed(3)).join(', ')} · peak velocity ${pk[1].toFixed(3)} rad/s · peak acceleration ${pk[2].toFixed(3)} rad/s² · acceleration at t = 0: ${Math.abs(a0) < 1e-9 ? ok('0') : sp(C.warn, a0.toFixed(3) + ' rad/s², a jump from rest')}`;
  };
  ctrls.append(select('Polynomial', [['cubic', 'cubic (4 conditions)'], ['quintic', 'quintic (6 conditions)']], s.kind, (v) => { s.kind = v; redraw(); }, 'poly-kind'),
    slider('Distance D', { min: 0.2, max: 2, step: 0.05, value: s.D, fmt: (v) => v.toFixed(2) + ' rad' }, (v) => { s.D = v; redraw(); }),
    slider('Duration T', { min: 0.5, max: 4, step: 0.1, value: s.T, fmt: (v) => v.toFixed(1) + ' s' }, (v) => { s.T = v; redraw(); }),
    slider('Start velocity', { min: -1, max: 1, step: 0.05, value: s.v0, fmt: (v) => v.toFixed(2) + ' rad/s' }, (v) => { s.v0 = v; redraw(); }),
    slider('End velocity', { min: -1, max: 1, step: 0.05, value: s.vf, fmt: (v) => v.toFixed(2) + ' rad/s' }, (v) => { s.vf = v; redraw(); }));
  redraw();
};

// ---- p16-l03: trapezoidal velocity profile ----
function trap(D, v, a) { if (D >= v * v / a) { const ta = v / a; return { ta, tc: (D - v * v / a) / v, vp: v, T: 2 * ta + (D - v * v / a) / v }; } const vp = Math.sqrt(a * D); return { ta: vp / a, tc: 0, vp, T: 2 * vp / a }; }
function trapAt(D, v, a, t) { const { ta, tc, vp, T } = trap(D, v, a), A = vp / ta; t = clamp(t, 0, T); if (t < ta) return [A * t * t / 2, A * t, A]; if (t < ta + tc) return [A * ta * ta / 2 + vp * (t - ta), vp, 0]; const r = T - t; return [D - A * r * r / 2, A * r, -A]; }
W.trapprofile = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { D: 1, v: 0.5, a: 1 };
  const pv = new Plot(body, { aspect: 0.42, maxH: 220, x: [0, 3], y: [0, 1], label: 'Velocity profile with the speed limit shaded' });
  const pa = new Plot(body, { aspect: 0.3, maxH: 160, x: [0, 3], y: [-1, 1], label: 'Acceleration with the acceleration limit shaded' });
  const redraw = () => {
    const r = trap(s.D, s.v, s.a), Tm = Math.max(r.T * 1.08, 0.5), ts = [], vs = [], as = [], xs = [];
    for (let i = 0; i <= 600; i++) { const t = Tm * i / 600, o = trapAt(s.D, s.v, s.a, t); ts.push(t); xs.push(o[0]); vs.push(t <= r.T ? o[1] : 0); as.push(t < r.T ? o[2] : 0); }
    pv.setRange([0, Tm], [0, s.v * 1.35]); pa.setRange([0, Tm], [-s.a * 1.35, s.a * 1.35]);
    pv.draw = (P) => { rect(P, 0, s.v, Tm, s.v * 1.35, 'rgba(255,107,91,.16)'); P.axes({ xl: '', yl: 'v (m/s)' }); P.line([0, Tm], [s.v, s.v], C.bad, 1, [4, 4]); P.line(ts, vs, C.lime, 2.4); P.line(ts, xs.map((x) => x / s.D * s.v), C.signal, 1.4, [5, 4]); };
    pa.draw = (P) => { rect(P, 0, s.a, Tm, s.a * 1.35, 'rgba(255,107,91,.16)'); rect(P, 0, -s.a * 1.35, Tm, -s.a, 'rgba(255,107,91,.16)'); P.axes({ xl: 't (s)', yl: 'a (m/s²)' }); P.line(ts, as, C.warn, 2.2); };
    pv.redraw(); pa.redraw();
    read.innerHTML = `${r.tc > 0 ? ok('trapezoid') : sp(C.warn, 'triangle: too short to reach v_max')} · accelerate ${r.ta.toFixed(3)} s, cruise ${r.tc.toFixed(3)} s · peak ${r.vp.toFixed(3)} m/s · total ${r.T.toFixed(3)} s · v²/a = ${(s.v * s.v / s.a).toFixed(3)} m · ${sp(C.signal, 'dashed: position, scaled')}`;
  };
  ctrls.append(slider('Distance D', { min: 0.05, max: 3, step: 0.05, value: s.D, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.D = v; redraw(); }),
    slider('Speed limit', { min: 0.1, max: 2, step: 0.05, value: s.v, fmt: (v) => v.toFixed(2) + ' m/s' }, (v) => { s.v = v; redraw(); }),
    slider('Acceleration limit', { min: 0.2, max: 4, step: 0.1, value: s.a, fmt: (v) => v.toFixed(1) + ' m/s²' }, (v) => { s.a = v; redraw(); }));
  redraw();
};

// ---- p16-l04: S-curve and a flexible load ----
function scurve(D, V, A, J) {
  const ph = (v) => { const tj = Math.min(A / J, Math.sqrt(v / J)), ta = v / (J * tj) - tj; return [tj, ta, v * (2 * tj + ta) / 2]; };
  let v = V; if (2 * ph(v)[2] > D) { let lo = 0, hi = V; for (let i = 0; i < 80; i++) { v = (lo + hi) / 2; if (2 * ph(v)[2] < D) lo = v; else hi = v; } v = lo; }
  const [tj, ta, da] = ph(v), tv = (D - 2 * da) / v; return { d: [tj, ta, tj, tv, tj, ta, tj], j: [J, 0, -J, 0, -J, 0, J], vp: v };
}
W.scurve = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tj: 0.25, fn: 4, cmp: true }, D = 0.5, V = 0.6, A = 2, TM = 2.6, dt = 0.002;
  const pa = new Plot(body, { aspect: 0.32, maxH: 170, x: [0, TM], y: [-2.6, 2.6], label: 'Axis acceleration' });
  const pe = new Plot(body, { aspect: 0.42, maxH: 220, x: [0, TM], y: [-6, 6], label: 'Deflection of the flexible load' });
  const accOf = (tj) => { const n = Math.round(TM / dt), out = new Float64Array(n + 1);
    if (tj <= 0) { const ta = V / A, tc = D / V - ta; for (let i = 0; i <= n; i++) { const t = i * dt; out[i] = t < ta ? A : t < ta + tc ? 0 : t < 2 * ta + tc ? -A : 0; } return { a: out, T: 2 * ta + tc, tjr: 0 }; }
    const sc = scurve(D, V, A, A / tj); let t0 = 0, a = 0; const segs = sc.d.map((d, k) => { const r = [t0, d, a, sc.j[k]]; a += sc.j[k] * d; t0 += d; return r; });
    for (let i = 0; i <= n; i++) { const t = i * dt; let v = 0; for (const [s0, d, a0, j] of segs) if (t >= s0 && t < s0 + d) { v = a0 + j * (t - s0); break; } out[i] = v; } return { a: out, T: t0, tjr: sc.d[0] }; };
  const defl = (acc) => { const wn = 2 * Math.PI * s.fn, z = 0.02, n = acc.length, E = new Float64Array(n); let e = 0, de = 0; const f = (e, de, u) => [de, -2 * z * wn * de - wn * wn * e - u];
    for (let i = 0; i < n - 1; i++) { const u0 = acc[i], u1 = acc[i + 1], um = (u0 + u1) / 2, k1 = f(e, de, u0), k2 = f(e + dt / 2 * k1[0], de + dt / 2 * k1[1], um), k3 = f(e + dt / 2 * k2[0], de + dt / 2 * k2[1], um), k4 = f(e + dt * k3[0], de + dt * k3[1], u1);
      e += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); de += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); E[i + 1] = e * 1000; } return E; };
  const redraw = () => {
    const S = accOf(s.tj), Tr = accOf(0), Es = defl(S.a), Et = defl(Tr.a), ts = Array.from(S.a, (_, i) => i * dt);
    const resid = (E, T) => { let m = 0; for (let i = Math.ceil(T / dt); i < E.length; i++) m = Math.max(m, Math.abs(E[i])); return m; };
    const rs = resid(Es, S.T), rt = resid(Et, Tr.T), ymax = Math.max(1, ...Array.from(s.cmp ? Et : Es, Math.abs)) * 1.15;
    pe.setRange([0, TM], [-ymax, ymax]);
    pa.draw = (P) => { P.axes({ xl: '', yl: 'a (m/s²)' }); if (s.cmp) P.line(ts, Array.from(Tr.a), C.fog, 1.4, [5, 4]); P.line(ts, Array.from(S.a), C.lime, 2.2); };
    pe.draw = (P) => { P.axes({ xl: 't (s)', yl: 'load deflection (mm)' }); if (s.cmp) P.line(ts, Array.from(Et), C.fog, 1.4, [5, 4]); P.line(ts, Array.from(Es), C.signal, 2); P.line([S.T, S.T], [-ymax, ymax], C.warn, 1, [3, 3]); };
    pa.redraw(); pe.redraw();
    const per = 1 / s.fn;
    read.innerHTML = `${s.tj > 0 ? `S-curve, jerk time ${S.tjr.toFixed(3)} s (jerk ${(A / s.tj).toFixed(1)} m/s³)` : 'trapezoid (jerk time 0)'}, move ends at ${S.T.toFixed(3)} s · residual vibration ${Math.abs(S.tjr - per) < 0.006 ? ok(rs.toFixed(3) + ' mm') : sp(C.signal, rs.toFixed(3) + ' mm')}${s.cmp ? ` · ${sp(C.fog, `trapezoid ${rt.toFixed(2)} mm at ${Tr.T.toFixed(3)} s`)}` : ''} · load ${s.fn} Hz, period ${per.toFixed(3)} s · 0.5 m, 0.6 m/s, 2 m/s²`;
  };
  ctrls.append(slider('Jerk time a/j', { min: 0, max: 0.3, step: 0.01, value: s.tj, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.tj = v; redraw(); }),
    select('Load frequency', [['3', '3 Hz'], ['4', '4 Hz'], ['5', '5 Hz']], String(s.fn), (v) => { s.fn = +v; redraw(); }, 'sc-fn'),
    toggle('Compare with the trapezoid', s.cmp, (v) => { s.cmp = v; redraw(); }, { id: 'sc-cmp' }));
  redraw();
};

// ---- p16-l05: natural cubic spline through draggable waypoints ----
function natSpline(X, Y) { const n = X.length - 1, hh = []; for (let i = 0; i < n; i++) hh.push(X[i + 1] - X[i]); const M = new Array(n + 1).fill(0);
  const a = [], b = [], c = [], d = []; for (let i = 1; i < n; i++) { a.push(hh[i - 1]); b.push(2 * (hh[i - 1] + hh[i])); c.push(hh[i]); d.push(6 * ((Y[i + 1] - Y[i]) / hh[i] - (Y[i] - Y[i - 1]) / hh[i - 1])); }
  for (let i = 1; i < b.length; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1]; } // Thomas algorithm
  for (let i = b.length - 1; i >= 0; i--) M[i + 1] = (d[i] - (i < b.length - 1 ? c[i] * M[i + 2] : 0)) / b[i]; return M; }
function splineAt(X, Y, M, t, dd = 0) { let i = 0; while (i < X.length - 2 && t > X[i + 1]) i++; const hh = X[i + 1] - X[i], A = (X[i + 1] - t) / hh, B = 1 - A;
  if (dd === 0) return A * Y[i] + B * Y[i + 1] + ((A ** 3 - A) * M[i] + (B ** 3 - B) * M[i + 1]) * hh * hh / 6; return A * M[i] + B * M[i + 1]; }
W.spline = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const X = [0, 1, 2.5, 3, 4.5, 6], Y = [0, 0.6, 0.4, 0.9, 1.5, 1.2]; const s = { k: 1, poly: false };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-0.2, 6.2], y: [-1, 2.5], label: 'A natural cubic spline through six waypoints' });
  const q = new Plot(body, { aspect: 0.3, maxH: 160, x: [-0.2, 6.2], y: [-3, 3], label: 'Curvature of the spline' });
  let hs;
  const polyFit = () => { const n = X.length, A = X.map((x) => Array.from({ length: n }, (_, k) => x ** k)); return solveLin(A, Y); };
  const redraw = () => {
    const M = natSpline(X, Y), ts = [], ys = [], cs = []; for (let i = 0; i <= 400; i++) { const t = 6 * i / 400; ts.push(t); ys.push(splineAt(X, Y, M, t)); cs.push(splineAt(X, Y, M, t, 2)); }
    const pc = s.poly ? polyFit() : null, pys = pc ? ts.map((t) => polyD(pc, t, 0)) : null;
    let Es = 0, Ep = 0; for (let i = 0; i < 400; i++) { Es += cs[i] ** 2 * 0.015; if (pc) Ep += polyD(pc, ts[i], 2) ** 2 * 0.015; }
    const cm = Math.max(1, ...cs.map(Math.abs)) * 1.2; q.setRange([-0.2, 6.2], [-cm, cm]);
    p.draw = (P) => { P.axes({ xl: 't (s)', yl: 'q (rad)' }); if (pys) P.line(ts, pys, C.warn, 1.6, [5, 4]); P.line(ts, ys, C.lime, 2.4); X.forEach((x, i) => (i === s.k ? P.handle(x, Y[i], C.signal) : P.handle(x, Y[i], C.lime))); };
    q.draw = (P) => { P.axes({ xl: 't (s)', yl: "S'' (rad/s²)" }); P.line(ts, cs, C.signal, 2); X.forEach((x, i) => P.dot(x, M[i], C.bone, 3.5)); };
    p.redraw(); q.redraw();
    read.innerHTML = `M (curvature at the knots) = ${M.map((m) => m.toFixed(2)).join(', ')}: ${ok('zero at both ends')} · curvature continuous and piecewise linear · bending energy ∫S''² ≈ ${Es.toFixed(2)}${pc ? ` · ${sp(C.warn, `degree-5 polynomial ≈ ${Ep.toFixed(1)}`)}` : ''}`;
  };
  p.handles(() => X.map((x, i) => [x, Y[i]]), (i, x, y) => { s.k = i; ksel.querySelector('select').value = String(i); Y[i] = Math.round(clamp(y, -0.8, 2.3) * 100) / 100; hs.querySelector('input').value = Y[i]; hs.querySelector('output').textContent = Y[i].toFixed(2) + ' rad'; redraw(); }, el);
  const ksel = select('Waypoint', X.map((x, i) => [String(i), `${i + 1} (t = ${x} s)`]), '1', (v) => { s.k = +v; hs.querySelector('input').value = Y[s.k]; hs.querySelector('output').textContent = Y[s.k].toFixed(2) + ' rad'; redraw(); }, 'sp-k');
  hs = slider('Waypoint height', { min: -0.8, max: 2.3, step: 0.01, value: Y[1], fmt: (v) => v.toFixed(2) + ' rad' }, (v) => { Y[s.k] = v; redraw(); });
  ctrls.append(ksel, hs, toggle('Compare with one polynomial', s.poly, (v) => { s.poly = v; redraw(); }, { id: 'sp-poly' }));
  redraw();
};

// ---- p16-l06 / l07: the building map, BFS, Dijkstra and A* ----
const GW = 40, GH = 30;
function buildMap() { const g = new Uint8Array(GW * GH), set = (r0, r1, c0, c1, v = 1) => { for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) g[r * GW + c] = v; };
  set(5, 25, 12, 13); set(14, 16, 12, 13, 0); set(0, 20, 24, 25); set(22, 23, 18, 36); set(22, 23, 30, 32, 0); set(8, 12, 30, 38); return g; }
const MAP = buildMap(), GS = 2 * GW + 2, GT = 27 * GW + 37;
function gridSearch(algo, w = 1) {
  // algo: 'bfs' (4-connected steps), 'dij' (8-connected), 'astar' (octile heuristic times w)
  const n = GW * GH, cost = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n), order = [];
  const hfun = (c) => { if (algo !== 'astar') return 0; const dr = Math.abs(Math.floor(c / GW) - 27), dc = Math.abs((c % GW) - 37); return w * (Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc)); };
  const nb = algo === 'bfs' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const lt = (a, b) => a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2]))); // ties broken like Python's tuples (f, g, cell)
  const heap = []; const push = (f, c, g = 0) => { heap.push([f, g, c]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!lt(heap[i], heap[p])) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && lt(heap[l], heap[m])) m = l; if (r < heap.length && lt(heap[r], heap[m])) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  cost[GS] = 0; push(hfun(GS), GS); let seq = 0;
  while (heap.length) { const c = pop()[2]; if (done[c]) continue; done[c] = 1; order.push(c); if (c === GT) break; const r = Math.floor(c / GW), k = c % GW;
    for (const [dr, dk] of nb) { const rr = r + dr, kk = k + dk; if (rr < 0 || rr >= GH || kk < 0 || kk >= GW || MAP[rr * GW + kk]) continue; if (dr && dk && (MAP[(r + dr) * GW + k] || MAP[r * GW + k + dk])) continue;
      const m = rr * GW + kk, st = dr && dk ? Math.SQRT2 : 1; if (cost[c] + st < cost[m] - (algo === 'astar' ? 1e-12 : 0)) { cost[m] = cost[c] + st; prev[m] = c; push(algo === 'bfs' ? ++seq : cost[m] + hfun(m), m, algo === 'bfs' ? 0 : cost[m]); } } }
  return { cost, prev, order };
}
function drawGrid(P, res, upto, maxc) {
  const done = new Set(res.order.slice(0, upto));
  for (let c = 0; c < GW * GH; c++) { const r = Math.floor(c / GW), k = c % GW;
    if (MAP[c]) rect(P, k, r, k + 1, r + 1, C.fog);
    else if (done.has(c)) { const f = Math.min(1, res.cost[c] / maxc); rect(P, k, r, k + 1, r + 1, `hsla(${200 - 150 * f},85%,${55 - 15 * f}%,.55)`); } }
  if (done.has(GT)) { const pts = []; for (let c = GT; c >= 0; c = res.prev[c]) pts.push([(c % GW) + 0.5, Math.floor(c / GW) + 0.5]); P.line(pts.map((p) => p[0]), pts.map((p) => p[1]), C.lime, 3); }
  P.dot(2.5, 2.5, C.bone, 6); P.dot(37.5, 27.5, C.warn, 6);
}
const gridPlot = (body, label) => new Plot(body, { aspect: 0.78, maxH: 420, x: [0, GW], y: [GH, 0], label });
W.wavefront = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { algo: 'bfs', n: 400 }; let res = gridSearch('bfs'), sl;
  const p = gridPlot(body, 'A search spreading over an occupancy grid');
  const redraw = () => {
    const upto = Math.min(s.n, res.order.length), maxc = Math.max(...res.order.map((c) => res.cost[c]));
    p.draw = (P) => drawGrid(P, res, upto, maxc); p.redraw();
    const reached = res.order.slice(0, upto).includes(GT);
    read.innerHTML = `${s.algo === 'bfs' ? 'breadth-first search, 4-connected' : 'Dijkstra, 8-connected (diagonals √2)'} · ${upto} of ${res.order.length} cells expanded · colour: cost from the start · ${reached ? ok(`goal reached, cost ${res.cost[GT].toFixed(s.algo === 'bfs' ? 0 : 2)}`) : 'goal not reached yet'}`;
  };
  ctrls.append(select('Algorithm', [['bfs', 'BFS (4-connected)'], ['dij', 'Dijkstra (8-connected)']], s.algo, (v) => { s.algo = v; res = gridSearch(v); const i = sl.querySelector('input'); i.max = res.order.length; redraw(); }, 'wf-algo'),
    (sl = slider('Cells expanded', { min: 0, max: res.order.length, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; redraw(); })));
  redraw();
};
W.astar = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { algo: 'astar' };
  const p = gridPlot(body, 'Cells expanded by Dijkstra, A* and weighted A*');
  const runs = { dij: gridSearch('dij'), astar: gridSearch('astar', 1), w2: gridSearch('astar', 2), w3: gridSearch('astar', 3) };
  const redraw = () => {
    const res = runs[s.algo], maxc = Math.max(...res.order.map((c) => res.cost[c]));
    p.draw = (P) => drawGrid(P, res, res.order.length, maxc); p.redraw();
    const opt = runs.dij.cost[GT], c = res.cost[GT];
    read.innerHTML = `${{ dij: 'Dijkstra (h = 0)', astar: 'A* with the octile heuristic', w2: 'weighted A*, w = 2', w3: 'weighted A*, w = 3' }[s.algo]} · ${res.order.length} cells expanded (Dijkstra: ${runs.dij.order.length}) · path cost ${c.toFixed(3)} ${Math.abs(c - opt) < 1e-9 ? ok('optimal') : sp(C.warn, `${((c / opt - 1) * 100).toFixed(1)} % above optimal`)}`;
  };
  ctrls.append(select('Search', [['dij', 'Dijkstra'], ['astar', 'A* (octile)'], ['w2', 'weighted A*, w = 2'], ['w3', 'weighted A*, w = 3']], s.algo, (v) => { s.algo = v; redraw(); }, 'as-algo'));
  redraw();
};

// ---- p16-l08: potential fields ----
const OPEN = [[3, 2.5, 0.6], [6, 4, 0.8], [8, 1.5, 0.5]];
const UTRAP = [...[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((y) => [5, y, 0.35]), [4, 1, 0.35], [3, 1, 0.35], [4, 5, 0.35], [3, 5, 0.35]];
W.potfield = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { map: 'open', kr: 2, r0: 1 };
  const p = new Plot(body, { aspect: 0.72, maxH: 400, x: [-0.5, 10.5], y: [-1, 7], equal: true, label: 'A robot descending an attractive and repulsive potential' });
  const grad = (x, y, goal, obs) => { let gx = x - goal[0], gy = y - goal[1]; for (const [cx, cy, r] of obs) { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), rho = d - r; if (rho < s.r0) { const k = -s.kr * (1 / Math.max(rho, 1e-3) - 1 / s.r0) / Math.max(rho, 1e-3) ** 2 / d; gx += k * dx; gy += k * dy; } } return [gx, gy]; };
  const redraw = () => {
    const obs = s.map === 'open' ? OPEN : UTRAP, start = s.map === 'open' ? [0, 0] : [1, 3], goal = s.map === 'open' ? [10, 6] : [8, 3];
    let q = start.slice(); const path = [q.slice()]; let why = 'gave up';
    for (let it = 0; it < 4000; it++) { if (Math.hypot(q[0] - goal[0], q[1] - goal[1]) < 0.05) { why = 'goal'; break; } const g = grad(q[0], q[1], goal, obs), n = Math.hypot(...g); if (n < 1e-3) { why = 'min'; break; }
      const st = 0.02 / Math.max(n, 1); q = [q[0] - st * g[0], q[1] - st * g[1]]; path.push(q.slice()); if (path.length > 200) { const o = path[path.length - 200]; if (Math.hypot(q[0] - o[0], q[1] - o[1]) < 0.2) { why = 'min'; break; } } }
    p.draw = (P) => {
      P.axes({ xl: 'x (m)', yl: 'y (m)' });
      for (let x = 0; x <= 10; x += 0.5) for (let y = -0.5; y <= 6.5; y += 0.5) { if (obs.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r + 0.05)) continue; const g = grad(x, y, goal, obs), n = Math.hypot(...g); if (n < 1e-9) continue; P.arrow(x, y, x - 0.3 * g[0] / n, y - 0.3 * g[1] / n, 'rgba(164,168,156,.55)', 1.2); }
      for (const [cx, cy, r] of obs) { circ(P, cx, cy, r + s.r0, null, 'rgba(255,107,91,.25)'); circ(P, cx, cy, r, 'rgba(255,107,91,.35)', C.bad); }
      P.line(path.map((v) => v[0]), path.map((v) => v[1]), why === 'goal' ? C.lime : C.warn, 2.6); P.dot(start[0], start[1], C.bone, 6); P.dot(goal[0], goal[1], C.signal, 7);
      if (why !== 'goal') P.dot(q[0], q[1], C.bad, 6);
    };
    p.redraw();
    const L = path.reduce((a, v, i) => (i ? a + Math.hypot(v[0] - path[i - 1][0], v[1] - path[i - 1][1]) : 0), 0);
    read.innerHTML = `${why === 'goal' ? ok(`reached the goal after ${path.length} steps, path ${L.toFixed(2)} m`) : bad(`stuck in a local minimum at (${q[0].toFixed(2)}, ${q[1].toFixed(2)}), ${Math.hypot(q[0] - goal[0], q[1] - goal[1]).toFixed(2)} m from the goal`)} · k_att = 1, k_rep = ${s.kr}, ρ0 = ${s.r0} m (faint rings) · arrows: direction of −∇U`;
  };
  ctrls.append(select('Map', [['open', 'open map'], ['trap', 'U-shaped trap']], s.map, (v) => { s.map = v; redraw(); }, 'pf-map'),
    slider('Repulsive gain', { min: 0.5, max: 6, step: 0.5, value: s.kr, fmt: (v) => v.toFixed(1) }, (v) => { s.kr = v; redraw(); }),
    slider('Repulsive range ρ0', { min: 0.3, max: 2, step: 0.1, value: s.r0, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.r0 = v; redraw(); }));
  redraw();
};

// ---- p16-l09: probabilistic roadmap in the arm's C-space ----
W.prm = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 150, k: 10, seed: 1, goal: 'reach' };
  const p = new Plot(body, { aspect: 0.9, maxH: 420, x: [-180, 180], y: [-180, 180], equal: true, label: 'A probabilistic roadmap in the arm configuration space' });
  const edgeFree = (a, b) => { const d1 = wrapA(b[0] - a[0]), d2 = wrapA(b[1] - a[1]), m = Math.max(1, Math.ceil(Math.max(Math.abs(d1), Math.abs(d2)) / (2 * D2R))); for (let i = 0; i <= m; i++) if (armClear(a[0] + d1 * i / m, a[1] + d2 * i / m) < 0.05) return false; return true; };
  const redraw = () => {
    const r = rng(s.seed * 7919), V = [[0, 30 * D2R], s.goal === 'reach' ? [120 * D2R, -30 * D2R] : [170 * D2R, 0]];
    while (V.length < s.n + 2) { const q = [-Math.PI + 2 * Math.PI * r(), -Math.PI + 2 * Math.PI * r()]; if (armClear(q[0], q[1]) >= 0.05) V.push(q); }
    const adj = V.map(() => []), E = []; const dist = (a, b) => Math.hypot(wrapA(a[0] - b[0]), wrapA(a[1] - b[1]));
    for (let i = 0; i < V.length; i++) { const nn = V.map((v, j) => [dist(V[i], v), j]).sort((a, b) => a[0] - b[0]).slice(1, s.k + 1);
      for (const [d, j] of nn) { if (adj[i].some((e) => e[0] === j)) continue; if (edgeFree(V[i], V[j])) { adj[i].push([j, d]); adj[j].push([i, d]); E.push([i, j]); } } }
    const cost = V.map(() => Infinity), prev = V.map(() => -1), done = V.map(() => false); cost[0] = 0;
    for (;;) { let u = -1; for (let i = 0; i < V.length; i++) if (!done[i] && cost[i] < Infinity && (u < 0 || cost[i] < cost[u])) u = i; if (u < 0) break; done[u] = true; for (const [j, w] of adj[u]) if (cost[u] + w < cost[j]) { cost[j] = cost[u] + w; prev[j] = u; } }
    const found = cost[1] < Infinity, path = []; if (found) for (let c = 1; c >= 0; c = prev[c]) path.push(V[c]);
    const segDeg = (a, b, col, w) => { const A = [a[0] / D2R, a[1] / D2R], d1 = wrapA(b[0] - a[0]) / D2R, d2 = wrapA(b[1] - a[1]) / D2R; p.line([A[0], A[0] + d1], [A[1], A[1] + d2], col, w); };
    p.draw = (P) => { P.axes({ xl: 'q1 (°)', yl: 'q2 (°)' }); drawCspace(P, 0.05); for (const [i, j] of E) segDeg(V[i], V[j], 'rgba(111,211,255,.35)', 1); for (const v of V.slice(2)) P.dot(v[0] / D2R, v[1] / D2R, C.signal, 2.2);
      for (let k = 1; k < path.length; k++) segDeg(path[k - 1], path[k], C.lime, 3); P.dot(0, 30, C.bone, 6); P.dot(V[1][0] / D2R, V[1][1] / D2R, C.warn, 6); };
    p.redraw();
    let mot = 0; for (let k = 1; k < path.length; k++) mot += dist(path[k - 1], path[k]);
    read.innerHTML = `${s.n} free samples, k = ${s.k} · ${E.length} collision-free edges · ${found ? ok(`path found: ${path.length} nodes, ${(mot / D2R).toFixed(0)}° of joint motion`) : bad('no path found with these samples')}${s.goal === 'cut' ? ' · this goal is in a pocket cut off from the start' : ''} · red and amber: blocked or inside the 5 cm margin`;
  };
  ctrls.append(slider('Samples', { min: 10, max: 400, step: 10, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; redraw(); }),
    slider('Neighbours k', { min: 3, max: 15, step: 1, value: s.k, fmt: (v) => String(v) }, (v) => { s.k = v; redraw(); }),
    select('Goal', [['reach', '(120°, −30°), reachable'], ['cut', '(170°, 0°), cut off']], s.goal, (v) => { s.goal = v; redraw(); }, 'prm-goal'),
    button('New random roadmap', () => { s.seed++; redraw(); }, 'prm-seed'));
  redraw();
};

// ---- p16-l10: RRT and RRT* in a room ----
const RECTS = [[2, -1, 3, 6.5], [5, 3.5, 6, 11], [7, 1, 9, 2.5]];
function segHitsRect(px, py, qx, qy, r) { const dx = qx - px, dy = qy - py; let t0 = 0, t1 = 1; const e = 1e-9;
  for (const [p, d, lo, hi] of [[px, dx, r[0], r[2]], [py, dy, r[1], r[3]]]) { if (Math.abs(d) < 1e-15) { if (p <= lo + e || p >= hi - e) return false; } else { const a = (lo + e - p) / d, b = (hi - e - p) / d; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); if (t0 >= t1) return false; } } return true; }
const freeSeg = (a, b) => !RECTS.some((r) => segHitsRect(a[0], a[1], b[0], b[1], r));
function rrtPlan(n, star, seed) {
  const r = rng(seed), eta = 0.5, G = [9.5, 9.5], P = [[0.5, 0.5]], par = [-1], cost = [0], kids = [[]]; let best = Infinity, bi = -1; const hist = [];
  for (let it = 1; it <= n; it++) {
    const x = r() < 0.05 ? G : [10 * r(), 10 * r()]; let i = 0, bd = Infinity; for (let k = 0; k < P.length; k++) { const d = Math.hypot(P[k][0] - x[0], P[k][1] - x[1]); if (d < bd) { bd = d; i = k; } }
    const nw = bd <= eta ? x.slice() : [P[i][0] + eta * (x[0] - P[i][0]) / bd, P[i][1] + eta * (x[1] - P[i][1]) / bd];
    if (freeSeg(P[i], nw)) {
      let pa = i, c = cost[i] + Math.hypot(nw[0] - P[i][0], nw[1] - P[i][1]), near = [];
      if (star) { const m = P.length, rad = Math.min(6 * Math.sqrt(Math.log(m + 1) / (m + 1)), 2 * eta); for (let k = 0; k < m; k++) if (Math.hypot(P[k][0] - nw[0], P[k][1] - nw[1]) <= rad) near.push(k);
        for (const k of near) { const ck = cost[k] + Math.hypot(nw[0] - P[k][0], nw[1] - P[k][1]); if (ck < c && freeSeg(P[k], nw)) { pa = k; c = ck; } } }
      const id = P.length; P.push(nw); par.push(pa); cost.push(c); kids.push([]); kids[pa].push(id);
      if (star) for (const k of near) { const ck = c + Math.hypot(P[k][0] - nw[0], P[k][1] - nw[1]); if (ck < cost[k] - 1e-12 && freeSeg(nw, P[k])) { const dl = cost[k] - ck; kids[par[k]] = kids[par[k]].filter((u) => u !== k); par[k] = id; kids[id].push(k); const st = [k]; while (st.length) { const u = st.pop(); cost[u] -= dl; st.push(...kids[u]); } } }
      const cand = star ? P.map((_, k) => k) : [id];
      for (const k of cand) { const d = Math.hypot(P[k][0] - G[0], P[k][1] - G[1]); if (d <= eta && freeSeg(P[k], G) && cost[k] + d < best) { best = cost[k] + d; bi = k; } }
    }
    if (it % 100 === 0) hist.push(best);
  }
  // with RRT* the best node can change its cost by rewiring: recompute it
  if (bi >= 0) { best = Infinity; for (let k = 0; k < P.length; k++) { const d = Math.hypot(P[k][0] - G[0], P[k][1] - G[1]); if (d <= eta && freeSeg(P[k], G) && cost[k] + d < best) { best = cost[k] + d; bi = k; } } }
  return { P, par, best, bi, hist };
}
W.rrt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 1000, star: true, seed: 0 };
  const p = new Plot(body, { aspect: 0.9, maxH: 420, x: [0, 10], y: [0, 10], equal: true, label: 'A random tree growing across a room' });
  const redraw = () => {
    const R = rrtPlan(s.n, s.star, s.seed * 104729 + 17);
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); for (const r of RECTS) rect(P, r[0], Math.max(0, r[1]), r[2], Math.min(10, r[3]), 'rgba(255,107,91,.45)');
      for (let k = 1; k < R.P.length; k++) P.line([R.P[R.par[k]][0], R.P[k][0]], [R.P[R.par[k]][1], R.P[k][1]], 'rgba(111,211,255,.45)', 1);
      if (R.bi >= 0) { const pts = [[9.5, 9.5]]; for (let k = R.bi; k >= 0; k = R.par[k]) pts.push(R.P[k]); P.line(pts.map((v) => v[0]), pts.map((v) => v[1]), C.lime, 3); }
      P.dot(0.5, 0.5, C.bone, 6); P.dot(9.5, 9.5, C.warn, 6); };
    p.redraw();
    read.innerHTML = `${s.star ? 'RRT*' : 'RRT'}, ${s.n} samples, ${R.P.length} nodes · ${R.bi >= 0 ? `path cost ${ok(R.best.toFixed(3) + ' m')}, ${((R.best / 18.736 - 1) * 100).toFixed(1)} % above the optimum 18.736 m (visibility graph)` : bad('no path yet')} · step 0.5 m, 5 % goal bias`;
  };
  ctrls.append(slider('Samples', { min: 100, max: 3000, step: 100, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; redraw(); }),
    toggle('RRT* (choose parent and rewire)', s.star, (v) => { s.star = v; redraw(); }, { id: 'rrt-star' }),
    button('New random tree', () => { s.seed++; redraw(); }, 'rrt-seed'));
  redraw();
};

// ---- p16-l11: separating axis theorem ----
W.sat = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { x: 1.42, y: 1.38, th: 45, axis: 5 };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-1.5, 3.5], y: [-1.5, 3], equal: true, label: 'A square and a triangle with their projections on one axis' });
  const SQ = [[0, 0], [1, 0], [1, 1], [0, 1]], TRI0 = [[-0.5, -0.4], [0.6, -0.3], [-0.1, 0.6]];
  const redraw = () => {
    const c = Math.cos(s.th * D2R), sn = Math.sin(s.th * D2R), TRI = TRI0.map(([x, y]) => [s.x + c * x - sn * y, s.y + sn * x + c * y]);
    const axes = []; for (const poly of [SQ, TRI]) for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], n = Math.hypot(ex, ey); axes.push([-ey / n, ex / n]); }
    const proj = (poly, n) => { const v = poly.map((q) => q[0] * n[0] + q[1] * n[1]); return [Math.min(...v), Math.max(...v)]; };
    let sep = -1; axes.forEach((n, i) => { const A = proj(SQ, n), B = proj(TRI, n); if (sep < 0 && (A[1] < B[0] || B[1] < A[0])) sep = i; });
    const hit = sep < 0, aabb = !(Math.max(...TRI.map((q) => q[0])) < 0 || Math.min(...TRI.map((q) => q[0])) > 1 || Math.max(...TRI.map((q) => q[1])) < 0 || Math.min(...TRI.map((q) => q[1])) > 1);
    const n = axes[s.axis], A = proj(SQ, n), B = proj(TRI, n), off = [-1.2 * n[1], 1.2 * n[0]], o = [0.5 - 2.2 * n[1], 0.5 + 2.2 * n[0]];
    p.draw = (P) => { P.axes({ xl: 'x', yl: 'y' });
      P.poly(SQ, hit ? 'rgba(255,107,91,.35)' : 'rgba(198,255,26,.2)', hit ? C.bad : C.lime); P.poly(TRI, hit ? 'rgba(255,107,91,.35)' : 'rgba(111,211,255,.2)', hit ? C.bad : C.signal);
      const L = (t) => [o[0] + (t - (0.5 * n[0] + 0.5 * n[1])) * n[0], o[1] + (t - (0.5 * n[0] + 0.5 * n[1])) * n[1]];
      const a0 = L(-3), a1 = L(4); P.line([a0[0], a1[0]], [a0[1], a1[1]], C.dim, 1, [4, 4]);
      const pa = L(A[0]), pb = L(A[1]), qa = L(B[0]), qb = L(B[1]); P.line([pa[0], pb[0]], [pa[1], pb[1]], C.lime, 5); P.line([qa[0] + 0.06 * off[0], qb[0] + 0.06 * off[0]], [qa[1] + 0.06 * off[1], qb[1] + 0.06 * off[1]], C.signal, 5); };
    p.redraw();
    const gap = Math.max(B[0] - A[1], A[0] - B[1]);
    read.innerHTML = `${hit ? bad('overlap: no axis separates them, all 7 tested') : ok(`separated: axis ${sep + 1} of 7 is a separating axis`)} · bounding boxes ${aabb ? 'overlap' : 'apart'}${aabb && !hit ? ' (a broad-phase false alarm)' : ''} · shown: axis ${s.axis + 1}, normal of ${s.axis < 4 ? 'square' : 'triangle'} edge ${s.axis < 4 ? s.axis + 1 : s.axis - 3}, projections ${gap > 0 ? `apart by ${gap.toFixed(3)}` : 'overlap'}`;
  };
  ctrls.append(slider('Triangle x', { min: -1, max: 3, step: 0.02, value: s.x, fmt: (v) => v.toFixed(2) }, (v) => { s.x = v; redraw(); }),
    slider('Triangle y', { min: -1, max: 2.5, step: 0.02, value: s.y, fmt: (v) => v.toFixed(2) }, (v) => { s.y = v; redraw(); }),
    slider('Triangle angle', { min: -180, max: 180, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; redraw(); }),
    select('Axis shown', Array.from({ length: 7 }, (_, i) => [String(i), `axis ${i + 1}: ${i < 4 ? 'square' : 'triangle'} edge ${i < 4 ? i + 1 : i - 3}`]), String(s.axis), (v) => { s.axis = +v; redraw(); }, 'sat-axis'));
  redraw();
};

// ---- p16-l12: CHOMP-style trajectory optimisation ----
const CH = { N: 50, S: [0, 0], G: [10, 0], obs: [[4, 0.3, 1.0], [7, -0.6, 0.8]], eps: 0.6 };
let CH_AINV = null;
function chAinv() { if (CH_AINV) return CH_AINV; const N = CH.N, A = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) { A[i][i] = 2; if (i) A[i][i - 1] = A[i - 1][i] = -1; } // K^T K for first differences
  const M = A.map((r, i) => [...r, ...Array.from({ length: N }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < N; c++) { let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c]; for (let k = 0; k < 2 * N; k++) M[c][k] /= d; for (let r = 0; r < N; r++) if (r !== c) { const f = M[r][c]; if (f) for (let k = 0; k < 2 * N; k++) M[r][k] -= f * M[c][k]; } }
  return (CH_AINV = M.map((r) => r.slice(N))); }
function chDist(x, y) { let best = Infinity, g = [0, 0]; for (const [cx, cy, r] of CH.obs) { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d - r < best) { best = d - r; g = [dx / d, dy / d]; } } return [best, g]; }
const chC = (d) => (d < 0 ? -d + CH.eps / 2 : d < CH.eps ? (CH.eps - d) ** 2 / (2 * CH.eps) : 0), chCg = (d) => (d < 0 ? -1 : d < CH.eps ? -(CH.eps - d) / CH.eps : 0);
function chFull(X) { return [CH.S, ...X, CH.G]; }
function chCost(X, lam) { const F = chFull(X); let sm = 0; for (let i = 0; i + 1 < F.length; i++) for (let k = 0; k < 2; k++) sm += 0.5 * (F[i + 1][k] - F[i][k]) ** 2; let ob = 0; for (const p of X) ob += chC(chDist(p[0], p[1])[0]); return sm + lam * ob; }
function chOptimise(iters, lam, cov) {
  const N = CH.N, Ai = chAinv(); let X = Array.from({ length: N }, (_, i) => [10 * (i + 1) / (N + 1), 0]); const hist = [chCost(X, lam)], snaps = [X];
  for (let it = 0; it < iters; it++) {
    const W2 = chFull(X), g = X.map((p, i) => [2 * p[0] - W2[i][0] - W2[i + 2][0], 2 * p[1] - W2[i][1] - W2[i + 2][1]]);
    X.forEach((p, i) => { const [d, n] = chDist(p[0], p[1]), c = chCg(d); let gx = c * n[0], gy = c * n[1]; const tx = W2[i + 2][0] - W2[i][0], ty = W2[i + 2][1] - W2[i][1], tn = Math.hypot(tx, ty); const dot = (gx * tx + gy * ty) / (tn * tn); gx -= dot * tx; gy -= dot * ty; g[i][0] += lam * gx; g[i][1] += lam * gy; });
    const dvec = cov ? Ai.map((row) => [row.reduce((a, v, j) => a + v * g[j][0], 0), row.reduce((a, v, j) => a + v * g[j][1], 0)]) : g;
    let mx = 0; for (const v of dvec) mx = Math.max(mx, Math.abs(v[0]), Math.abs(v[1])); let st = Math.min(0.2, 0.1 / (mx || 1)), Xn; for (;;) { Xn = X.map((p, i) => [p[0] - st * dvec[i][0], p[1] - st * dvec[i][1]]); if (chCost(Xn, lam) <= hist[hist.length - 1] || st < 1e-10) break; st /= 2; }
    X = Xn; hist.push(chCost(X, lam)); snaps.push(X);
  }
  return { snaps, hist };
}
W.chomp = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { it: 30, lam: 20, cov: true }; let cache = null, key = '';
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [-0.5, 10.5], y: [-2, 3.2], equal: true, label: 'A path bent away from obstacles by trajectory optimisation' });
  const redraw = () => {
    const k = `${s.lam}|${s.cov}`; if (k !== key) { cache = chOptimise(300, s.lam, s.cov); key = k; }
    const X = cache.snaps[s.it], F = [CH.S, ...X, CH.G]; let clr = Infinity; for (const q of X) clr = Math.min(clr, chDist(q[0], q[1])[0]);
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); for (const [cx, cy, r] of CH.obs) { circ(P, cx, cy, r + CH.eps, null, 'rgba(255,107,91,.3)'); circ(P, cx, cy, r, 'rgba(255,107,91,.35)', C.bad); }
      P.line([0, 10], [0, 0], C.dim, 1, [4, 4]); P.line(F.map((q) => q[0]), F.map((q) => q[1]), clr < 0 ? C.warn : C.lime, 2.4); X.forEach((q) => P.dot(q[0], q[1], C.bone, 2.2)); };
    p.redraw(); const L = F.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - F[i - 1][0], q[1] - F[i - 1][1]) : 0), 0);
    read.innerHTML = `iteration ${s.it} · cost ${cache.hist[s.it].toFixed(3)} (start ${cache.hist[0].toFixed(1)}) · smallest waypoint clearance ${clr < 0 ? bad(clr.toFixed(3) + ' m: inside an obstacle') : ok(clr.toFixed(3) + ' m')} · length ${L.toFixed(2)} m · ${s.cov ? 'covariant update A⁻¹∇F' : 'plain gradient ∇F'} · faint rings: the 0.6 m clearance band`;
  };
  ctrls.append(slider('Iterations', { min: 0, max: 300, step: 1, value: s.it, fmt: (v) => String(v) }, (v) => { s.it = v; redraw(); }),
    slider('Obstacle weight λ', { min: 2, max: 50, step: 1, value: s.lam, fmt: (v) => String(v) }, (v) => { s.lam = v; redraw(); }),
    toggle('Covariant update', s.cov, (v) => { s.cov = v; redraw(); }, { id: 'ch-cov' }));
  redraw();
};

// ---- p16-l13: time-optimal path parameterisation in the phase plane ----
W.topp = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { v: 1, a: 2 }, M = 200, ds = 1 / M, w = 2 * Math.PI;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 1], y: [0, 1], label: 'Phase plane of path position and path speed' });
  const dq = (t) => [2, 0.4 * w * Math.cos(w * t)], ddq = (t) => [0, -0.4 * w * w * Math.sin(w * t)];
  const cons = (k) => { const t = k * ds, d1 = dq(t), d2 = ddq(t), G = []; for (let i = 0; i < 2; i++) { G.push([d2[i], d1[i], s.a], [-d2[i], -d1[i], s.a], [d1[i] ** 2, 0, s.v * s.v]); } G.push([-1, 0, 0]); return G; };
  // max or min of x over the polygon {(x, u): G [x, u] <= h}, by checking every vertex
  const lpx = (G, sign) => { let best = null; for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++) { const [a1, b1, c1] = G[i], [a2, b2, c2] = G[j], det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-12) continue;
    const x = (c1 * b2 - c2 * b1) / det, u = (a1 * c2 - a2 * c1) / det; if (G.every(([a, b, c]) => a * x + b * u <= c + 1e-9) && (best === null || sign * x > sign * best)) best = x; } return best; };
  const redraw = () => {
    const mvc = [], K = new Array(M + 1).fill(0); for (let k = 0; k <= M; k++) mvc.push(Math.max(0, lpx(cons(k), 1) ?? 0));
    for (let k = M - 1; k >= 0; k--) { const G = cons(k); G.push([1, 2 * ds, K[k + 1]]); K[k] = Math.max(0, lpx(G, 1) ?? 0); }
    const x = [0], u = []; for (let k = 0; k < M; k++) { let lo = -Infinity, hi = Infinity; for (const [a, b, c] of cons(k)) { const r = c - a * x[k]; if (Math.abs(b) < 1e-12) continue; if (b > 0) hi = Math.min(hi, r / b); else lo = Math.max(lo, r / b); } hi = Math.min(hi, (K[k + 1] - x[k]) / (2 * ds)); u.push(hi); x.push(Math.max(0, x[k] + 2 * ds * hi)); }
    let T = 0; for (let k = 0; k < M; k++) T += 2 * ds / (Math.sqrt(x[k]) + Math.sqrt(x[k + 1]) || 1e-12);
    const ss = x.map((_, k) => k * ds), top = Math.max(...mvc.map(Math.sqrt)) * 1.1; p.setRange([0, 1], [0, top]);
    p.draw = (P) => { P.axes({ xl: 's', yl: 'ṡ (1/s)' }); P.line(ss, mvc.map(Math.sqrt), C.bad, 2); P.line(ss, K.map(Math.sqrt), C.warn, 1.2, [5, 4]); P.line(ss, x.map(Math.sqrt), C.lime, 2.6); };
    p.redraw();
    read.innerHTML = `path x = 2s, y = 0.4 sin 2πs · limits ${s.v} m/s, ${s.a} m/s² per axis · ${sp(C.bad, 'maximum velocity curve')}, ${sp(C.warn, 'controllable limit (backward pass)')}, ${sp(C.lime, 'time-optimal profile')} · travel time ${ok(T.toFixed(3) + ' s')} (${M} stages)`;
  };
  ctrls.append(slider('Speed limit', { min: 0.4, max: 2, step: 0.1, value: s.v, fmt: (v) => v.toFixed(1) + ' m/s' }, (v) => { s.v = v; redraw(); }),
    slider('Acceleration limit', { min: 0.5, max: 4, step: 0.1, value: s.a, fmt: (v) => v.toFixed(1) + ' m/s²' }, (v) => { s.a = v; redraw(); }));
  redraw();
};

// ---- p16-l14: pure pursuit on a stadium track ----
const TRACK = (() => { const st = 4, R = 1.5, n = 1200, Lt = 2 * st + 2 * Math.PI * R, pts = []; for (let i = 0; i < n; i++) { const d = Lt * i / n; if (d < st) pts.push([d - st / 2, -R]); else if (d < st + Math.PI * R) { const a = -Math.PI / 2 + (d - st) / R; pts.push([st / 2 + R * Math.cos(a), R * Math.sin(a)]); } else if (d < 2 * st + Math.PI * R) pts.push([st / 2 - (d - st - Math.PI * R), R]); else { const a = Math.PI / 2 + (d - 2 * st - Math.PI * R) / R; pts.push([-st / 2 + R * Math.cos(a), R * Math.sin(a)]); } } return pts; })();
function ppRun(L, v, lag, T = 40, dt = 0.01) {
  const n = TRACK.length; let x = TRACK[0][0], y = TRACK[0][1], th = 0, w = 0, i = 0; const out = [];
  for (let k = 0; k <= T / dt; k++) {
    let bi = i, bd = Infinity; for (let m = -20; m < 120; m++) { const j = (i + m + n) % n, d = Math.hypot(TRACK[j][0] - x, TRACK[j][1] - y); if (d < bd) { bd = d; bi = j; } } i = bi;
    let j = i; while (Math.hypot(TRACK[(j + 1) % n][0] - x, TRACK[(j + 1) % n][1] - y) < L && j - i < n) j++;
    const a = TRACK[j % n], b = TRACK[(j + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - x, fy = a[1] - y, A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), Cc = fx * fx + fy * fy - L * L, t = clamp((-B + Math.sqrt(Math.max(B * B - 4 * A * Cc, 0))) / (2 * A), 0, 1), g = [a[0] + t * dx, a[1] + t * dy];
    let cte = Infinity; for (let m = -3; m <= 3; m++) { const p0 = TRACK[(i + m + n) % n], p1 = TRACK[(i + m + 1 + n) % n]; cte = Math.min(cte, segPt(p0[0], p0[1], p1[0], p1[1], x, y)); }
    out.push({ x, y, th, g, cte });
    const gx = g[0] - x, gy = g[1] - y, yl = -Math.sin(th) * gx + Math.cos(th) * gy, kap = 2 * yl / (gx * gx + gy * gy), wc = clamp(v * kap, -3, 3);
    w = lag ? w + dt / lag * (wc - w) : wc;
    if (Math.abs(w) < 1e-9) { x += v * dt * Math.cos(th); y += v * dt * Math.sin(th); } else { x += v / w * (Math.sin(th + w * dt) - Math.sin(th)); y -= v / w * (Math.cos(th + w * dt) - Math.cos(th)); } th += w * dt;
  }
  return out;
}
W.purepursuit = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { L: 0.6, v: 0.5, lag: 0, t: 30 }; let run = null, key = '';
  const p = new Plot(body, { aspect: 0.62, maxH: 360, x: [-3.8, 3.8], y: [-2.3, 2.3], equal: true, label: 'A robot following a stadium track with pure pursuit' });
  const redraw = () => {
    const k = `${s.L}|${s.v}|${s.lag}`; if (k !== key) { run = ppRun(s.L, s.v, s.lag); key = k; }
    const idx = Math.min(run.length - 1, Math.round(s.t / 0.01)), r = run[idx]; let worst = 0; for (let m = 500; m < run.length; m++) worst = Math.max(worst, run[m].cte);
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); const tr = [...TRACK, TRACK[0]]; P.line(tr.map((q) => q[0]), tr.map((q) => q[1]), C.dim, 6); P.line(tr.map((q) => q[0]), tr.map((q) => q[1]), C.fog, 1);
      const tail = run.slice(Math.max(0, idx - 1500), idx + 1); P.line(tail.map((q) => q.x), tail.map((q) => q.y), C.signal, 1.8);
      circ(P, r.x, r.y, s.L, null, 'rgba(255,181,71,.6)'); P.line([r.x, r.g[0]], [r.y, r.g[1]], C.warn, 1.2, [3, 3]); P.dot(r.g[0], r.g[1], C.warn, 5);
      const c = Math.cos(r.th), sn = Math.sin(r.th); P.poly([[0.16, 0], [-0.1, 0.1], [-0.1, -0.1]].map(([a, b]) => [r.x + a * c - b * sn, r.y + a * sn + b * c]), 'rgba(198,255,26,.5)', C.lime); };
    p.redraw();
    read.innerHTML = `t = ${s.t.toFixed(1)} s · cross-track error now ${(r.cte * 100).toFixed(1)} cm · largest after the first 5 s ${worst < 0.05 ? ok((worst * 100).toFixed(1) + ' cm') : bad((worst * 100).toFixed(1) + ' cm')} (illustrative spec 5 cm) · lookahead ${s.L} m, ${s.v} m/s${s.lag ? `, ${s.lag} s steering lag` : ''}`;
  };
  ctrls.append(slider('Lookahead L', { min: 0.1, max: 1.5, step: 0.05, value: s.L, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.L = v; redraw(); }),
    slider('Speed', { min: 0.2, max: 1, step: 0.05, value: s.v, fmt: (v) => v.toFixed(2) + ' m/s' }, (v) => { s.v = v; redraw(); }),
    select('Steering lag', [['0', 'none'], ['0.2', '0.2 s'], ['0.5', '0.5 s']], '0', (v) => { s.lag = +v; redraw(); }, 'pp-lag'),
    slider('Time', { min: 0, max: 40, step: 0.1, value: s.t, fmt: (v) => v.toFixed(1) + ' s' }, (v) => { s.t = v; redraw(); }));
  redraw();
};

export default W;
