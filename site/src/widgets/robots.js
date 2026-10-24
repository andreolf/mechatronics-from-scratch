// Widgets for Phase 15 (robot kinematics and dynamics). Sliders, selects, toggles and buttons only, plus optional drag handles.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const D2R = Math.PI / 180, deg = (r) => r / D2R;
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const setSlider = (lbl, v) => { const i = lbl.querySelector('input'); i.value = v; i.dispatchEvent(new Event('input')); };
const f2 = (v, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);

// ---- the arm lab's 2-link arm ----
const LAB = { l1: 1.0, l2: 0.8, m1: 1.5, m2: 1.0, g: 9.81, b: 0.6, tau: [45, 25] };
LAB.lc1 = LAB.l1 / 2; LAB.lc2 = LAB.l2 / 2; LAB.I1 = LAB.m1 * LAB.l1 ** 2 / 12; LAB.I2 = LAB.m2 * LAB.l2 ** 2 / 12;
const LIM = { q1: [0, Math.PI], q2: [-135 * D2R, 135 * D2R] };
const inLim = (q) => q[0] >= LIM.q1[0] - 1e-9 && q[0] <= LIM.q1[1] + 1e-9 && q[1] >= LIM.q2[0] - 1e-9 && q[1] <= LIM.q2[1] + 1e-9;
function fkN(q, L) { let x = 0, y = 0, a = 0; const pts = [[0, 0]]; q.forEach((qi, i) => { a += qi; x += L[i] * Math.cos(a); y += L[i] * Math.sin(a); pts.push([x, y]); }); return pts; }
function jacN(q, L) {
  const n = q.length, a = []; let s = 0; q.forEach((qi) => { s += qi; a.push(s); });
  const J = [new Array(n).fill(0), new Array(n).fill(0)];
  for (let j = 0; j < n; j++) for (let k = j; k < n; k++) { J[0][j] -= L[k] * Math.sin(a[k]); J[1][j] += L[k] * Math.cos(a[k]); }
  return J;
}
// 2 x n pseudo-inverse (and damped version) for planar tasks
function pinv2(J, lam = 0) {
  const n = J[0].length; let a = lam * lam, b = 0, d = lam * lam;
  for (let j = 0; j < n; j++) { a += J[0][j] ** 2; b += J[0][j] * J[1][j]; d += J[1][j] ** 2; }
  const det = a * d - b * b; if (Math.abs(det) < 1e-300) return null;
  const Ai = [[d / det, -b / det], [-b / det, a / det]];
  return Array.from({ length: n }, (_, j) => [J[0][j] * Ai[0][0] + J[1][j] * Ai[1][0], J[0][j] * Ai[0][1] + J[1][j] * Ai[1][1]]);
}
const mulNv = (P, e) => P.map((r) => r[0] * e[0] + r[1] * e[1]);
function ik2(x, y, l1 = LAB.l1, l2 = LAB.l2) {
  const c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (Math.abs(c2) > 1 + 1e-12) return [];
  const cc = clamp(c2, -1, 1);
  return [1, -1].map((sg) => { const s2 = sg * Math.sqrt(1 - cc * cc), q2 = Math.atan2(s2, cc); const q1 = Math.atan2(y, x) - Math.atan2(l2 * s2, l1 + l2 * cc); return [Math.atan2(Math.sin(q1), Math.cos(q1)), q2]; });
}
// lab dynamics: M, c (Coriolis + damping), g; optional point payload at the tool
function labDyn(q, qd, payload = 0, damp = LAB.b) {
  const { l1, l2, m1, m2, lc1, lc2, I1, I2, g } = LAB;
  const I2c = I2 + m2 * lc2 * lc2 + payload * l2 * l2, mc2 = m2 * lc2 + payload * l2, c2 = Math.cos(q[1]), s2 = Math.sin(q[1]);
  const M11 = m1 * lc1 * lc1 + I1 + (m2 + payload) * l1 * l1 + I2c + 2 * l1 * mc2 * c2, M12 = I2c + l1 * mc2 * c2, M22 = I2c;
  const hh = l1 * mc2 * s2;
  const c = [-hh * (2 * qd[0] * qd[1] + qd[1] ** 2) + damp * qd[0], hh * qd[0] ** 2 + damp * qd[1]];
  const G = [(m1 * lc1 + (m2 + payload) * l1) * g * Math.cos(q[0]) + mc2 * g * Math.cos(q[0] + q[1]), mc2 * g * Math.cos(q[0] + q[1])];
  return { M: [[M11, M12], [M12, M22]], c, G };
}
const solve2 = (M, r) => { const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return [(M[1][1] * r[0] - M[0][1] * r[1]) / det, (-M[1][0] * r[0] + M[0][0] * r[1]) / det]; };
// RK4 on s = [q1, q2, w1, w2] with acceleration acc(s, t)
function rk4arm(s, t, dt, acc) {
  const f = (x, tt) => { const a = acc(x, tt); return [x[2], x[3], a[0], a[1]]; };
  const k1 = f(s, t), k2 = f(s.map((v, i) => v + dt / 2 * k1[i]), t + dt / 2), k3 = f(s.map((v, i) => v + dt / 2 * k2[i]), t + dt / 2), k4 = f(s.map((v, i) => v + dt * k3[i]), t + dt);
  return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
function drawArm(P, pts, color = C.lime, w = 5, dash) {
  P.line(pts.map((p) => p[0]), pts.map((p) => p[1]), color, w, dash);
  pts.slice(0, -1).forEach((p, i) => P.dot(p[0], p[1], i ? C.bone : C.fog, i ? 4 : 6));
  const e = pts[pts.length - 1]; P.dot(e[0], e[1], color, 4);
}
function ground(P, x0 = -0.3, x1 = 0.3) { P.line([x0, x1], [0, 0], C.dim, 3); }

// ---- 3-D helpers: 4x4 transforms and an orthographic view ----
const m4 = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const eye4 = () => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
function dhT(th, d, a, al) { const ct = Math.cos(th), st = Math.sin(th), ca = Math.cos(al), sa = Math.sin(al); return [[ct, -st * ca, st * sa, a * ct], [st, ct * ca, -ct * sa, a * st], [0, sa, ca, d], [0, 0, 0, 1]]; }
const DH3 = [[0.4, 0, Math.PI / 2], [0, 0.5, 0], [0, 0.4, 0]];
function fkDH(q) { let T = eye4(); const fr = [T]; q.forEach((qi, i) => { T = m4(T, dhT(qi, ...DH3[i])); fr.push(T); }); return fr; }
const skew3 = (w) => [[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function expScrew(w, v, th) {
  const W3 = skew3(w), W2 = W3.map((r) => [0, 1, 2].map((j) => r.reduce((s, x, k) => s + x * W3[k][j], 0)));
  const R = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 1 : 0) + Math.sin(th) * W3[i][j] + (1 - Math.cos(th)) * W2[i][j]));
  const G = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? th : 0) + (1 - Math.cos(th)) * W3[i][j] + (th - Math.sin(th)) * W2[i][j]));
  const p = G.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  return [[...R[0], p[0]], [...R[1], p[1]], [...R[2], p[2]], [0, 0, 0, 1]];
}
const screwOf = (w, q) => ({ w, v: cross3(q, w) });   // v = -w x q = q x w
const apply4 = (T, p) => [0, 1, 2].map((i) => T[i][0] * p[0] + T[i][1] * p[1] + T[i][2] * p[2] + T[i][3]);
const rot4 = (T, v) => [0, 1, 2].map((i) => T[i][0] * v[0] + T[i][1] * v[1] + T[i][2] * v[2]);
function view(az, el) {
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  return (p) => [p[0] * ca + p[1] * sa, p[2] * ce - (-p[0] * sa + p[1] * ca) * se];
}
function line3(P, V, a, b, color, w = 2, dash) { const A = V(a), B = V(b); P.line([A[0], B[0]], [A[1], B[1]], color, w, dash); }
function floor3(P, V, r = 0.6) {
  for (let i = -2; i <= 2; i++) { const s = (r * i) / 2; line3(P, V, [s, -r, 0], [s, r, 0], C.rule2, 1); line3(P, V, [-r, s, 0], [r, s, 0], C.rule2, 1); }
}

// ---- p15-l01: degrees of freedom counter ----
function rankOf(rows, tol = 1e-9) {
  const M = rows.map((r) => r.slice()); let rk = 0; const m = M.length, n = m ? M[0].length : 0;
  const scale = Math.max(1, ...M.flat().map(Math.abs));
  for (let c = 0; c < n && rk < m; c++) {
    let p = rk; for (let r = rk + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < tol * scale) continue;
    [M[rk], M[p]] = [M[p], M[rk]];
    for (let r = 0; r < m; r++) if (r !== rk) { const f = M[r][c] / M[rk][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[rk][k]; }
    rk++;
  }
  return rk;
}
function mobility(nb, joints) {   // planar rank test: joints [kind, a, b, P, u]
  const nq = 3 * (nb - 1), rows = [];
  const blk = (body, P) => { const J = [new Array(nq).fill(0), new Array(nq).fill(0)]; if (body > 0) { const k = 3 * (body - 1); J[0][k] = 1; J[1][k + 1] = 1; J[0][k + 2] = -P[1]; J[1][k + 2] = P[0]; } return J; };
  for (const [kind, a, b, P, u] of joints) {
    const A = blk(a, P), B = blk(b, P), D = [A[0].map((v, i) => v - B[0][i]), A[1].map((v, i) => v - B[1][i])];
    if (kind === 'R') rows.push(D[0], D[1]);
    else { const nn = [-u[1], u[0]], r = new Array(nq).fill(0); if (a > 0) r[3 * (a - 1) + 2] += 1; if (b > 0) r[3 * (b - 1) + 2] -= 1; rows.push(D[0].map((v, i) => nn[0] * v + nn[1] * D[1][i]), r); }
  }
  return nq - rankOf(rows);
}
const circ = (P0, r0, P1, r1, up = 1) => { const dx = P1[0] - P0[0], dy = P1[1] - P0[1], d = Math.hypot(dx, dy); const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, r0 * r0 - a * a)); const mx = P0[0] + a * dx / d, my = P0[1] + a * dy / d; return [mx - up * hh * dy / d, my + up * hh * dx / d]; };
W.dofcount = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { m: 'fourbar', t: 0.15 };
  const MECH = {
    fourbar: { name: 'Four-bar', nb: 4, build: (t) => { const A = [0, 0], D = [2, 0], th = 2 * Math.PI * t, B = [0.6 * Math.cos(th), 0.6 * Math.sin(th)], Cc = circ(B, 1.8, D, 1.4); return { links: [[A, B], [B, Cc], [Cc, D]], ground: [A, D], joints: [['R', 0, 1, A], ['R', 1, 2, B], ['R', 2, 3, Cc], ['R', 3, 0, D]] }; } },
    slider: { name: 'Slider-crank', nb: 4, build: (t) => { const A = [0, 0], th = 2 * Math.PI * t, B = [0.5 * Math.cos(th), 0.5 * Math.sin(th)], Cc = [B[0] + Math.sqrt(1.5 ** 2 - B[1] ** 2), 0]; return { links: [[A, B], [B, Cc]], ground: [A, [2.3, 0]], block: Cc, joints: [['R', 0, 1, A], ['R', 1, 2, B], ['R', 2, 3, Cc], ['P', 3, 0, Cc, [1, 0]]] }; } },
    fivebar: { name: 'Five-bar', nb: 5, build: (t) => { const A = [0, 0], E = [2, 0], a1 = (100 + 30 * Math.sin(2 * Math.PI * t)) * D2R, a2 = (75 + 30 * Math.cos(2 * Math.PI * t)) * D2R; const B = [0.9 * Math.cos(a1), 0.9 * Math.sin(a1)], D = [E[0] + 0.9 * Math.cos(a2), 0.9 * Math.sin(a2)], Cc = circ(B, 1.3, D, 1.3); return { links: [[A, B], [B, Cc], [Cc, D], [D, E]], ground: [A, E], joints: [['R', 0, 1, A], ['R', 1, 2, B], ['R', 2, 3, Cc], ['R', 3, 4, D], ['R', 4, 0, E]] }; } },
    truss: { name: 'Triangle truss', nb: 3, build: () => { const A = [0, 0], B = [0.8, 1.2], Cc = [1.6, 0]; return { links: [[A, B], [B, Cc]], ground: [A, Cc], joints: [['R', 0, 1, A], ['R', 1, 2, B], ['R', 2, 0, Cc]] }; } },
    arm3: { name: '3R serial arm', nb: 4, build: (t) => { const q = [(50 + 25 * Math.sin(2 * Math.PI * t)) * D2R, (-40 + 30 * Math.cos(2 * Math.PI * t)) * D2R, (-30 + 40 * Math.sin(4 * Math.PI * t)) * D2R]; const p = fkN(q, [0.9, 0.7, 0.4]); return { links: [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]]], ground: [[-0.2, 0], [0.2, 0]], joints: [['R', 0, 1, p[0]], ['R', 1, 2, p[1]], ['R', 2, 3, p[2]]] }; } },
    dpar: { name: 'Double parallelogram', nb: 5, build: (t) => { const th = (60 + 30 * Math.sin(2 * Math.PI * t)) * D2R, u = [1.1 * Math.cos(th), 1.1 * Math.sin(th)]; const A = [0, 0], M = [1, 0], D = [2, 0], B = u, N = [1 + u[0], u[1]], Cc = [2 + u[0], u[1]]; return { links: [[A, B], [M, N], [D, Cc], [B, Cc]], ground: [A, D], joints: [['R', 0, 1, A], ['R', 1, 2, B], ['R', 2, 3, Cc], ['R', 3, 0, D], ['R', 0, 4, M], ['R', 4, 2, N]] }; } },
  };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [-1, 3], y: [-0.6, 2.2], equal: true, label: 'A planar mechanism and its degree-of-freedom count' });
  p.draw = (P) => {
    const m = MECH[s.m], g = m.build(s.t);
    P.axes();
    P.line([g.ground[0][0] - 0.2, g.ground[1][0] + 0.2], [-0.04, -0.04], C.dim, 6);
    g.links.forEach(([a, b], i) => P.line([a[0], b[0]], [a[1], b[1]], [C.lime, C.signal, C.warn, C.bone][i % 4], 4));
    if (g.block) P.poly([[g.block[0] - 0.15, -0.1], [g.block[0] + 0.15, -0.1], [g.block[0] + 0.15, 0.1], [g.block[0] - 0.15, 0.1]], 'rgba(255,181,71,.35)', C.warn);
    g.joints.forEach((j) => P.dot(j[3][0], j[3][1], C.bone, 5));
    const J = g.joints.length, grub = 3 * (m.nb - 1 - J) + J, rk = mobility(m.nb, g.joints);
    read.innerHTML = `${m.name}: N = ${m.nb} bodies (with ground), J = ${J} one-freedom joints · Grübler 3(N − 1 − J) + J = ${ok(grub)} · rank test at this pose ${grub === rk ? ok(rk) : bad(rk)} ${grub === rk ? '' : '(a redundant constraint: the formula undercounts)'} ${rk === 0 ? '· a structure: nothing moves' : ''}`;
  };
  ctrls.append(select('Mechanism', [['fourbar', 'Four-bar'], ['slider', 'Slider-crank'], ['fivebar', 'Five-bar (2 inputs)'], ['truss', 'Triangle truss'], ['arm3', '3R serial arm'], ['dpar', 'Double parallelogram']], s.m, (v) => { s.m = v; p.redraw(); }, 'dof-mech'),
    slider('Drive', { min: 0, max: 1, step: 0.005, value: s.t, fmt: (v) => (v * 100).toFixed(0) + ' %' }, (v) => { s.t = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l02: 2-link workspace ----
W.armws = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q1: 60, q2: -70, lim: false };
  const pts = (lim) => { const out = []; const n = 70; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q1 = lim ? LIM.q1[0] + (LIM.q1[1] - LIM.q1[0]) * i / (n - 1) : -Math.PI + 2 * Math.PI * i / n; const q2 = lim ? LIM.q2[0] + (LIM.q2[1] - LIM.q2[0]) * j / (n - 1) : -Math.PI + 2 * Math.PI * j / n; out.push(fkN([q1, q2], [1, 0.8])[2]); } return out; };
  const cloud = { false: pts(false), true: pts(true) };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-2, 2], y: [-2, 2], equal: true, label: 'The arm lab arm with its reachable workspace' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' });
    cloud[s.lim].forEach((c) => P.dot(c[0], c[1], 'rgba(198,255,26,.18)', 2.2));
    P.fn((x) => Math.sqrt(Math.max(0, 1.8 ** 2 - x * x)), C.rule2, 1); P.fn((x) => -Math.sqrt(Math.max(0, 1.8 ** 2 - x * x)), C.rule2, 1);
    const q = [s.q1 * D2R, s.q2 * D2R], a = fkN(q, [1, 0.8]), okq = !s.lim || inLim(q);
    drawArm(P, a, okq ? C.lime : C.bad); ground(P);
    const tip = a[2];
    read.innerHTML = `elbow (${f2(a[1][0], 3)}, ${f2(a[1][1], 3)}) m · tool ${sp(C.lime, `(${f2(tip[0], 3)}, ${f2(tip[1], 3)}) m`)} · distance from base ${Math.hypot(...tip).toFixed(3)} m · workspace ${s.lim ? 'with the lab limits 0 ≤ q1 ≤ 180°, |q2| ≤ 135°: about 6.0 m²' : 'with free joints: annulus 0.2 to 1.8 m, 10.05 m²'}${okq ? '' : ' · ' + bad('this pose breaks a limit')}`;
  };
  ctrls.append(slider('Shoulder q1', { min: -180, max: 180, step: 1, value: s.q1, fmt: (v) => v + '°' }, (v) => { s.q1 = v; p.redraw(); }),
    slider('Elbow q2', { min: -180, max: 180, step: 1, value: s.q2, fmt: (v) => v + '°' }, (v) => { s.q2 = v; p.redraw(); }),
    toggle('Lab joint limits', s.lim, (v) => { s.lim = v; p.redraw(); }, { id: 'ws-lim' }));
  p.redraw();
};

// ---- p15-l03: DH frames on a 3-joint arm ----
function frameAxes(P, V, T, len = 0.12, w = 2) {
  const o = [T[0][3], T[1][3], T[2][3]];
  line3(P, V, o, o.map((v, i) => v + len * T[i][0]), C.lime, w); line3(P, V, o, o.map((v, i) => v + len * T[i][2]), C.signal, w);
}
W.dhframes = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q: [30, 45, -60], az: -35 };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-0.8, 0.8], y: [-0.3, 1.1], equal: true, label: 'A 3-joint arm with its Denavit-Hartenberg frames' });
  p.draw = (P) => {
    const V = view(s.az * D2R, 0.35), fr = fkDH(s.q.map((v) => v * D2R));
    floor3(P, V);
    const O = fr.map((T) => [T[0][3], T[1][3], T[2][3]]);
    line3(P, V, [0, 0, 0], O[1], C.fog, 6);
    for (let i = 1; i < 3; i++) line3(P, V, O[i], O[i + 1], i === 1 ? C.bone : C.warn, 5);
    fr.forEach((T) => frameAxes(P, V, T));
    O.forEach((o, i) => { const u = V(o); P.dot(u[0], u[1], C.bone, 4); P.text(String(i), u[0] + 0.03, u[1] + 0.03, C.dim); });
    const t = O[3], z1 = [fr[1][0][2], fr[1][1][2], fr[1][2][2]];
    read.innerHTML = `tool (${t.map((v) => f2(v, 4)).join(', ')}) m · ${sp(C.lime, 'x axes')} and ${sp(C.signal, 'z axes')} of frames 0 to 3 · z₁ (the shoulder axis) = (${z1.map((v) => f2(v, 3)).join(', ')}): horizontal, tipped by the 90° twist α₁`;
  };
  ['Base yaw q1', 'Shoulder q2', 'Elbow q3'].forEach((lab, i) => ctrls.append(slider(lab, { min: -180, max: 180, step: 1, value: s.q[i], fmt: (v) => v + '°' }, (v) => { s.q[i] = v; p.redraw(); })));
  ctrls.append(slider('View angle', { min: -90, max: 90, step: 1, value: s.az, fmt: (v) => v + '°' }, (v) => { s.az = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l04: screw axes ----
const S3 = [screwOf([0, 0, 1], [0, 0, 0]), screwOf([0, -1, 0], [0, 0, 0.4]), screwOf([0, -1, 0], [0.5, 0, 0.4])];
const PTS3 = [[0, 0, 0], [0, 0, 0.4], [0.5, 0, 0.4], [0.9, 0, 0.4]];
W.screwaxes = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q: [30, 45, -60], j: 1, az: -35 };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-0.8, 0.8], y: [-0.3, 1.1], equal: true, label: 'The 3-joint arm with each joint screw axis drawn in space' });
  let slid;
  p.draw = (P) => {
    const V = view(s.az * D2R, 0.35), q = s.q.map((v) => v * D2R);
    floor3(P, V);
    const Ts = [eye4()]; for (let i = 0; i < 3; i++) Ts.push(m4(Ts[i], expScrew(S3[i].w, S3[i].v, q[i])));
    const pos = PTS3.map((pt, i) => apply4(Ts[Math.min(i, 3)], pt));
    // axis of joint i in the current pose: carried by joints before it
    for (let i = 0; i < 3; i++) {
      const pt = apply4(Ts[i], PTS3[i]), w = rot4(Ts[i], S3[i].w), col = i === s.j ? C.warn : C.dim;
      line3(P, V, pt.map((v, k) => v - 0.6 * w[k]), pt.map((v, k) => v + 0.6 * w[k]), col, i === s.j ? 2.5 : 1.5, [6, 4]);
    }
    line3(P, V, pos[0], pos[1], C.fog, 6); line3(P, V, pos[1], pos[2], C.bone, 5); line3(P, V, pos[2], pos[3], C.lime, 5);
    pos.forEach((o) => { const u = V(o); P.dot(u[0], u[1], C.bone, 4); });
    const S = S3[s.j], w = rot4(Ts[s.j], S.w), pt = apply4(Ts[s.j], PTS3[s.j]), vnow = cross3(pt, w);
    read.innerHTML = `${sp(C.warn, `joint ${s.j + 1} screw axis`)}: at home S = (${[...S.w, ...S.v].map((v) => f2(v, 2)).join(', ')}) · in the current pose ω = (${w.map((v) => f2(v, 2)).join(', ')}), v = (${vnow.map((v) => f2(v, 2)).join(', ')}) · tool (${pos[3].map((v) => f2(v, 4)).join(', ')}) m, the same as the DH table`;
  };
  const sel = select('Joint', [['0', 'Joint 1: base yaw'], ['1', 'Joint 2: shoulder'], ['2', 'Joint 3: elbow']], String(s.j), (v) => { s.j = +v; slid.querySelector('input').value = s.q[s.j]; slid.querySelector('input').dispatchEvent(new Event('input')); }, 'screw-joint');
  slid = slider('Joint angle', { min: -180, max: 180, step: 1, value: s.q[s.j], fmt: (v) => v + '°' }, (v) => { s.q[s.j] = v; p.redraw(); });
  ctrls.append(sel, slid, slider('View angle', { min: -90, max: 90, step: 1, value: s.az, fmt: (v) => v + '°' }, (v) => { s.az = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l05: 6-axis arm ----
const S6 = [screwOf([0, 0, 1], [0, 0, 0]), screwOf([0, -1, 0], [0, 0, 0.4]), screwOf([0, -1, 0], [0.5, 0, 0.4]), screwOf([1, 0, 0], [0.5, 0, 0.4]), screwOf([0, -1, 0], [0.9, 0, 0.4]), screwOf([1, 0, 0], [0.9, 0, 0.4])];
W.arm6 = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q: [30, 45, -60, 20, 50, -30], az: -35 };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-0.9, 0.9], y: [-0.3, 1.2], equal: true, label: 'An illustrative 6-axis arm with its tool frame' });
  p.draw = (P) => {
    const V = view(s.az * D2R, 0.35), q = s.q.map((v) => v * D2R);
    floor3(P, V);
    const Ts = [eye4()]; for (let i = 0; i < 6; i++) Ts.push(m4(Ts[i], expScrew(S6[i].w, S6[i].v, q[i])));
    const sh = apply4(Ts[1], [0, 0, 0.4]), elb = apply4(Ts[2], [0.5, 0, 0.4]), wc = apply4(Ts[3], [0.9, 0, 0.4]);
    const T = m4(Ts[6], [[1, 0, 0, 1.0], [0, 1, 0, 0], [0, 0, 1, 0.4], [0, 0, 0, 1]]), tool = [T[0][3], T[1][3], T[2][3]];
    line3(P, V, [0, 0, 0], sh, C.fog, 7); line3(P, V, sh, elb, C.bone, 6); line3(P, V, elb, wc, C.signal, 5); line3(P, V, wc, tool, C.lime, 4);
    const ax = (k, col) => line3(P, V, tool, tool.map((v, i) => v + 0.15 * T[i][k]), col, 2.5);
    ax(0, C.bad); ax(1, C.lime); ax(2, C.signal);
    [sh, elb].forEach((o) => { const u = V(o); P.dot(u[0], u[1], C.bone, 4); });
    const u = V(wc); P.dot(u[0], u[1], '#ffffff', 5);
    read.innerHTML = `tool flange (${tool.map((v) => f2(v, 4)).join(', ')}) m · tool axes ${sp(C.bad, 'x')}, ${sp(C.lime, 'y')}, ${sp(C.signal, 'z')} · white dot: wrist centre (${wc.map((v) => f2(v, 4)).join(', ')}) m, set by joints 1 to 3 only`;
  };
  ['Base q1', 'Shoulder q2', 'Elbow q3', 'Forearm roll q4', 'Wrist pitch q5', 'Tool roll q6'].forEach((lab, i) => ctrls.append(slider(lab, { min: -180, max: 180, step: 1, value: s.q[i], fmt: (v) => v + '°' }, (v) => { s.q[i] = v; p.redraw(); })));
  ctrls.append(slider('View angle', { min: -90, max: 90, step: 1, value: s.az, fmt: (v) => v + '°' }, (v) => { s.az = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l06: both IK branches ----
W.ikbranches = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const s = { x: 1.2, y: 0.6, lim: true };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-2, 2], y: [-1.2, 2], equal: true, label: 'Both inverse kinematics branches for a target' });
  let sx, sy;
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' });
    for (const r of [0.2, 1.8]) { const xs = [], ys = []; for (let i = 0; i <= 120; i++) { xs.push(r * Math.cos(i * Math.PI / 60)); ys.push(r * Math.sin(i * Math.PI / 60)); } P.line(xs, ys, C.rule2, 1.5); }
    ground(P);
    const sols = ik2(s.x, s.y), cur = [60 * D2R, -70 * D2R];
    let pick = null, lines = '';
    if (sols.length) {
      const okk = sols.filter((q) => !s.lim || inLim(q)); const pool = okk.length ? okk : sols;
      pick = pool.slice().sort((A, B) => Math.hypot(A[0] - cur[0], A[1] - cur[1]) - Math.hypot(B[0] - cur[0], B[1] - cur[1]))[0];
      sols.forEach((q) => { const isP = q === pick, inl = !s.lim || inLim(q); drawArm(P, fkN(q, [1, 0.8]), isP && inl ? C.lime : inl ? C.signal : C.bad, isP ? 5 : 3, isP ? undefined : [6, 4]); });
      lines = sols.map((q) => `${q[1] >= 0 ? 'q2 ≥ 0' : 'q2 ≤ 0'}: (${deg(q[0]).toFixed(1)}°, ${deg(q[1]).toFixed(1)}°)${s.lim && !inLim(q) ? ' ' + bad('breaks a limit') : ''}`).join(' · ');
    }
    P.handle(s.x, s.y, C.warn);
    const c2 = (s.x * s.x + s.y * s.y - 1.64) / 1.6;
    read.innerHTML = sols.length ? `target (${s.x.toFixed(2)}, ${s.y.toFixed(2)}) m · cos q2 = ${c2.toFixed(3)} · ${lines} · ${s.lim && sols.every((q) => !inLim(q)) ? bad('no branch inside the limits: the lab flags this target') : ok('solid: the branch the lab picks')}` : `target (${s.x.toFixed(2)}, ${s.y.toFixed(2)}) m · cos q2 = ${c2.toFixed(3)} · ${bad('|cos q2| > 1: out of reach')}`;
  };
  p.handles(() => [[s.x, s.y]], (i, x, y) => { setSlider(sx, Math.round(clamp(x, -2, 2) * 100) / 100); setSlider(sy, Math.round(clamp(y, -1.2, 2) * 100) / 100); }, el);
  sx = slider('Target x', { min: -2, max: 2, step: 0.01, value: s.x, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.x = v; p.redraw(); });
  sy = slider('Target y', { min: -1.2, max: 2, step: 0.01, value: s.y, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.y = v; p.redraw(); });
  ctrls.append(sx, sy, toggle('Lab joint limits', s.lim, (v) => { s.lim = v; p.redraw(); }, { id: 'ik-lim' }));
  p.redraw();
};

// ---- p15-l07: Newton IK iterations ----
W.newtonik = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const s = { x: 1.2, y: 0.6, arm: 'lab' };
  const ARMS = { lab: { L: [1, 0.8], q0: [60, -70] }, three: { L: [1, 0.8, 0.3], q0: [60, -70, 20] } };
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [-2.1, 2.1], y: [-1.2, 2.1], equal: true, label: 'Newton iterations converging on the target' });
  const q = new Plot(body, { aspect: 0.38, maxH: 200, x: [0, 20], y: [1e-16, 10], logy: true, label: 'Error per iteration on a log scale' });
  let res, sx, sy;
  const solve = () => {
    const A = ARMS[s.arm]; let qq = A.q0.map((v) => v * D2R); const iters = [qq.slice()], errs = [];
    for (let k = 0; k <= 20; k++) {
      const tip = fkN(qq, A.L).at(-1), e = [s.x - tip[0], s.y - tip[1]], n = Math.hypot(...e); errs.push(n);
      if (n < 1e-12 || k === 20) break;
      const Pi = pinv2(jacN(qq, A.L)); if (!Pi) break; let dq = mulNv(Pi, e); const m = Math.hypot(...dq); if (m > 0.5) dq = dq.map((v) => v * 0.5 / m);
      qq = qq.map((v, i) => v + dq[i]); iters.push(qq.slice());
    }
    res = { iters, errs, L: A.L };
  };
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P);
    const n = res.iters.length; res.iters.forEach((qq, k) => drawArm(P, fkN(qq, res.L), k === n - 1 ? C.lime : `rgba(111,211,255,${0.25 + 0.5 * k / n})`, k === n - 1 ? 5 : 2));
    P.handle(s.x, s.y, C.warn);
  };
  q.draw = (P) => {
    P.axes({ xl: 'iteration', yl: 'error (m)' });
    const e = res.errs.map((v) => Math.max(v, 1e-16)); P.line(e.map((_, i) => i), e, C.lime, 2.5); e.forEach((v, i) => P.dot(i, v, C.lime, 3.5));
  };
  const redraw = () => {
    solve(); p.redraw(); q.redraw();
    const conv = res.errs.at(-1) < 1e-9, k = res.errs.length - 1;
    read.innerHTML = `${s.arm === 'lab' ? 'lab 2-link arm' : '3-link arm (redundant)'} from (${ARMS[s.arm].q0.join('°, ')}°) · ${conv ? ok(`converged in ${k} iterations`) : bad('no convergence in 20 iterations (out of reach?)')} · final error ${res.errs.at(-1).toExponential(1)} m · final q (${res.iters.at(-1).map((v) => deg(v).toFixed(1) + '°').join(', ')})`;
  };
  p.handles(() => [[s.x, s.y]], (i, x, y) => { setSlider(sx, Math.round(clamp(x, -2, 2) * 100) / 100); setSlider(sy, Math.round(clamp(y, -1.2, 2) * 100) / 100); }, el);
  sx = slider('Target x', { min: -2, max: 2, step: 0.01, value: s.x, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.x = v; redraw(); });
  sy = slider('Target y', { min: -1.2, max: 2, step: 0.01, value: s.y, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.y = v; redraw(); });
  ctrls.append(sx, sy, select('Arm', [['lab', 'Lab 2-link arm'], ['three', '3-link arm']], s.arm, (v) => { s.arm = v; redraw(); }, 'newton-arm'));
  redraw();
};

// ---- p15-l08: pseudo-inverse vs damped least squares at full stretch ----
W.dlsdemo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lam: 0.08, t: 1.6 };
  const L = [1, 0.8], T = 4, dt = 0.001;
  const sim = (lam) => {
    let q = [20 * D2R, -60 * D2R]; const x0 = fkN(q, L)[2], out = [];
    for (let i = 0; i <= T / dt; i++) {
      const t = i * dt, xd = [x0[0] + 0.2 * t, x0[1] + (0.3 - x0[1]) * Math.min(1, t / 0.5)], vd = [0.2, t < 0.5 ? (0.3 - x0[1]) / 0.5 : 0];
      const tip = fkN(q, L)[2], e = [xd[0] - tip[0], xd[1] - tip[1]];
      const Pi = pinv2(jacN(q, L), lam); let qd = Pi ? mulNv(Pi, [vd[0] + 20 * e[0], vd[1] + 20 * e[1]]) : [0, 0];
      if (!qd.every(Number.isFinite)) qd = [0, 0];
      out.push({ t, q: q.slice(), xd, sp: Math.max(Math.abs(qd[0]), Math.abs(qd[1])), err: Math.hypot(...e) });
      q = q.map((v, k) => v + dt * clamp(qd[k], -1e4, 1e4));
    }
    return out;
  };
  const pinvRun = sim(1e-6);
  let dls = sim(s.lam);
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [-0.3, 2.5], y: [-0.4, 1.4], equal: true, label: 'The arm following a target that slides out past its reach' });
  const q = new Plot(body, { aspect: 0.42, maxH: 220, x: [0, 4], y: [1e-2, 1e6], logy: true, label: 'Peak joint speed over time on a log scale' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P, -0.2, 0.2);
    const xs = [], ys = []; for (let i = 0; i <= 120; i++) { xs.push(1.8 * Math.cos(i * Math.PI / 240)); ys.push(1.8 * Math.sin(i * Math.PI / 240)); } P.line(xs, ys, C.rule2, 1.5);
    P.line(dls.map((d) => d.xd[0]), dls.map((d) => d.xd[1]), C.dim, 1.5, [4, 4]);
    const k = Math.round(s.t / dt), a = pinvRun[k], b = dls[k];
    if (a.q.every(Number.isFinite) && Math.abs(a.q[0]) < 50) drawArm(P, fkN(a.q, L), C.bad, 2.5, [6, 4]);
    drawArm(P, fkN(b.q, L), C.lime, 5); P.dot(b.xd[0], b.xd[1], C.warn, 6);
  };
  q.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'max |q̇| (rad/s)' });
    const st = 5, pk = (r) => r.filter((_, i) => i % st === 0);
    P.line(pk(pinvRun).map((d) => d.t), pk(pinvRun).map((d) => clamp(d.sp, 1e-2, 1e6)), C.bad, 1.8);
    P.line(pk(dls).map((d) => d.t), pk(dls).map((d) => clamp(d.sp, 1e-2, 1e6)), C.lime, 2.5);
    P.line([s.t, s.t], [1e-2, 1e6], C.warn, 1, [3, 3]);
  };
  const redraw = (re) => {
    if (re) dls = sim(s.lam); p.redraw(); q.redraw();
    const k = Math.round(s.t / dt), pkP = Math.max(...pinvRun.map((d) => d.sp)), pkD = Math.max(...dls.map((d) => d.sp));
    read.innerHTML = `t = ${s.t.toFixed(2)} s, target ${Math.hypot(...dls[k].xd).toFixed(2)} m from the base (reach 1.8 m) · peak joint speed: ${sp(C.bad, `pseudo-inverse ${pkP.toExponential(1)} rad/s`)}, ${sp(C.lime, `DLS λ = ${s.lam.toFixed(2)}: ${pkD.toFixed(2)} rad/s`)} · DLS error now ${(dls[k].err * 1000).toFixed(0)} mm`;
  };
  ctrls.append(slider('Time', { min: 0, max: 4, step: 0.02, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; redraw(false); }),
    slider('Damping λ', { min: 0.01, max: 0.3, step: 0.01, value: s.lam, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.lam = v; redraw(true); }));
  redraw(false);
};

// ---- p15-l09: velocity ellipse ----
W.velellipse = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q1: 60, q2: -70 };
  const p = new Plot(body, { aspect: 0.8, maxH: 400, x: [-2, 2], y: [-1.2, 2.2], equal: true, label: 'The arm lab arm with its velocity ellipse at the tool' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P);
    const q = [s.q1 * D2R, s.q2 * D2R], pts = fkN(q, [1, 0.8]), J = jacN(q, [1, 0.8]), tip = pts[2];
    const xs = [], ys = []; for (let i = 0; i <= 90; i++) { const a = i * 2 * Math.PI / 90, u = [Math.cos(a), Math.sin(a)]; xs.push(tip[0] + 0.4 * (J[0][0] * u[0] + J[0][1] * u[1])); ys.push(tip[1] + 0.4 * (J[1][0] * u[0] + J[1][1] * u[1])); }
    P.poly(xs.map((x, i) => [x, ys[i]]), 'rgba(111,211,255,.15)', C.signal);
    drawArm(P, pts, C.lime);
    const a = J[0][0] ** 2 + J[0][1] ** 2, b = J[0][0] * J[1][0] + J[0][1] * J[1][1], d = J[1][0] ** 2 + J[1][1] ** 2, tr = a + d, dis = Math.sqrt(Math.max(0, tr * tr / 4 - (a * d - b * b)));
    const s1 = Math.sqrt(tr / 2 + dis), s2 = Math.sqrt(Math.max(0, tr / 2 - dis)), w = Math.abs(J[0][0] * J[1][1] - J[0][1] * J[1][0]);
    read.innerHTML = `${sp(C.signal, 'velocity ellipse')} (drawn at 0.4 s scale): semi-axes σ₁ = ${s1.toFixed(3)}, σ₂ = ${s2.toFixed(3)} m/s per rad/s · manipulability w = l₁l₂|sin q₂| = ${w < 0.08 ? bad(w.toFixed(3)) : ok(w.toFixed(3))} m²${w < 0.08 ? ' · near a singularity: one direction is almost lost' : ''}`;
  };
  ctrls.append(slider('Shoulder q1', { min: -180, max: 180, step: 1, value: s.q1, fmt: (v) => v + '°' }, (v) => { s.q1 = v; p.redraw(); }),
    slider('Elbow q2', { min: -180, max: 180, step: 1, value: s.q2, fmt: (v) => v + '°' }, (v) => { s.q2 = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l10: statics with torque bars ----
W.statics = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q1: 60, q2: -70, m: 0, F: 0, dir: 0 };
  const p = new Plot(body, { aspect: 0.7, maxH: 360, x: [-1.2, 2.2], y: [-0.6, 1.9], equal: true, label: 'The arm holding a payload with a push at the tool' });
  const b = new Plot(body, { aspect: 0.34, maxH: 180, x: [-50, 50], y: [0, 3], label: 'Joint torques against the motor limits' });
  let tau;
  const comp = () => {
    const q = [s.q1 * D2R, s.q2 * D2R], { G } = labDyn(q, [0, 0], s.m), J = jacN(q, [1, 0.8]);
    const Fx = s.F * Math.cos(s.dir * D2R), Fy = s.F * Math.sin(s.dir * D2R);
    tau = [G[0] - (J[0][0] * Fx + J[1][0] * Fy), G[1] - (J[0][1] * Fx + J[1][1] * Fy)];
    return { q, Fx, Fy };
  };
  p.draw = (P) => {
    const { q, Fx, Fy } = comp(); P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P);
    const pts = fkN(q, [1, 0.8]), tip = pts[2]; drawArm(P, pts, C.lime);
    if (s.m > 0) { P.line([tip[0], tip[0]], [tip[1], tip[1] - 0.12], C.fog, 1.5); P.poly([[tip[0] - 0.07, tip[1] - 0.12], [tip[0] + 0.07, tip[1] - 0.12], [tip[0] + 0.07, tip[1] - 0.24], [tip[0] - 0.07, tip[1] - 0.24]], 'rgba(236,238,230,.3)', C.bone); }
    if (s.F > 0) P.arrow(tip[0] - Fx * 0.03, tip[1] - Fy * 0.03, tip[0], tip[1], C.warn, 3);
  };
  b.draw = (P) => {
    P.axes({ xl: 'torque (N·m)' });
    [[45, 2], [25, 1]].forEach(([lim, y]) => { P.poly([[-lim, y - 0.3], [lim, y - 0.3], [lim, y + 0.3], [-lim, y + 0.3]], 'rgba(255,255,255,.04)', C.rule2); });
    [[tau[0], 2, 45, 'shoulder'], [tau[1], 1, 25, 'elbow']].forEach(([t, y, lim, n]) => { const over = Math.abs(t) > lim; P.poly([[0, y - 0.22], [clamp(t, -50, 50), y - 0.22], [clamp(t, -50, 50), y + 0.22], [0, y + 0.22]], over ? 'rgba(255,107,91,.7)' : 'rgba(198,255,26,.6)'); P.text(n, -48, y + 0.42, C.dim); });
  };
  const redraw = () => {
    p.redraw(); b.redraw();
    const over = Math.abs(tau[0]) > 45 || Math.abs(tau[1]) > 25;
    read.innerHTML = `holding torques τ = (${tau[0].toFixed(2)}, ${tau[1].toFixed(2)}) N·m against limits (45, 25) · ${over ? bad('a motor is over its limit: the arm sags') : ok('within the limits')} · payload ${s.m.toFixed(1)} kg${s.F > 0 ? `, ${sp(C.warn, `push ${s.F} N`)} at ${s.dir}°` : ''}`;
  };
  ctrls.append(slider('Shoulder q1', { min: 0, max: 180, step: 1, value: s.q1, fmt: (v) => v + '°' }, (v) => { s.q1 = v; redraw(); }),
    slider('Elbow q2', { min: -135, max: 135, step: 1, value: s.q2, fmt: (v) => v + '°' }, (v) => { s.q2 = v; redraw(); }),
    slider('Payload', { min: 0, max: 3, step: 0.1, value: s.m, fmt: (v) => v.toFixed(1) + ' kg' }, (v) => { s.m = v; redraw(); }),
    slider('Push at the tool', { min: 0, max: 30, step: 1, value: s.F, fmt: (v) => v + ' N' }, (v) => { s.F = v; redraw(); }),
    slider('Push direction', { min: -180, max: 180, step: 5, value: s.dir, fmt: (v) => v + '°' }, (v) => { s.dir = v; redraw(); }));
  redraw();
};

// ---- p15-l11: null-space joint-limit avoidance ----
W.nullspace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { on: false, t: 3 };
  const L = [1, 0.8, 0.5], LM = [[0, 180], [-135, 135], [-60, 60]].map((r) => r.map((v) => v * D2R)), MID = LM.map((r) => (r[0] + r[1]) / 2), RG = LM.map((r) => r[1] - r[0]);
  const runs = {};
  const sim = (on) => {
    let q = [70, -80, 40].map((v) => v * D2R); const c = [1.2, 0.5], R = 0.4, w = 2 * Math.PI / 4, dt = 0.002;
    for (let i = 0; i < 200; i++) { const tip = fkN(q, L)[3], Pi = pinv2(jacN(q, L)), d = mulNv(Pi, [c[0] + R - tip[0], c[1] - tip[1]]); q = q.map((v, k) => v + d[k]); }
    const out = [];
    for (let i = 0; i <= 8 / dt; i++) {
      const t = i * dt, xd = [c[0] + R * Math.cos(w * t), c[1] + R * Math.sin(w * t)], vd = [-R * w * Math.sin(w * t), R * w * Math.cos(w * t)];
      const J = jacN(q, L), Pi = pinv2(J), tip = fkN(q, L)[3], e = [xd[0] - tip[0], xd[1] - tip[1]];
      let qd = mulNv(Pi, [vd[0] + 20 * e[0], vd[1] + 20 * e[1]]);
      if (on) { const z = q.map((v, k) => -10 * 2 * (v - MID[k]) / RG[k] ** 2); const Jz = [J[0].reduce((a, v, k) => a + v * z[k], 0), J[1].reduce((a, v, k) => a + v * z[k], 0)]; const pz = mulNv(Pi, Jz); qd = qd.map((v, k) => v + z[k] - pz[k]); }
      out.push({ t, q: q.slice(), xd }); q = q.map((v, k) => v + dt * qd[k]);
    }
    return out;
  };
  runs.false = sim(false); runs.true = sim(true);
  const p = new Plot(body, { aspect: 0.7, maxH: 340, x: [-0.6, 2.2], y: [-0.5, 1.6], equal: true, label: 'A redundant arm tracking a circle' });
  const q = new Plot(body, { aspect: 0.4, maxH: 200, x: [0, 8], y: [-160, 0], label: 'Elbow angle against its limit' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P);
    const r = runs[s.on], k = Math.round(s.t / 0.002), d = r[k];
    const xs = [], ys = []; for (let i = 0; i <= 90; i++) { xs.push(1.2 + 0.4 * Math.cos(i * Math.PI / 45)); ys.push(0.5 + 0.4 * Math.sin(i * Math.PI / 45)); } P.line(xs, ys, C.dim, 1.5, [4, 4]);
    const broken = d.q.some((v, i) => v < LM[i][0] - 1e-9 || v > LM[i][1] + 1e-9);
    drawArm(P, fkN(d.q, L), broken ? C.bad : C.lime); P.dot(d.xd[0], d.xd[1], C.warn, 5);
  };
  q.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'q2 (°)' }); P.line([0, 8], [-135, -135], C.bad, 1.5, [5, 4]);
    const pick = (r) => r.filter((_, i) => i % 10 === 0);
    P.line(pick(runs.false).map((d) => d.t), pick(runs.false).map((d) => deg(d.q[1])), s.on ? C.dim : C.bad, s.on ? 1.2 : 2.2);
    P.line(pick(runs.true).map((d) => d.t), pick(runs.true).map((d) => deg(d.q[1])), s.on ? C.lime : C.dim, s.on ? 2.2 : 1.2);
    P.line([s.t, s.t], [-160, 0], C.warn, 1, [3, 3]);
  };
  const redraw = () => {
    p.redraw(); q.redraw();
    const r = runs[s.on], worst = Math.min(...r.map((d) => Math.min(...d.q.map((v, i) => Math.min(v - LM[i][0], LM[i][1] - v)))));
    const d = r[Math.round(s.t / 0.002)];
    read.innerHTML = `${s.on ? sp(C.lime, 'pseudo-inverse + null-space limit avoidance') : sp(C.bad, 'pseudo-inverse only')} · q now (${d.q.map((v) => deg(v).toFixed(0) + '°').join(', ')}) · worst limit margin over 8 s ${worst < 0 ? bad(deg(worst).toFixed(1) + '°: elbow limit broken') : ok(deg(worst).toFixed(1) + '°')} · the tool follows the same circle either way · illustrative arm (1.0, 0.8, 0.5) m`;
  };
  ctrls.append(toggle('Null-space term on', s.on, (v) => { s.on = v; redraw(); }, { id: 'ns-on' }),
    slider('Time', { min: 0, max: 8, step: 0.02, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; redraw(); }));
  redraw();
};

// ---- p15-l12: RNEA force propagation ----
function rneaLab(q, qd, qdd) {
  const { l1, l2, m1, m2, lc1, lc2, I1, I2, g } = LAB, L = [l1, l2], m = [m1, m2], lc = [lc1, lc2], I = [I1, I2];
  const th = [q[0], q[0] + q[1]], w = [qd[0], qd[0] + qd[1]], al = [qdd[0], qdd[0] + qdd[1]];
  const wx = (ww, r) => [-ww * r[1], ww * r[0]], cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  let aj = [0, g]; const ac = [], rc = [], rn = [];
  for (let i = 0; i < 2; i++) {
    const u = [Math.cos(th[i]), Math.sin(th[i])], r1 = [lc[i] * u[0], lc[i] * u[1]], r2 = [L[i] * u[0], L[i] * u[1]];
    const t1 = wx(al[i], r1), c1 = wx(w[i], wx(w[i], r1)), t2 = wx(al[i], r2), c2 = wx(w[i], wx(w[i], r2));
    ac.push([aj[0] + t1[0] + c1[0], aj[1] + t1[1] + c1[1]]); aj = [aj[0] + t2[0] + c2[0], aj[1] + t2[1] + c2[1]]; rc.push(r1); rn.push(r2);
  }
  let f = [0, 0], tn = 0; const tau = [0, 0], fj = [0, 0];
  for (let i = 1; i >= 0; i--) { const F = [m[i] * ac[i][0], m[i] * ac[i][1]]; const fi = [F[0] + f[0], F[1] + f[1]]; tau[i] = I[i] * al[i] + cr(rc[i], F) + cr(rn[i], f) + tn; fj[i] = fi; f = fi; tn = tau[i]; }
  return { tau, fj };
}
W.rnea = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sp: 1, t: 0.4 };
  const motion = (t) => { const A = [40 * D2R, 50 * D2R], w = [1.5 * s.sp, 2 * s.sp], q0 = [60 * D2R, -70 * D2R]; return [q0.map((v, i) => v + A[i] * Math.sin(w[i] * t)), A.map((a, i) => a * w[i] * Math.cos(w[i] * t)), A.map((a, i) => -a * w[i] * w[i] * Math.sin(w[i] * t))]; };
  const p = new Plot(body, { aspect: 0.7, maxH: 340, x: [-1.2, 2.2], y: [-0.6, 1.9], equal: true, label: 'Forces transmitted at each joint during a motion' });
  const q = new Plot(body, { aspect: 0.42, maxH: 210, x: [0, 4], y: [-40, 60], label: 'Joint torques over time from recursive Newton-Euler' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' }); ground(P);
    const [qq, qd, qdd] = motion(s.t), pts = fkN(qq, [1, 0.8]), { tau, fj } = rneaLab(qq, qd, qdd);
    drawArm(P, pts, C.lime);
    [0, 1].forEach((i) => { const o = pts[i], f = fj[i], k = 0.02; P.arrow(o[0], o[1], o[0] + k * f[0], o[1] + k * f[1], i ? C.signal : C.warn, 2.5); });
    const g = rneaLab(qq, [0, 0], [0, 0]).tau;
    read.innerHTML = `t = ${s.t.toFixed(2)} s · τ = (${tau[0].toFixed(2)}, ${tau[1].toFixed(2)}) N·m, of which gravity (${g[0].toFixed(2)}, ${g[1].toFixed(2)}) · arrows: force ${sp(C.warn, 'the base')} and ${sp(C.signal, 'the elbow')} transmit to the link beyond (scale 0.02 m/N)`;
  };
  q.draw = (P) => {
    const ts = [], a = [], b = [], ga = []; for (let i = 0; i <= 200; i++) { const t = i * 0.02, [qq, qd, qdd] = motion(t), r = rneaLab(qq, qd, qdd); ts.push(t); a.push(r.tau[0]); b.push(r.tau[1]); ga.push(rneaLab(qq, [0, 0], [0, 0]).tau[0]); }
    const m = Math.max(50, ...a.map(Math.abs), ...b.map(Math.abs)) * 1.1; P.setRange([0, 4], [-m, m]); P.axes({ xl: 't (s)', yl: 'τ (N·m)' });
    P.line(ts, ga, C.dim, 1.2, [4, 4]); P.line(ts, a, C.warn, 2.2); P.line(ts, b, C.signal, 2.2); P.line([s.t, s.t], [-m, m], C.bone, 1, [3, 3]);
  };
  ctrls.append(slider('Time', { min: 0, max: 4, step: 0.02, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; p.redraw(); q.redraw(); }),
    slider('Motion speed', { min: 0.25, max: 3, step: 0.05, value: s.sp, fmt: (v) => '×' + v.toFixed(2) }, (v) => { s.sp = v; p.redraw(); q.redraw(); }));
  p.redraw(); q.redraw();
};

// ---- p15-l13: the arm falling, with energy ----
W.armfall = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { q1: 60, q2: -70, damp: false, t: 1 };
  let run;
  const energy = (x) => { const { M } = labDyn(x, [0, 0], 0, 0), { l1, m1, m2, lc1, lc2, g } = LAB; const T = 0.5 * (M[0][0] * x[2] ** 2 + 2 * M[0][1] * x[2] * x[3] + M[1][1] * x[3] ** 2); const V = m1 * g * lc1 * Math.sin(x[0]) + m2 * g * (l1 * Math.sin(x[0]) + lc2 * Math.sin(x[0] + x[1])); return [T, V]; };
  const sim = () => {
    let x = [s.q1 * D2R, s.q2 * D2R, 0, 0]; const dt = 0.002, out = []; const b = s.damp ? LAB.b : 0;
    const acc = (y) => { const { M, c, G } = labDyn(y, [y[2], y[3]], 0, b); return solve2(M, [-c[0] - G[0], -c[1] - G[1]]); };
    for (let i = 0; i <= 5 / dt; i++) { const [T, V] = energy(x); out.push({ t: i * dt, x: x.slice(), T, V }); x = rk4arm(x, i * dt, dt, acc); }
    run = out;
  };
  const p = new Plot(body, { aspect: 0.7, maxH: 340, x: [-2, 2], y: [-1.9, 1.9], equal: true, label: 'The arm released from rest under gravity' });
  const q = new Plot(body, { aspect: 0.42, maxH: 210, x: [0, 5], y: [-20, 30], label: 'Kinetic, potential and total energy' });
  p.draw = (P) => {
    P.axes(); ground(P);
    const k = Math.round(s.t / 0.002), d = run[k];
    for (let j = Math.max(0, k - 150); j < k; j += 6) { const tip = fkN(run[j].x.slice(0, 2), [1, 0.8])[2]; P.dot(tip[0], tip[1], 'rgba(198,255,26,.3)', 2); }
    drawArm(P, fkN(d.x.slice(0, 2), [1, 0.8]), C.lime);
  };
  q.draw = (P) => {
    const E = run.map((d) => d.T + d.V), lo = Math.min(...run.map((d) => d.V), ...E) - 2, hi = Math.max(...run.map((d) => d.T), ...E) + 2;
    P.setRange([0, 5], [lo, hi]); P.axes({ xl: 't (s)', yl: 'energy (J)' });
    const pk = (f) => run.filter((_, i) => i % 5 === 0).map(f), ts = pk((d) => d.t);
    P.line(ts, pk((d) => d.T), C.signal, 1.8); P.line(ts, pk((d) => d.V), C.warn, 1.8); P.line(ts, pk((d) => d.T + d.V), C.lime, 2.5); P.line([s.t, s.t], [lo, hi], C.bone, 1, [3, 3]);
  };
  const redraw = (re) => {
    if (re) sim(); p.redraw(); q.redraw();
    const E = run.map((d) => d.T + d.V), drift = Math.max(...E.map((e) => Math.abs(e - E[0])));
    read.innerHTML = `released from (${s.q1}°, ${s.q2}°), no motor torque · ${sp(C.signal, 'kinetic')} + ${sp(C.warn, 'potential')} = ${sp(C.lime, 'total')} · ${s.damp ? `lab damping b = 0.6: total falls from ${E[0].toFixed(2)} to ${E.at(-1).toFixed(2)} J` : `no damping: total ${E[0].toFixed(3)} J, largest drift over 5 s ${drift.toExponential(1)} J (RK4 at 2 ms)`}`;
  };
  ctrls.append(slider('Time', { min: 0, max: 5, step: 0.01, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; redraw(false); }),
    slider('Start q1', { min: -90, max: 180, step: 5, value: s.q1, fmt: (v) => v + '°' }, (v) => { s.q1 = v; redraw(true); }),
    slider('Start q2', { min: -170, max: 170, step: 5, value: s.q2, fmt: (v) => v + '°' }, (v) => { s.q2 = v; redraw(true); }),
    toggle('Joint damping (lab b = 0.6)', s.damp, (v) => { s.damp = v; redraw(true); }, { id: 'fall-damp' }));
  redraw(true);
};

// ---- p15-l14: computed torque vs PD + gravity ----
W.ctc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { c: 'ctc', wn: 10, pay: 0 };
  const ref = (t) => { const q0 = [60 * D2R, -70 * D2R], A = [30 * D2R, 40 * D2R], w = [1.5, 2]; return [q0.map((v, i) => v + A[i] * Math.sin(w[i] * t)), A.map((a, i) => a * w[i] * Math.cos(w[i] * t)), A.map((a, i) => -a * w[i] * w[i] * Math.sin(w[i] * t))]; };
  const ctrl = (x, t) => {
    const q = [x[0], x[1]], qd = [x[2], x[3]], [qr, vr, ar] = ref(t), e = [qr[0] - q[0], qr[1] - q[1]], ed = [vr[0] - qd[0], vr[1] - qd[1]];
    if (s.c === 'ctc') { const { M, c, G } = labDyn(q, qd, 0); const v = [0, 1].map((i) => ar[i] + 2 * s.wn * ed[i] + s.wn ** 2 * e[i]); return [M[0][0] * v[0] + M[0][1] * v[1] + c[0] + G[0], M[1][0] * v[0] + M[1][1] * v[1] + c[1] + G[1]]; }
    const { G } = labDyn(q, qd, 0); return [140 * e[0] + 30 * ed[0] + G[0], 90 * e[1] + 16 * ed[1] + G[1]];
  };
  let run;
  const sim = () => {
    const [q0, v0] = ref(0); let x = [q0[0] - 5 * D2R, q0[1] + 5 * D2R, v0[0], v0[1]]; const dt = 0.002, out = [];
    const acc = (y, t) => { const tau = ctrl(y, t), { M, c, G } = labDyn([y[0], y[1]], [y[2], y[3]], s.pay); return solve2(M, [tau[0] - c[0] - G[0], tau[1] - c[1] - G[1]]); };
    for (let i = 0; i <= 4 / dt; i++) { const t = i * dt, [qr] = ref(t), tau = ctrl(x, t); out.push({ t, e: [deg(qr[0] - x[0]), deg(qr[1] - x[1])], tau }); x = rk4arm(x, t, dt, acc); }
    run = out;
  };
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 4], y: [-6, 6], label: 'Joint tracking errors over time' });
  const q = new Plot(body, { aspect: 0.4, maxH: 210, x: [0, 4], y: [-50, 50], label: 'Joint torques over time' });
  p.draw = (P) => {
    const m = Math.max(1, ...run.map((d) => Math.max(Math.abs(d.e[0]), Math.abs(d.e[1])))) * 1.1; P.setRange([0, 4], [-m, m]); P.axes({ xl: 't (s)', yl: 'error (°)' });
    const pk = (f) => run.filter((_, i) => i % 4 === 0).map(f);
    if (s.c === 'ctc' && s.pay === 0) P.fn((t) => 5 * (1 + s.wn * t) * Math.exp(-s.wn * t), C.dim, 1.2, [4, 4]);
    P.line(pk((d) => d.t), pk((d) => d.e[0]), C.warn, 2.2); P.line(pk((d) => d.t), pk((d) => d.e[1]), C.signal, 2.2);
  };
  q.draw = (P) => {
    P.axes({ xl: 't (s)', yl: 'τ (N·m)' }); P.line([0, 4], [45, 45], C.bad, 1, [3, 3]); P.line([0, 4], [-45, -45], C.bad, 1, [3, 3]);
    const pk = (f) => run.filter((_, i) => i % 4 === 0).map(f);
    P.line(pk((d) => d.t), pk((d) => clamp(d.tau[0], -50, 50)), C.warn, 1.8); P.line(pk((d) => d.t), pk((d) => clamp(d.tau[1], -50, 50)), C.signal, 1.8);
  };
  const redraw = () => {
    sim(); p.redraw(); q.redraw();
    const late = run.filter((d) => d.t >= 2), mx = Math.max(...late.map((d) => Math.max(Math.abs(d.e[0]), Math.abs(d.e[1])))), pk = [0, 1].map((i) => Math.max(...run.map((d) => Math.abs(d.tau[i]))));
    read.innerHTML = `${s.c === 'ctc' ? `computed torque, ωn = ${s.wn} rad/s${s.pay ? '' : ' (dashed: theory 5°(1 + ωn t)e^(−ωn t))'}` : 'lab PD + gravity compensation'} · ${sp(C.warn, 'shoulder')} and ${sp(C.signal, 'elbow')} errors · after 2 s: up to ${mx < 0.01 ? ok(mx.toExponential(1) + '°') : bad(mx.toFixed(2) + '°')} · peak torques (${pk[0].toFixed(1)}, ${pk[1].toFixed(1)}) N·m${s.pay ? ` · ${s.pay} kg payload the controller doesn't know about` : ''}`;
  };
  ctrls.append(select('Controller', [['ctc', 'Computed torque'], ['pd', 'Lab PD + gravity']], s.c, (v) => { s.c = v; redraw(); }, 'ctc-mode'),
    slider('Error bandwidth ωn', { min: 2, max: 25, step: 1, value: s.wn, fmt: (v) => v + ' rad/s' }, (v) => { s.wn = v; redraw(); }),
    slider('Unmodelled payload', { min: 0, max: 1, step: 0.1, value: s.pay, fmt: (v) => v.toFixed(1) + ' kg' }, (v) => { s.pay = v; redraw(); }));
  redraw();
};

// ---- p15-l15: Cartesian impedance ----
W.impedance = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kx: 300, ky: 800, F: 10, dir: 0 };
  let run;
  const sim = () => {
    const q0 = [60 * D2R, -70 * D2R], xd = fkN(q0, [1, 0.8])[2], K = [s.kx, s.ky], Dm = [2 * Math.sqrt(s.kx * 2), 2 * Math.sqrt(s.ky * 2)];
    const Fx = s.F * Math.cos(s.dir * D2R), Fy = s.F * Math.sin(s.dir * D2R), dt = 0.001, out = [];
    let x = [q0[0], q0[1], 0, 0];
    const acc = (y, t) => {
      const q = [y[0], y[1]], qd = [y[2], y[3]], J = jacN(q, [1, 0.8]), tip = fkN(q, [1, 0.8])[2], v = [J[0][0] * qd[0] + J[0][1] * qd[1], J[1][0] * qd[0] + J[1][1] * qd[1]];
      const push = t >= 0.5 && t < 2.5 ? [Fx, Fy] : [0, 0], Fc = [K[0] * (xd[0] - tip[0]) - Dm[0] * v[0] + push[0], K[1] * (xd[1] - tip[1]) - Dm[1] * v[1] + push[1]];
      const { M, c, G } = labDyn(q, qd, 0), tau = [J[0][0] * Fc[0] + J[1][0] * Fc[1] + G[0], J[0][1] * Fc[0] + J[1][1] * Fc[1] + G[1]];
      return solve2(M, [tau[0] - c[0] - G[0], tau[1] - c[1] - G[1]]);
    };
    for (let i = 0; i <= 4 / dt; i++) { const tip = fkN([x[0], x[1]], [1, 0.8])[2]; if (i % 4 === 0) out.push({ t: i * dt, d: [(tip[0] - xd[0]) * 1000, (tip[1] - xd[1]) * 1000] }); x = rk4arm(x, i * dt, dt, acc); }
    run = { out, Fx, Fy };
  };
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 4], y: [-40, 40], label: 'Tool deflection over time during a push' });
  const q = new Plot(body, { aspect: 0.7, maxH: 300, x: [-50, 50], y: [-40, 40], equal: true, label: 'Tool deflection in the plane with the push direction' });
  p.draw = (P) => {
    const m = Math.max(5, ...run.out.map((o) => Math.max(Math.abs(o.d[0]), Math.abs(o.d[1])))) * 1.15; P.setRange([0, 4], [-m, m]); P.axes({ xl: 't (s)', yl: 'deflection (mm)' });
    P.line(run.out.map((o) => o.t), run.out.map((o) => o.d[0]), C.warn, 2.2); P.line(run.out.map((o) => o.t), run.out.map((o) => o.d[1]), C.signal, 2.2);
  };
  q.draw = (P) => {
    const m = Math.max(5, ...run.out.map((o) => Math.hypot(...o.d))) * 1.3; P.setRange([-m, m], [-m * 0.8, m * 0.8]); P.axes({ xl: 'x (mm)', yl: 'y (mm)' });
    P.line(run.out.map((o) => o.d[0]), run.out.map((o) => o.d[1]), C.lime, 2.2);
    if (s.F > 0) { const u = [run.Fx / s.F, run.Fy / s.F]; P.arrow(0, 0, u[0] * m * 0.6, u[1] * m * 0.6, C.bone, 1.5); }
    P.dot(0, 0, C.bone, 4);
  };
  const redraw = () => {
    sim(); p.redraw(); q.redraw();
    const held = run.out.find((o) => o.t >= 2.4).d, ex = [run.Fx / s.kx * 1000, run.Fy / s.ky * 1000], F2 = s.F * s.F, dot = (run.Fx * held[0] + run.Fy * held[1]) / 1000;
    read.innerHTML = `push ${s.F} N at ${s.dir}° from 0.5 to 2.5 s · held deflection ${sp(C.warn, `x ${held[0].toFixed(2)}`)}, ${sp(C.signal, `y ${held[1].toFixed(2)}`)} mm against K⁻¹F = (${ex[0].toFixed(2)}, ${ex[1].toFixed(2)}) mm · stiffness along the push ${s.F ? (F2 / dot).toFixed(0) + ' N/m' : '—'} · damping set for about critical with 2 kg apparent mass`;
  };
  ctrls.append(slider('Stiffness Kx', { min: 50, max: 1500, step: 50, value: s.kx, fmt: (v) => v + ' N/m' }, (v) => { s.kx = v; redraw(); }),
    slider('Stiffness Ky', { min: 50, max: 1500, step: 50, value: s.ky, fmt: (v) => v + ' N/m' }, (v) => { s.ky = v; redraw(); }),
    slider('Push force', { min: 0, max: 20, step: 1, value: s.F, fmt: (v) => v + ' N' }, (v) => { s.F = v; redraw(); }),
    slider('Push direction', { min: -180, max: 180, step: 15, value: s.dir, fmt: (v) => v + '°' }, (v) => { s.dir = v; redraw(); }));
  redraw();
};

// ---- p15-l16: differential drive ----
W.diffdrive = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { wl: 8, wr: 12, err: 0 };
  const r = 0.05, b = 0.3;
  const p = new Plot(body, { aspect: 0.85, maxH: 420, x: [-2, 2], y: [-1, 2.4], equal: true, label: 'A differential-drive robot driving for 10 seconds' });
  p.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'y (m)' });
    const v = r * (s.wr + s.wl) / 2, w = r * (s.wr - s.wl) / b, wo = r * (s.wr - s.wl) / (b * (1 + s.err / 100));
    const path = (om) => { const xs = [0], ys = [0]; let x = 0, y = 0, th = Math.PI / 2; const dt = 0.01; for (let i = 0; i < 1000; i++) { x += v * Math.cos(th) * dt; y += v * Math.sin(th) * dt; th += om * dt; xs.push(x); ys.push(y); } return { xs, ys, th, x, y }; };
    const tr = path(w); P.line(tr.xs, tr.ys, C.lime, 2.5);
    if (s.err) { const od = path(wo); P.line(od.xs, od.ys, C.warn, 1.8, [6, 4]); }
    if (Math.abs(w) > 1e-6) { const R = v / w; P.text('+', -R - 0.04, 0.02, C.signal); P.dot(-R, 0, C.signal, 3); }
    const th = tr.th, cx = tr.x, cy = tr.y, c = Math.cos(th), sn = Math.sin(th), body2 = [[0.12, 0.15], [-0.12, 0.15], [-0.12, -0.15], [0.12, -0.15]].map(([a, d]) => [cx + a * c - d * sn, cy + a * sn + d * c]);
    P.poly(body2, 'rgba(198,255,26,.25)', C.lime); P.arrow(cx, cy, cx + 0.22 * c, cy + 0.22 * sn, C.bone, 2);
    const R = Math.abs(w) > 1e-6 ? v / w : Infinity;
    read.innerHTML = `wheels L ${s.wl}, R ${s.wr} rad/s (r = 0.05 m, track 0.30 m) · v = ${v.toFixed(3)} m/s, ω = ${w.toFixed(3)} rad/s · ${Number.isFinite(R) ? `turning radius ${Math.abs(R).toFixed(3)} m about the ${sp(C.signal, 'ICR')}` : 'straight line'}${s.wl === -s.wr && s.wl ? ' · spinning on the spot' : ''}${s.err ? ` · ${sp(C.warn, `odometry with a ${s.err} % track error`)} ends ${Math.hypot(path(wo).x - cx, path(wo).y - cy).toFixed(3)} m away after 10 s` : ''}`;
  };
  ctrls.append(slider('Left wheel', { min: -15, max: 15, step: 0.5, value: s.wl, fmt: (v) => v + ' rad/s' }, (v) => { s.wl = v; p.redraw(); }),
    slider('Right wheel', { min: -15, max: 15, step: 0.5, value: s.wr, fmt: (v) => v + ' rad/s' }, (v) => { s.wr = v; p.redraw(); }),
    slider('Odometry track error', { min: 0, max: 5, step: 0.5, value: s.err, fmt: (v) => v + ' %' }, (v) => { s.err = v; p.redraw(); }));
  p.redraw();
};

// ---- p15-l17: crawl gait ----
W.crawlgait = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: 0.3, duty: 0.85, sway: true };
  const HIPS = { LF: [0.3, 0.2], RF: [0.3, -0.2], LH: [-0.3, 0.2], RH: [-0.3, -0.2] }, ORDER = ['LH', 'LF', 'RH', 'RF'], CYC = 2, STEP = 0.2;
  const win = (leg) => { const k = ORDER.indexOf(leg); return [k / 4, k / 4 + 1 - s.duty]; };
  const feet = (t) => { const ph = ((t / CYC) % 1 + 1) % 1, out = {}; for (const [leg, [hx, hy]] of Object.entries(HIPS)) { const [a, b2] = win(leg); const down = CYC * (Math.floor(t / CYC - b2) + b2); if (ph >= a && ph < b2) { const lift = down + CYC * s.duty, f = (ph - a) / (b2 - a); out[leg] = { p: [hx + STEP * lift / CYC - s.duty / 2 * STEP + f * STEP, hy], swing: true }; } else out[leg] = { p: [hx + STEP * down / CYC + s.duty / 2 * STEP, hy], swing: false }; } return out; };
  const swayP = (ph) => { const a = 1 - s.duty; if (s.duty <= 0.75 + 1e-9) return ph < 0.5 ? -1 : 1; if (ph < 0.25 + a) return -1; if (ph < 0.5) return -1 + 2 * (ph - 0.25 - a) / (0.25 - a); if (ph < 0.75 + a) return 1; return 1 - 2 * (ph - 0.75 - a) / (0.25 - a); };
  const com = (t) => [STEP * t / CYC, s.sway ? 0.04 * swayP(((t / CYC) % 1 + 1) % 1) : 0];
  const hull = (pts) => { pts = pts.slice().sort((a, b2) => a[0] - b2[0] || a[1] - b2[1]); const cr = (o, a, b2) => (a[0] - o[0]) * (b2[1] - o[1]) - (a[1] - o[1]) * (b2[0] - o[0]); const lo = [], up = []; for (const q of pts) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); } for (const q of pts.slice().reverse()) { while (up.length >= 2 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
  const margin = (c, poly) => Math.min(...poly.map((a, i) => { const b2 = poly[(i + 1) % poly.length], e = [b2[0] - a[0], b2[1] - a[1]], n = Math.hypot(...e); return (-e[1] * (c[0] - a[0]) + e[0] * (c[1] - a[1])) / n; }));
  const marginAt = (t) => { const f = feet(t), st = Object.values(f).filter((x) => !x.swing).map((x) => x.p); return margin(com(t), hull(st)); };
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [-0.6, 0.8], y: [-0.4, 0.4], equal: true, label: 'A quadruped crawl gait seen from above with its support polygon' });
  const q = new Plot(body, { aspect: 0.36, maxH: 190, x: [0, 2], y: [-0.05, 0.12], label: 'Stability margin over one gait cycle' });
  p.draw = (P) => {
    const T = 2 + s.t, c = com(T), f = feet(T), st = Object.values(f).filter((x) => !x.swing).map((x) => x.p), poly = hull(st), sh = [-c[0], 0];
    const tr = (pt) => [pt[0] + sh[0], pt[1]];
    P.axes({ xl: 'forward (m)', yl: 'left (m)' });
    P.poly(poly.map(tr), 'rgba(198,255,26,.16)', C.lime);
    P.poly([[0.36, 0.22], [-0.36, 0.22], [-0.36, -0.22], [0.36, -0.22]].map(([x, y]) => [x + c[0] + sh[0], y + c[1]]), null, C.fog);
    for (const [leg, [hx, hy]] of Object.entries(HIPS)) { const hp = tr([hx + c[0], hy + c[1]]), fp = tr(f[leg].p); P.line([hp[0], fp[0]], [hp[1], fp[1]], C.dim, 2); if (f[leg].swing) { P.dot(fp[0], fp[1], C.bg, 7); P.ctx.strokeStyle = C.warn; P.ctx.lineWidth = 2; P.ctx.beginPath(); P.ctx.arc(P.sx(fp[0]), P.sy(fp[1]), 7, 0, 7); P.ctx.stroke(); } else P.dot(fp[0], fp[1], C.lime, 6); P.text(leg, fp[0] + 0.03, fp[1] + 0.03, C.dim); }
    const cc = tr(c); P.dot(cc[0], cc[1], C.bone, 6);
  };
  q.draw = (P) => {
    P.axes({ xl: 'time in cycle (s)', yl: 'margin (m)' }); P.line([0, 2], [0, 0], C.bad, 1, [4, 4]);
    const ts = [], ms = []; for (let i = 0; i <= 400; i++) { const t = i * 0.005; ts.push(t); ms.push(marginAt(2 + t)); }
    P.line(ts, ms, C.lime, 2.2); P.line([s.t, s.t], [-0.05, 0.12], C.warn, 1, [3, 3]);
  };
  const redraw = () => {
    p.redraw(); q.redraw();
    let worst = Infinity; for (let i = 0; i <= 1000; i++) worst = Math.min(worst, marginAt(2 + i * 0.002));
    const f = feet(2 + s.t), sw = Object.entries(f).filter(([, x]) => x.swing).map(([k]) => k);
    read.innerHTML = `t = ${s.t.toFixed(2)} s · ${sw.length ? sp(C.warn, sw.join(', ') + ' swinging') : 'all four feet down'} · margin now ${(marginAt(2 + s.t) * 1000).toFixed(1)} mm · worst over the cycle ${worst > 1e-6 ? ok((worst * 1000).toFixed(1) + ' mm') : bad((worst * 1000).toFixed(1) + ' mm')} · duty factor ${s.duty}, ${s.sway ? '4 cm body sway' : 'no sway'} · generic quadruped, 0.1 m/s`;
  };
  ctrls.append(slider('Time in cycle', { min: 0, max: 1.995, step: 0.005, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; redraw(); }),
    select('Duty factor', [['0.75', '0.75'], ['0.8', '0.80'], ['0.85', '0.85'], ['0.9', '0.90']], String(s.duty), (v) => { s.duty = +v; redraw(); }, 'gait-duty'),
    toggle('Body sway', s.sway, (v) => { s.sway = v; redraw(); }, { id: 'gait-sway' }));
  redraw();
};

// ---- p15-l18: contact forces of a standing quadruped ----
W.contactforces = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { slope: 10, mu: 0.6, stance: 'four' };
  const MASS = 50, G = 9.81;
  const solveF = () => {
    // per side view: front and hind pairs. Friction-proportional distribution (lesson 18): tangential = tan(slope) times normal.
    const a = s.slope * D2R, N = MASS * G * Math.cos(a), Tt = MASS * G * Math.sin(a), k = Math.tan(a), hgt = 0.5, xf = 0.35;
    // moment about the CoM (pitch): front normal Nf, hind Nh with Nf + Nh = N; Nf xf - Nh xf + (tangential forces at depth hgt) = 0
    // tangential forces act uphill (+x) at the feet 0.5 m below the CoM: their moment about y is -hgt * Tt... sign handled so uphill feet unload
    const Nf = N / 2 - Tt * hgt / (2 * xf), Nh = N - Nf;
    if (s.stance === 'four') return { feet: [{ n: 'front pair', x: xf, N: Nf, T: k * Nf, legs: 2 }, { n: 'hind pair', x: -xf, N: Nh, T: k * Nh, legs: 2 }], N, Tt };
    // right hind lifted: roll balance about x gives N_LF + N_LH = N_RF, so N_RF = N/2 and N_LF = Nf - N/2
    const NRF = N / 2, NLF = Nf - N / 2;
    return { feet: [{ n: 'LF', x: xf + 0.04, N: NLF, T: k * NLF, legs: 1 }, { n: 'RF', x: xf - 0.04, N: NRF, T: k * NRF, legs: 1 }, { n: 'LH', x: -xf, N: Nh, T: k * Nh, legs: 1 }], N, Tt };
  };
  const p = new Plot(body, { aspect: 0.7, maxH: 340, x: [-0.9, 0.9], y: [-0.25, 1.0], equal: true, label: 'A standing quadruped from the side with contact forces and friction cones' });
  p.draw = (P) => {
    P.axes(); const a = s.slope * D2R, c = Math.cos(a), sn = Math.sin(a), R = (x, y) => [x * c - y * sn, x * sn + y * c];
    const g0 = R(-0.9, 0), g1 = R(0.9, 0); P.line([g0[0], g1[0]], [g0[1], g1[1]], C.dim, 3);
    const r = solveF(), cm = R(0, 0.5);
    P.poly([[-0.38, 0.45], [0.38, 0.45], [0.38, 0.6], [-0.38, 0.6]].map(([x, y]) => R(x, y)), 'rgba(236,238,230,.12)', C.fog);
    r.feet.forEach((f) => {
      const ft = R(f.x, 0), hp = R(f.x, 0.45); P.line([ft[0], hp[0]], [ft[1], hp[1]], C.bone, 3);
      const sc = 0.0025, per = f.legs, fn = f.N / per, tt = f.T / per;
      [-1, 1].forEach((sg) => { const e = R(f.x + sg * s.mu * 0.25, 0.25); P.line([ft[0], e[0]], [ft[1], e[1]], C.rule2, 1.5, [4, 3]); });
      const tip = R(f.x + tt * sc, fn * sc), slip = tt > s.mu * Math.abs(fn) + 1e-9 || fn < -1e-6;
      P.arrow(ft[0], ft[1], tip[0], tip[1], slip ? C.bad : C.lime, 3);
    });
    P.dot(cm[0], cm[1], C.warn, 6); P.arrow(cm[0], cm[1], cm[0], cm[1] - 0.25, C.warn, 2);
  };
  const redraw = () => {
    p.redraw();
    const r = solveF(), ratio = Math.tan(s.slope * D2R), slip = ratio > s.mu, tip = r.feet.some((f) => f.N < -1e-6);
    const per = r.feet.map((f) => `${f.n}: ${f2(f.N / f.legs, 1)} N normal, ${f2(f.T / f.legs, 1)} N tangential${f.legs > 1 ? ' per foot' : ''}`).join(' · ');
    read.innerHTML = `50 kg on a ${s.slope}° slope · ${per} · tangential/normal ${ratio.toFixed(3)} against μ = ${s.mu} · ${tip ? bad('the uphill feet would need to pull: it tips over') : slip ? bad('outside the friction cone: it slips') : ok('inside every friction cone: it stands')} · ${s.stance === 'four' ? 'four feet: statically indeterminate, friction-optimal choice' : 'right hind lifted: the centre of mass sits on the RF to LH diagonal, so the margin is zero'}`;
  };
  ctrls.append(slider('Ground slope', { min: 0, max: 40, step: 1, value: s.slope, fmt: (v) => v + '°' }, (v) => { s.slope = v; redraw(); }),
    select('Friction μ', [['0.3', '0.3 (wet rock)'], ['0.6', '0.6 (grass)'], ['0.9', '0.9 (rubber on dry rock)']], String(s.mu), (v) => { s.mu = +v; redraw(); }, 'cf-mu'),
    select('Stance', [['four', 'Four feet'], ['three', 'Right hind lifted']], s.stance, (v) => { s.stance = v; redraw(); }, 'cf-stance'));
  redraw();
};

export default W;
