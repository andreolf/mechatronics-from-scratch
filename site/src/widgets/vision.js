// Widgets for Phase 17 (vision, localisation and SLAM). Sliders, selects, toggles and buttons only, plus optional drag handles.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';
import { button } from '../ui.js';

const W = {};
const D2R = Math.PI / 180;
const sp = (c, s) => `<span style="color:${c}">${s}</span>`;
const ok = (s) => `<b style="color:${C.lime}">${s}</b>`, bad = (s) => `<b style="color:${C.bad}">${s}</b>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const gauss = (r) => () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
const wrapA = (d) => { let r = (d + Math.PI) % (2 * Math.PI); if (r < 0) r += 2 * Math.PI; return r - Math.PI; };
const twoUp = (body, n = 2) => { const g = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px' }); body.append(g); const out = []; for (let i = 0; i < n; i++) { const d = h('div'); g.append(d); out.push(d); } return out; };
const setSlider = (lbl, v) => { const i = lbl.querySelector('input'); i.value = v; i.dispatchEvent(new Event('input')); };
function solveLin(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-300) continue; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / r[i]); }
// eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations: returns { vals, vecs (columns) }
function jacobiEig(S) {
  const n = S.length, A = S.map((r) => [...r]), V = A.map((_, i) => A.map((__, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j]; if (off < 1e-26) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue; const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; }
    }
  }
  return { vals: A.map((r, i) => r[i]), vecs: V };
}
const nullVec = (rows) => { const n = rows[0].length, S = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => rows.reduce((a, r) => a + r[i] * r[j], 0))); const { vals, vecs } = jacobiEig(S); let k = 0; vals.forEach((v, i) => { if (v < vals[k]) k = i; }); return vecs.map((r) => r[k]); };
// homography from >= 4 point pairs with Hartley normalisation
function homog(src, dst) {
  const nrm = (p) => { const mx = p.reduce((a, q) => a + q[0], 0) / p.length, my = p.reduce((a, q) => a + q[1], 0) / p.length; const d = p.reduce((a, q) => a + Math.hypot(q[0] - mx, q[1] - my), 0) / p.length || 1; const s = Math.SQRT2 / d; return [s, -s * mx, -s * my]; };
  const [ss, sxo, syo] = nrm(src), [ds, dxo, dyo] = nrm(dst), rows = [];
  src.forEach((p, i) => { const x = ss * p[0] + sxo, y = ss * p[1] + syo, u = ds * dst[i][0] + dxo, v = ds * dst[i][1] + dyo; rows.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]); });
  const hn = nullVec(rows), Hn = [[hn[0], hn[1], hn[2]], [hn[3], hn[4], hn[5]], [hn[6], hn[7], hn[8]]];
  const Ts = [[ss, 0, sxo], [0, ss, syo], [0, 0, 1]], Tdi = [[1 / ds, 0, -dxo / ds], [0, 1 / ds, -dyo / ds], [0, 0, 1]];
  const H = mm(Tdi, mm(Hn, Ts)), k = H[2][2]; return H.map((r) => r.map((v) => v / k));
}
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((a, v, k) => a + v * B[k][j], 0)));
const mv = (A, v) => A.map((r) => r.reduce((a, x, k) => a + x * v[k], 0));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const happly = (H, x, y) => { const w = H[2][0] * x + H[2][1] * y + H[2][2]; return [(H[0][0] * x + H[0][1] * y + H[0][2]) / w, (H[1][0] * x + H[1][1] * y + H[1][2]) / w]; };
function rodr(r) { const th = Math.hypot(r[0], r[1], r[2]); if (th < 1e-12) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const [x, y, z] = r.map((v) => v / th), c = Math.cos(th), s = Math.sin(th), C1 = 1 - c; return [[c + x * x * C1, x * y * C1 - z * s, x * z * C1 + y * s], [y * x * C1 + z * s, c + y * y * C1, y * z * C1 - x * s], [z * x * C1 - y * s, z * y * C1 + x * s, c + z * z * C1]]; }
const rotAngle = (A, B) => { const R = mm(tr(A), B); return Math.acos(clamp((R[0][0] + R[1][1] + R[2][2] - 1) / 2, -1, 1)) / D2R; };
// draw a grey or RGB image (values 0..255) into world rectangle [x0, x1] x [y0, y1], pixel row 0 at the top
function drawImg(P, w, hgt, px, x0, y0, x1, y1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt; const g = cv.getContext('2d'), id = g.createImageData(w, hgt);
  for (let i = 0; i < w * hgt; i++) { const [r, gg, b] = px(i); id.data[4 * i] = r; id.data[4 * i + 1] = gg; id.data[4 * i + 2] = b; id.data[4 * i + 3] = 255; }
  g.putImageData(id, 0, 0); const c = P.ctx; c.imageSmoothingEnabled = false;
  c.drawImage(cv, P.sx(x0), P.sy(y1), P.sx(x1) - P.sx(x0), P.sy(y0) - P.sy(y1));
}
const heat = (t) => { t = clamp(t, 0, 1); return [Math.round(255 * clamp(1.5 * t, 0, 1)), Math.round(255 * clamp(1.5 * t - 0.5, 0, 1)), Math.round(255 * clamp(3 * t - 2, 0, 1) * 0.6 + 40 * (1 - t))]; };
// 2-sigma ellipse of a 2 x 2 covariance
function ellipse(P, cx, cy, S, color, k = 2) {
  const a = S[0][0], b = S[0][1], d = S[1][1], tt = (a + d) / 2, q = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b)), l1 = tt + q, l2 = Math.max(tt - q, 0), ang = 0.5 * Math.atan2(2 * b, a - d), xs = [], ys = [];
  for (let i = 0; i <= 48; i++) { const t = 2 * Math.PI * i / 48, u = k * Math.sqrt(l1) * Math.cos(t), v = k * Math.sqrt(l2) * Math.sin(t); xs.push(cx + u * Math.cos(ang) - v * Math.sin(ang)); ys.push(cy + u * Math.sin(ang) + v * Math.cos(ang)); }
  P.line(xs, ys, color, 1.6);
}
const robotGlyph = (P, x, y, th, color, r = 0.18) => { P.poly([[x + r * Math.cos(th), y + r * Math.sin(th)], [x + r * 0.6 * Math.cos(th + 2.4), y + r * 0.6 * Math.sin(th + 2.4)], [x + r * 0.6 * Math.cos(th - 2.4), y + r * 0.6 * Math.sin(th - 2.4)]], color, null); };

// ---- p17-l01: pixel inspector ----
const IW = 160, IH = 120;
let SYN = null;
function synImage() {
  if (SYN) return SYN; const a = new Uint8Array(IW * IH * 3);
  for (let r = 0; r < IH; r++) for (let c = 0; c < IW; c++) {
    let px = [0, Math.round(120 * r / (IH - 1)), Math.round(255 - 135 * r / (IH - 1))];
    if ((r - 60) ** 2 + (c - 50) ** 2 <= 625) px = [220, 40, 30]; if (r >= 70 && r < 105 && c >= 100 && c < 140) px = [40, 200, 60];
    a.set(px, 3 * (r * IW + c));
  }
  return (SYN = a);
}
function hsv8(r, g, b) { const v = Math.max(r, g, b), m = Math.min(r, g, b), d = v - m, s = v ? Math.round(255 * d / v) : 0; let hh = 0; if (d) { if (v === r) hh = 60 * (g - b) / d; else if (v === g) hh = 120 + 60 * (b - r) / d; else hh = 240 + 60 * (r - g) / d; } if (hh < 0) hh += 360; return [Math.round(hh / 2) % 180, s, v]; }
W.pixelinspect = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { r: 60, c: 50, view: 'rgb' }, img = synImage();
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [0, IW], y: [0, IH], equal: true, label: 'Synthetic image with the inspected pixel' });
  const at = (i) => [img[3 * i], img[3 * i + 1], img[3 * i + 2]];
  const gray = (q) => Math.round(0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2]);
  p.draw = (P) => {
    const f = { rgb: (q) => q, gray: (q) => { const g = gray(q); return [g, g, g]; }, R: (q) => [q[0], 0, 0], G: (q) => [0, q[1], 0], B: (q) => [0, 0, q[2]], H: (q) => { const v = Math.round(hsv8(...q)[0] * 255 / 179); return [v, v, v]; } }[s.view];
    drawImg(P, IW, IH, (i) => f(at(i)), 0, 0, IW, IH);
    const y = IH - s.r - 0.5, x = s.c + 0.5; P.line([0, IW], [y, y], C.lime, 1, [3, 3]); P.line([x, x], [0, IH], C.lime, 1, [3, 3]);
    P.poly([[s.c, IH - s.r], [s.c + 1, IH - s.r], [s.c + 1, IH - s.r - 1], [s.c, IH - s.r - 1]], null, C.lime);
  };
  const redraw = () => {
    p.redraw(); const q = at(s.r * IW + s.c), hv = hsv8(...q);
    read.innerHTML = `img[${s.r}, ${s.c}] (row, column) · RGB ${sp(C.bad, q[0])}, ${sp(C.lime, q[1])}, ${sp(C.signal, q[2])} · grey ${gray(q)} · HSV (OpenCV 8-bit) ${hv.join(', ')}, hue ${hv[0] * 2}° · offset in memory ${3 * (s.r * IW + s.c)} bytes`;
  };
  ctrls.append(slider('Row', { min: 0, max: IH - 1, step: 1, value: s.r }, (v) => { s.r = v; redraw(); }),
    slider('Column', { min: 0, max: IW - 1, step: 1, value: s.c }, (v) => { s.c = v; redraw(); }),
    select('Show', [['rgb', 'colour (RGB)'], ['gray', 'grey (BT.601)'], ['R', 'red channel'], ['G', 'green channel'], ['B', 'blue channel'], ['H', 'hue']], s.view, (v) => { s.view = v; redraw(); }, 'px-view'));
  redraw();
};

// ---- p17-l02: pinhole camera, top view and image ----
W.pinhole = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { f: 800, z: 2.5, x: 0, yaw: 20 }, SZ = 0.4;
  const [a, b] = twoUp(body);
  const top = new Plot(a, { aspect: 0.9, maxH: 330, x: [-2.5, 2.5], y: [-0.3, 6.2], equal: true, label: 'Top view: camera, field of view and cube' });
  const im = new Plot(b, { aspect: 0.75, maxH: 330, x: [0, 640], y: [0, 480], equal: true, label: 'The image the camera sees (640 by 480 pixels)' });
  const cube = () => { const c = Math.cos(s.yaw * D2R), sn = Math.sin(s.yaw * D2R), out = []; for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) { const X = dx * SZ / 2, Z = dz * SZ / 2; out.push([s.x + c * X + sn * Z, dy * SZ / 2, s.z - sn * X + c * Z]); } return out; };
  const EDG = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  top.draw = (P) => {
    P.axes({ xl: 'x (m)', yl: 'z (m)' }); const hf = Math.atan(320 / s.f);
    P.poly([[0, 0], [6.5 * Math.tan(hf), 6.5], [-6.5 * Math.tan(hf), 6.5]], 'rgba(111,211,255,.08)', null);
    P.line([0, 6.5 * Math.tan(hf)], [0, 6.5], C.signal, 1.2, [4, 3]); P.line([0, -6.5 * Math.tan(hf)], [0, 6.5], C.signal, 1.2, [4, 3]);
    const q = cube(); for (const [i, j] of EDG) if (q[i][1] < 0 && q[j][1] < 0) P.line([q[i][0], q[j][0]], [q[i][2], q[j][2]], C.lime, 2);
    for (const v of q) if (v[1] < 0) P.line([0, v[0]], [0, v[2]], 'rgba(198,255,26,.18)', 1);
    P.dot(0, 0, C.bone, 5);
  };
  im.draw = (P) => {
    P.axes({}); P.poly([[0, 0], [640, 0], [640, 480], [0, 480]], null, C.rule2);
    const q = cube().map((v) => [s.f * v[0] / v[2] + 320, s.f * v[1] / v[2] + 240]);
    for (const [i, j] of EDG) P.line([q[i][0], q[j][0]], [480 - q[i][1], 480 - q[j][1]], C.lime, 2);
    P.dot(320, 240, C.dim, 3);
  };
  const redraw = () => {
    top.redraw(); im.redraw(); const fov = 2 * Math.atan(320 / s.f) / D2R, w = s.f * SZ / s.z;
    read.innerHTML = `horizontal field of view 2 atan(320 / f) = ${fov.toFixed(1)}° · a 0.4 m face at ${s.z.toFixed(2)} m is about f·0.4 / z = ${w.toFixed(0)} px wide · centre pixel u = ${(s.f * s.x / s.z + 320).toFixed(1)}`;
  };
  ctrls.append(slider('Focal length f', { min: 300, max: 1600, step: 10, value: s.f, fmt: (v) => v + ' px' }, (v) => { s.f = v; redraw(); }),
    slider('Distance z', { min: 0.8, max: 6, step: 0.05, value: s.z, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.z = v; redraw(); }),
    slider('Sideways x', { min: -1.5, max: 1.5, step: 0.05, value: s.x, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.x = v; redraw(); }),
    slider('Cube yaw', { min: -90, max: 90, step: 1, value: s.yaw, fmt: (v) => v + '°' }, (v) => { s.yaw = v; redraw(); }));
  redraw();
};

// ---- p17-l03: Zhang calibration from a growing set of views ----
const KT = { fx: 820, fy: 810, cx: 330, cy: 235 };
function calibData() {
  const r = rng(7), g = gauss(r), board = []; for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) board.push([i * 0.025, j * 0.025]);
  const views = []; for (let v = 0; v < 12; v++) { const R = rodr([(r() - 0.5), (r() - 0.5), (r() - 0.5)]), t = [-0.1 + (r() - 0.5) * 0.1, -0.06 + (r() - 0.5) * 0.1, 0.35 + r() * 0.25]; const n = board.map(() => [g(), g()]);
    const uv = board.map(([X, Y]) => { const p = [R[0][0] * X + R[0][1] * Y + t[0], R[1][0] * X + R[1][1] * Y + t[1], R[2][0] * X + R[2][1] * Y + t[2]]; return [KT.fx * p[0] / p[2] + KT.cx, KT.fy * p[1] / p[2] + KT.cy]; }); views.push({ uv, n }); }
  return { board, views };
}
function zhang(board, obs) {
  const vij = (H, i, j) => [H[0][i] * H[0][j], H[0][i] * H[1][j] + H[1][i] * H[0][j], H[1][i] * H[1][j], H[2][i] * H[0][j] + H[0][i] * H[2][j], H[2][i] * H[1][j] + H[1][i] * H[2][j], H[2][i] * H[2][j]];
  const rows = []; for (const uv of obs) { const H = homog(board, uv); rows.push(vij(H, 0, 1), vij(H, 0, 0).map((v, k) => v - vij(H, 1, 1)[k])); }
  const [B11, B12, B22, B13, B23, B33] = nullVec(rows);
  const v0 = (B12 * B13 - B11 * B23) / (B11 * B22 - B12 * B12), lam = B33 - (B13 * B13 + v0 * (B12 * B13 - B11 * B23)) / B11;
  const al = Math.sqrt(lam / B11), be = Math.sqrt(lam * B11 / (B11 * B22 - B12 * B12)), ga = -B12 * al * al * be / lam, u0 = ga * v0 / be - B13 * al * al / lam;
  return { fx: al, fy: be, cx: u0, cy: v0 };
}
W.calibviews = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 3, noise: 0.2 }, D = calibData();
  const p = new Plot(body, { aspect: 0.75, maxH: 340, x: [0, 640], y: [0, 480], equal: true, label: 'Detected checkerboard corners of the views used' });
  const obs = () => D.views.slice(0, s.n).map((v) => v.uv.map((q, k) => [q[0] + s.noise * v.n[k][0], q[1] + s.noise * v.n[k][1]]));
  const redraw = () => {
    const O = obs();
    p.draw = (P) => { P.axes({}); P.poly([[0, 0], [640, 0], [640, 480], [0, 480]], null, C.rule2); O.forEach((uv, k) => { const last = k === O.length - 1; for (const q of uv) P.dot(q[0], 480 - q[1], last ? C.lime : 'rgba(164,168,156,.45)', last ? 2.6 : 1.6); }); };
    p.redraw();
    if (s.n < 3) { read.innerHTML = `${s.n} view${s.n > 1 ? 's' : ''}: ${2 * s.n} equations for the 5 unknowns of B, ${bad('not enough')}; add views`; return; }
    const K = zhang(D.board, O), e = ['fx', 'fy', 'cx', 'cy'].map((k) => Math.abs(K[k] / KT[k] - 1) * 100), worst = Math.max(...e);
    const good = Number.isFinite(worst);
    read.innerHTML = good ? `${s.n} views, ${2 * s.n} equations · closed-form estimate fx ${K.fx.toFixed(1)}, fy ${K.fy.toFixed(1)}, cx ${K.cx.toFixed(1)}, cy ${K.cy.toFixed(1)} (illustrative truth 820, 810, 330, 235) · worst error ${worst < 1 ? ok(worst.toFixed(2) + ' %') : sp(C.warn, worst.toFixed(2) + ' %')}${s.noise > 0 ? ' · refinement would reduce this further' : ''}`
      : `${s.n} views: the noisy estimate is not a valid camera (B not positive definite); ${bad('add views or reduce noise')}`;
  };
  ctrls.append(slider('Views used', { min: 1, max: 12, step: 1, value: s.n }, (v) => { s.n = v; redraw(); }),
    slider('Corner noise', { min: 0, max: 2, step: 0.05, value: s.noise, fmt: (v) => v.toFixed(2) + ' px' }, (v) => { s.noise = v; redraw(); }));
  redraw();
};

// ---- p17-l04: lens distortion grid ----
W.distortgrid = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k1: -0.28, k2: 0.09, p1: 0.001, und: false }, f = 800;
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [0, 640], y: [0, 480], equal: true, label: 'A straight grid seen through the lens' });
  const dist = (x, y) => { const r2 = x * x + y * y, rad = 1 + s.k1 * r2 + s.k2 * r2 * r2; return [x * rad + 2 * s.p1 * x * y, y * rad + s.p1 * (r2 + 2 * y * y)]; };
  const undist = (xd, yd) => { let x = xd, y = yd; for (let i = 0; i < 20; i++) { const r2 = x * x + y * y, rad = 1 + s.k1 * r2 + s.k2 * r2 * r2; x = (xd - 2 * s.p1 * x * y) / rad; y = (yd - s.p1 * (r2 + 2 * y * y)) / rad; } return [x, y]; };
  const toPx = (x, y) => [f * x + 320, f * y + 240];
  p.draw = (P) => {
    P.axes({}); P.poly([[0, 0], [640, 0], [640, 480], [0, 480]], null, C.rule2);
    const pt = (u, v) => { const [xd, yd] = dist((u - 320) / f, (v - 240) / f); if (!s.und) return toPx(xd, yd); const [x, y] = undist(xd, yd); return toPx(x, y); };
    for (let u = 0; u <= 640; u += 40) { const xs = [], ys = []; for (let v = 0; v <= 480; v += 8) { const q = pt(u, v); xs.push(q[0]); ys.push(480 - q[1]); } P.line(xs, ys, u === 320 ? C.signal : C.lime, u === 320 ? 1.8 : 1.2); }
    for (let v = 0; v <= 480; v += 40) { const xs = [], ys = []; for (let u = 0; u <= 640; u += 8) { const q = pt(u, v); xs.push(q[0]); ys.push(480 - q[1]); } P.line(xs, ys, v === 240 ? C.signal : C.lime, v === 240 ? 1.8 : 1.2); }
  };
  const redraw = () => {
    p.redraw(); const [xd, yd] = dist(-0.4, -0.3), c = toPx(xd, yd), sh = Math.hypot(c[0], c[1]);
    const kind = Math.abs(s.k1) < 0.02 ? 'nearly none' : s.k1 < 0 ? 'barrel' : 'pincushion';
    read.innerHTML = `radial: ${kind} · the ideal top-left corner lands at (${c[0].toFixed(1)}, ${c[1].toFixed(1)}) px, ${sh.toFixed(1)} px from where a pinhole puts it · ${s.und ? ok('undistorted by 20 fixed-point iterations: straight again') : 'switch on undistortion to straighten the grid'}`;
  };
  ctrls.append(slider('k1', { min: -0.5, max: 0.5, step: 0.01, value: s.k1, fmt: (v) => v.toFixed(2) }, (v) => { s.k1 = v; redraw(); }),
    slider('k2', { min: -0.2, max: 0.2, step: 0.01, value: s.k2, fmt: (v) => v.toFixed(2) }, (v) => { s.k2 = v; redraw(); }),
    slider('p1 (tangential)', { min: -0.02, max: 0.02, step: 0.001, value: s.p1, fmt: (v) => v.toFixed(3) }, (v) => { s.p1 = v; redraw(); }),
    toggle('Undistort', s.und, (v) => { s.und = v; redraw(); }, { id: 'dist-und' }));
  redraw();
};

// ---- shared grey-image helpers (reflect-101 borders, like OpenCV) ----
const refl = (i, n) => (i < 0 ? -i : i >= n ? 2 * n - 2 - i : i);
function corr(img, w, hh, k, kn) { const r = kn >> 1, out = new Float64Array(w * hh); for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = 0; i < kn; i++) for (let j = 0; j < kn; j++) a += k[i * kn + j] * img[refl(y + i - r, hh) * w + refl(x + j - r, w)]; out[y * w + x] = a; } return out; }
const gk = (sig, n) => { const r = n >> 1, g = []; for (let i = -r; i <= r; i++) g.push(Math.exp(-i * i / (2 * sig * sig))); const t = g.reduce((a, b) => a + b, 0); const k = []; for (const a of g) for (const b of g) k.push(a * b / t / t); return k; };
const SOBX = [-1, 0, 1, -2, 0, 2, -1, 0, 1], SOBY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
const greyPx = (a, scale = 1, off = 0) => (i) => { const v = clamp(Math.round(a[i] * scale + off), 0, 255); return [v, v, v]; };

// ---- p17-l05: Canny stages ----
function edgeScene(noise, seed = 1) { const r = rng(seed), g = gauss(r), a = new Float64Array(IW * 120); for (let y = 0; y < 120; y++) for (let x = 0; x < IW; x++) { let v = 90; if (y >= 30 && y < 80 && x >= 20 && x < 70) v = 200; if ((x - 115) ** 2 + (y - 65) ** 2 < 784) v = 30; a[y * IW + x] = clamp(Math.round(v + noise * g()), 0, 255); } return a; }
W.edges = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { stage: 'edges', lo: 40, hi: 100, sig: 1.4, noise: 4 }, w = IW, hh = 120;
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [0, w], y: [0, hh], equal: true, label: 'Canny edge detection, stage by stage' });
  let cache = null;
  const compute = () => {
    const img = edgeScene(s.noise), bl = corr(img, w, hh, gk(s.sig, 5), 5), gx = corr(bl, w, hh, SOBX, 3), gy = corr(bl, w, hh, SOBY, 3), mag = new Float64Array(w * hh), nms = new Float64Array(w * hh);
    for (let i = 0; i < w * hh; i++) mag[i] = Math.hypot(gx[i], gy[i]);
    const OFF = [[0, 1], [1, 1], [1, 0], [1, -1]];
    for (let y = 1; y < hh - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; let a = Math.atan2(gy[i], gx[i]) / D2R; a = ((a % 180) + 180) % 180; const [di, dj] = OFF[Math.round(a / 45) % 4]; if (mag[i] >= mag[(y + di) * w + x + dj] && mag[i] >= mag[(y - di) * w + x - dj]) nms[i] = mag[i]; }
    const E = new Uint8Array(w * hh), st = []; for (let i = 0; i < w * hh; i++) if (nms[i] >= s.hi) { E[i] = 1; st.push(i); }
    while (st.length) { const i = st.pop(), y = Math.floor(i / w), x = i % w; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * w + x + dx; if (y + dy >= 0 && y + dy < hh && x + dx >= 0 && x + dx < w && !E[j] && nms[j] >= s.lo) { E[j] = 1; st.push(j); } } }
    cache = { img, bl, mag, nms, E };
  };
  p.draw = (P) => {
    const { img, bl, mag, nms, E } = cache, mx = Math.max(...mag) || 1;
    const px = { input: greyPx(img), blur: greyPx(bl), mag: (i) => heat(mag[i] / mx), nms: (i) => heat(nms[i] / mx), edges: (i) => (E[i] ? [198, 255, 26] : [Math.round(img[i] * 0.25), Math.round(img[i] * 0.25), Math.round(img[i] * 0.25)]) }[s.stage];
    drawImg(P, w, hh, px, 0, 0, w, hh);
  };
  const redraw = () => {
    compute(); p.redraw(); const n = cache.E.reduce((a, b) => a + b, 0), weak = cache.nms.reduce((a, v) => a + (v >= s.lo && v < s.hi ? 1 : 0), 0), strong = cache.nms.reduce((a, v) => a + (v >= s.hi ? 1 : 0), 0);
    read.innerHTML = `${n} edge pixels: ${strong} strong (≥ ${s.hi}) plus ${n - strong} weak ones connected to them; ${weak - (n - strong)} isolated weak pixels rejected by hysteresis${s.lo > s.hi ? ' · ' + bad('low threshold above high') : ''}`;
  };
  ctrls.append(select('Stage', [['input', '1. input'], ['blur', '2. Gaussian blur'], ['mag', '3. gradient magnitude'], ['nms', '4. non-maximum suppression'], ['edges', '5. hysteresis: edges']], s.stage, (v) => { s.stage = v; p.redraw(); }, 'edge-stage'),
    slider('Low threshold', { min: 5, max: 200, step: 5, value: s.lo }, (v) => { s.lo = v; redraw(); }),
    slider('High threshold', { min: 10, max: 400, step: 5, value: s.hi }, (v) => { s.hi = v; redraw(); }),
    slider('Blur sigma', { min: 0.5, max: 3, step: 0.1, value: s.sig, fmt: (v) => v.toFixed(1) + ' px' }, (v) => { s.sig = v; redraw(); }),
    slider('Noise', { min: 0, max: 30, step: 1, value: s.noise, fmt: (v) => v + ' levels' }, (v) => { s.noise = v; redraw(); }));
  redraw();
};

// ---- p17-l06: threshold, opening and connected components ----
function blobScene(noise) {
  const r = rng(3), g = gauss(rng(11)), a = new Float64Array(IW * 120).fill(60), truth = [];
  while (truth.length < 9) { const cy = 14 + r() * 92, cx = 14 + r() * 132, rr = 6 + r() * 5; if (truth.every(([y, x, s]) => Math.hypot(cy - y, cx - x) > rr + s + 4)) { truth.push([cy, cx, rr]); const lv = 160 + r() * 50; for (let y = 0; y < 120; y++) for (let x = 0; x < IW; x++) if ((y - cy) ** 2 + (x - cx) ** 2 <= rr * rr) a[y * IW + x] = lv; } }
  for (let i = 0; i < a.length; i++) a[i] = clamp(Math.round(a[i] + noise * g()), 0, 255); return { a, truth };
}
function otsuT(a) { const hst = new Float64Array(256); for (const v of a) hst[v]++; const n = a.length; let w0 = 0, s0 = 0, tot = 0; for (let i = 0; i < 256; i++) tot += i * hst[i]; let best = 0, bt = 0; for (let t = 0; t < 256; t++) { w0 += hst[t]; s0 += t * hst[t]; if (w0 === 0 || w0 === n) continue; const m0 = s0 / w0, m1 = (tot - s0) / (n - w0), sb = w0 * (n - w0) * (m0 - m1) ** 2; if (sb > best) { best = sb; bt = t; } } return bt; }
function label(mask, w, hh) { const L = new Int32Array(w * hh), areas = []; for (let i = 0; i < w * hh; i++) if (mask[i] && !L[i]) { const k = areas.length + 1; let n = 0; const st = [i]; L[i] = k; while (st.length) { const j = st.pop(); n++; const y = Math.floor(j / w), x = j % w; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx, q = yy * w + xx; if (yy >= 0 && yy < hh && xx >= 0 && xx < w && mask[q] && !L[q]) { L[q] = k; st.push(q); } } } areas.push(n); } return { L, areas }; }
function morph(m, w, hh, erode) { const o = new Uint8Array(w * hh); for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { let v = erode ? 1 : 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx, inside = yy >= 0 && yy < hh && xx >= 0 && xx < w, b = inside ? m[yy * w + xx] : erode ? 1 : 0; if (erode) v &= b; else v |= b; } o[y * w + x] = v; } return o; }
W.blobs = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: 115, open: true, noise: 30, minA: 20 }, w = IW, hh = 120;
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [0, w], y: [0, hh], equal: true, label: 'Thresholded mask coloured by connected component' });
  let sc = blobScene(s.noise), res = null;
  const PAL = [[198, 255, 26], [111, 211, 255], [255, 181, 71], [236, 238, 230], [255, 107, 91], [180, 140, 255], [80, 220, 170], [255, 150, 200], [170, 200, 90]];
  p.draw = (P) => { const { L, keep } = res; drawImg(P, w, hh, (i) => { const k = L[i]; if (k && keep.has(k)) return PAL[(k - 1) % PAL.length]; if (k) return [120, 60, 55]; const v = Math.round(sc.a[i] * 0.3); return [v, v, v]; }, 0, 0, w, hh); };
  const redraw = () => {
    let m = new Uint8Array(w * hh); for (let i = 0; i < w * hh; i++) m[i] = sc.a[i] > s.t ? 1 : 0; const raw = label(m, w, hh).areas.length;
    if (s.open) m = morph(morph(m, w, hh, true), w, hh, false);
    const { L, areas } = label(m, w, hh), keep = new Set(); areas.forEach((a, k) => { if (a >= s.minA) keep.add(k + 1); }); res = { L, keep }; p.redraw();
    read.innerHTML = `threshold ${s.t} · raw mask ${raw} components · ${s.open ? 'after a 3 × 3 opening' : 'no opening'} and a ${s.minA}-pixel minimum: ${keep.size === 9 ? ok(keep.size + ' parts') : bad(keep.size + ' parts')} (truth 9) · dark red: components rejected as too small`;
  };
  const ts = slider('Threshold', { min: 0, max: 255, step: 1, value: s.t }, (v) => { s.t = v; redraw(); });
  ctrls.append(ts, button('Otsu', () => setSlider(ts, otsuT(sc.a)), 'blob-otsu'),
    toggle('3 × 3 opening', s.open, (v) => { s.open = v; redraw(); }, { id: 'blob-open' }),
    slider('Noise', { min: 0, max: 50, step: 1, value: s.noise, fmt: (v) => v + ' levels' }, (v) => { s.noise = v; sc = blobScene(v); redraw(); }),
    slider('Minimum area', { min: 1, max: 100, step: 1, value: s.minA, fmt: (v) => v + ' px' }, (v) => { s.minA = v; redraw(); }));
  redraw();
};

// ---- p17-l07: Harris response under rotation ----
const SHAPES = [[[30, 30], [70, 30], [70, 60], [30, 60]], [[95, 25], [135, 45], [105, 70]], [[40, 80], [80, 85], [75, 110], [50, 105]]];
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [x1, y1] = P[i], [x2, y2] = P[j]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-12) + x1) c = !c; } return c; };
function harrisScene(ang) {
  const w = 160, hh = 130, a = Math.cos(ang * D2R), b = Math.sin(ang * D2R), cx = 80, cy = 65, rot = ([x, y]) => [cx + a * (x - cx) - b * (y - cy), cy + b * (x - cx) + a * (y - cy)];
  const polys = SHAPES.map((S) => S.map(rot)), img = new Float64Array(w * hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { let v = 0; for (let oy = 0; oy < 4; oy++) for (let ox = 0; ox < 4; ox++) { const X = x + (ox + 0.5) / 4 - 0.5, Y = y + (oy + 0.5) / 4 - 0.5; polys.forEach((P, k) => { if (inPoly(X, Y, P)) v += (140 + 40 * k) / 16; }); } img[y * w + x] = Math.floor(v + 30); }
  return { img, w, hh, corners: polys.flat() };
}
W.harris = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 0.04, rel: 1, ang: 0, show: true };
  const p = new Plot(body, { aspect: 0.8, maxH: 360, x: [0, 160], y: [0, 130], equal: true, label: 'Harris response and detected corners' });
  let sc = harrisScene(0), R = null, found = [];
  const compute = () => {
    const { img, w, hh } = sc, gx = corr(img, w, hh, SOBX, 3).map((v) => v / 255), gy = corr(img, w, hh, SOBY, 3).map((v) => v / 255), box = Array(9).fill(1);
    const A = corr(gx.map((v) => v * v), w, hh, box, 3), B = corr(gx.map((v, i) => v * gy[i]), w, hh, box, 3), Cc = corr(gy.map((v) => v * v), w, hh, box, 3);
    R = new Float64Array(w * hh); let mx = -Infinity; for (let i = 0; i < w * hh; i++) { R[i] = A[i] * Cc[i] - B[i] * B[i] - s.k * (A[i] + Cc[i]) ** 2; if (R[i] > mx) mx = R[i]; }
    found = []; const th = s.rel / 100 * mx;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { const v = R[y * w + x]; if (v <= th) continue; let best = true; for (let dy = -4; dy <= 4 && best; dy++) for (let dx = -4; dx <= 4; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < hh && xx >= 0 && xx < w && R[yy * w + xx] > v) { best = false; break; } } if (best) found.push([x, y]); }
  };
  p.draw = (P) => {
    const { img, w, hh, corners } = sc, mx = Math.max(...R);
    drawImg(P, w, hh, s.show ? (i) => (R[i] > 0 ? heat(Math.sqrt(R[i] / mx)) : R[i] < 0 ? [Math.round(img[i] * 0.2), Math.round(img[i] * 0.2), Math.round(img[i] * 0.45)] : [Math.round(img[i] * 0.3), Math.round(img[i] * 0.3), Math.round(img[i] * 0.3)]) : greyPx(img), 0, 0, w, hh);
    for (const [x, y] of corners) P.dot(x + 0.5, hh - y - 0.5, C.signal, 3);
    for (const [x, y] of found) { P.ctx.strokeStyle = C.lime; P.ctx.lineWidth = 2; P.ctx.beginPath(); P.ctx.arc(P.sx(x + 0.5), P.sy(hh - y - 0.5), 7, 0, 7); P.ctx.stroke(); }
  };
  const redraw = () => {
    compute(); p.redraw(); const tc = sc.corners, hit = tc.filter(([a, b]) => found.some(([x, y]) => Math.hypot(x - a, y - b) <= 3)).length, tp = found.filter(([x, y]) => tc.some(([a, b]) => Math.hypot(x - a, y - b) <= 3)).length;
    read.innerHTML = `${found.length} detections · ${hit === tc.length ? ok(`${hit} of ${tc.length}`) : sp(C.warn, `${hit} of ${tc.length}`)} true corners (${sp(C.signal, 'blue dots')}) found within 3 px · ${found.length - tp ? bad(found.length - tp + ' false') : ok('no false')} detections · ${s.show ? 'bright: R > 0 (corner), blue tint: R < 0 (edge)' : ''}`;
  };
  ctrls.append(slider('k', { min: 0.02, max: 0.2, step: 0.01, value: s.k, fmt: (v) => v.toFixed(2) }, (v) => { s.k = v; redraw(); }),
    slider('Threshold', { min: 0.1, max: 30, step: 0.1, value: s.rel, fmt: (v) => v.toFixed(1) + ' % of max' }, (v) => { s.rel = v; redraw(); }),
    slider('Rotate scene', { min: 0, max: 90, step: 5, value: s.ang, fmt: (v) => v + '°' }, (v) => { s.ang = v; sc = harrisScene(v); redraw(); }),
    toggle('Show response', s.show, (v) => { s.show = v; p.redraw(); }, { id: 'harris-resp' }));
  redraw();
};

// ---- p17-l08: binary descriptors and the ratio test ----
const TXW = 200, TXH = 150;
let WAVES = null;
function texAt(x, y) { if (!WAVES) { const r = rng(5), g = gauss(r); WAVES = Array.from({ length: 36 }, () => [0.18 * g(), 0.18 * g(), 2 * Math.PI * r()]); } let v = 0; for (const [a, b, c] of WAVES) v += Math.sin(a * x + b * y + c); return 128 + 50 * v / Math.sqrt(18); }
function matchData(noise, ang) {
  const r = rng(2), g = gauss(rng(9)), a = ang * D2R, c = [100, 75], t = [9.3, -5.6];
  const img1 = new Float64Array(TXW * TXH), img2 = new Float64Array(TXW * TXH);
  for (let y = 0; y < TXH; y++) for (let x = 0; x < TXW; x++) { img1[y * TXW + x] = texAt(x, y); const dx = x - c[0] - t[0], dy = y - c[1] - t[1], qx = Math.cos(a) * dx + Math.sin(a) * dy + c[0], qy = -Math.sin(a) * dx + Math.cos(a) * dy + c[1]; img2[y * TXW + x] = 1.15 * texAt(qx, qy) - 12 + noise * g(); }
  const to2 = ([x, y]) => [c[0] + Math.cos(a) * (x - c[0]) - Math.sin(a) * (y - c[1]) + t[0], c[1] + Math.sin(a) * (x - c[0]) + Math.cos(a) * (y - c[1]) + t[1]];
  const p1 = [], p2 = [], tru = []; for (let k = 0; k < 70; k++) { const q = [30 + r() * 140, 28 + r() * 94], q2 = to2(q); p1.push(q); if (r() < 0.7 && q2[0] > 16 && q2[0] < TXW - 16 && q2[1] > 16 && q2[1] < TXH - 16) { tru.push(p2.length); p2.push(q2); } else tru.push(-1); }
  for (let k = 0; k < 25; k++) p2.push([20 + r() * 160, 20 + r() * 110]);
  return { img1, img2, p1, p2, tru };
}
const PAIRS = (() => { const r = rng(42); return Array.from({ length: 256 }, () => [0, 0, 0, 0].map(() => Math.floor(r() * 25) - 12)); })();
const brief = (img, [x, y]) => { const X = Math.round(x), Y = Math.round(y); return PAIRS.map(([a, b, c, d]) => (img[(Y + b) * TXW + X + a] < img[(Y + d) * TXW + X + c] ? 1 : 0)); };
W.matching = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { ratio: 0.8, noise: 6, ang: 8 };
  const p = new Plot(body, { aspect: 1.45, maxH: 560, x: [0, TXW], y: [0, 2 * TXH + 6], equal: true, label: 'View 1 above view 2, with matches' });
  let D = null, dists = null;
  const prep = () => { D = matchData(s.noise, s.ang); const d1 = D.p1.map((q) => brief(D.img1, q)), d2 = D.p2.map((q) => brief(D.img2, q)); dists = d1.map((a) => d2.map((b) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0))); };
  const redraw = () => {
    const m = []; dists.forEach((row, i) => { let b1 = Infinity, b2 = Infinity, j1 = -1; row.forEach((d, j) => { if (d < b1) { b2 = b1; b1 = d; j1 = j; } else if (d < b2) b2 = d; }); if (b1 < s.ratio * b2) m.push([i, j1]); });
    const good = m.filter(([i, j]) => D.tru[i] === j).length;
    p.draw = (P) => { drawImg(P, TXW, TXH, greyPx(D.img1), 0, TXH + 6, TXW, 2 * TXH + 6); drawImg(P, TXW, TXH, greyPx(D.img2), 0, 0, TXW, TXH);
      for (const [i, j] of m) { const a = D.p1[i], b = D.p2[j]; P.line([a[0], b[0]], [2 * TXH + 6 - a[1], TXH - b[1]], D.tru[i] === j ? 'rgba(198,255,26,.75)' : C.bad, 1.3); }
      for (const q of D.p1) P.dot(q[0], 2 * TXH + 6 - q[1], C.signal, 2.2); for (const q of D.p2) P.dot(q[0], TXH - q[1], C.signal, 2.2); };
    p.redraw(); const inl = m.length ? good / m.length : 0;
    read.innerHTML = `ratio ${s.ratio.toFixed(2)}: ${m.length} matches from ${D.p1.length} keypoints · ${inl > 0.9 ? ok((100 * inl).toFixed(1) + ' %') : sp(C.warn, (100 * inl).toFixed(1) + ' %')} correct · ${m.length - good} wrong (red) · view 2 is moved, rotated ${s.ang}°, brighter and noisier; 30 % of points are hidden in it and it has 25 keypoints of its own`;
  };
  ctrls.append(slider('Ratio threshold', { min: 0.5, max: 1, step: 0.01, value: s.ratio, fmt: (v) => v.toFixed(2) }, (v) => { s.ratio = v; redraw(); }),
    slider('Noise in view 2', { min: 0, max: 30, step: 1, value: s.noise, fmt: (v) => v + ' levels' }, (v) => { s.noise = v; prep(); redraw(); }),
    slider('Rotation of view 2', { min: 0, max: 40, step: 1, value: s.ang, fmt: (v) => v + '°' }, (v) => { s.ang = v; prep(); redraw(); }));
  prep(); redraw();
};

// ---- p17-l09: a page under a homography (drag the corners) ----
W.homography = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const DST = [[40, 30], [344.8, 43.1], [331.8, 271.0], [-5.5, 296.7]].map(([x, y]) => [x + 30, y + 20]), SRC = [[0, 0], [400, 0], [400, 300], [0, 300]];
  const s = { k: 2 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-20, 440], y: [-20, 360], equal: true, label: 'The page as the camera sees it; drag the corners' });
  const ys = (y) => 340 - y;
  p.draw = (P) => {
    P.axes({}); const H = homog(SRC, DST);
    for (let i = 0; i <= 8; i++) { const a = [], b = [], c = [], d = []; for (let j = 0; j <= 20; j++) { const q = happly(H, 50 * i, 15 * j); a.push(q[0]); b.push(ys(q[1])); const r = happly(H, 20 * j, 37.5 * i); c.push(r[0]); d.push(ys(r[1])); } P.line(a, b, 'rgba(198,255,26,.55)', 1.1); P.line(c, d, 'rgba(198,255,26,.55)', 1.1); }
    P.poly(DST.map(([x, y]) => [x, ys(y)]), null, C.lime);
    const mid = happly(H, 200, 150); P.dot(mid[0], ys(mid[1]), C.warn, 4);
    DST.forEach(([x, y], i) => P.handle(x, ys(y), i === s.k ? C.warn : C.lime));
  };
  const sx = slider('Corner x', { min: -20, max: 440, step: 1, value: DST[s.k][0], fmt: (v) => v.toFixed(0) + ' px' }, (v) => { DST[s.k][0] = v; redraw(); });
  const sy = slider('Corner y', { min: -20, max: 360, step: 1, value: DST[s.k][1], fmt: (v) => v.toFixed(0) + ' px' }, (v) => { DST[s.k][1] = v; redraw(); });
  const sync = () => { for (const [lbl, v] of [[sx, DST[s.k][0]], [sy, DST[s.k][1]]]) { lbl.querySelector('input').value = v; lbl.querySelector('output').textContent = Math.round(v) + ' px'; } };
  const redraw = () => {
    p.redraw(); const H = homog(SRC, DST), f = (v) => (Math.abs(v) < 0.01 ? v.toExponential(1) : v.toFixed(3));
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); const sg = [0, 1, 2, 3].map((i) => Math.sign(cr(DST[i], DST[(i + 1) % 4], DST[(i + 2) % 4])));
    const convex = sg.every((v) => v === sg[0]);
    read.innerHTML = `H = [${H.map((r) => r.map(f).join(' ')).join(' ; ')}] from 4 corners by DLT · page centre (200, 150) maps to the ${sp(C.warn, 'amber dot')}, not the middle of the outline · ${convex ? ok('valid view of a plane') : bad('the outline folds over: no camera sees a page like this')}`;
  };
  ctrls.append(select('Corner', [['0', 'top-left (0, 0)'], ['1', 'top-right (400, 0)'], ['2', 'bottom-right (400, 300)'], ['3', 'bottom-left (0, 300)']], String(s.k), (v) => { s.k = +v; sync(); p.redraw(); }, 'hom-corner'), sx, sy);
  p.handles(() => DST.map(([x, y]) => [x, ys(y)]), (i, x, y) => { s.k = i; ctrls.querySelector('select').value = String(i); DST[i] = [clamp(Math.round(x), -20, 440), clamp(Math.round(340 - y), -20, 360)]; sync(); redraw(); }, el);
  redraw();
};

// ---- p17-l10: RANSAC for a line, sample by sample ----
W.ransac = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { out: 0.5, k: 40, seed: 1 }, N = 60, TH = 0.25;
  const p = new Plot(body, { aspect: 0.7, maxH: 360, x: [0, 10], y: [0, 7], equal: true, label: 'Points, the current sample and the best RANSAC line' });
  let pts = [], samples = [];
  const gen = () => { const r = rng(s.seed), g = gauss(rng(s.seed + 100)); pts = []; for (let i = 0; i < N; i++) { const x = 0.3 + 9.4 * r(), bad_ = r() < s.out; pts.push(bad_ ? [x, 0.3 + 6.4 * r(), false] : [x, 1 + 0.45 * x + 0.1 * g(), true]); }
    const rs = rng(s.seed + 7); samples = []; for (let k = 0; k < 200; k++) { const i = Math.floor(rs() * N); let j = Math.floor(rs() * (N - 1)); if (j >= i) j++; samples.push([i, j]); } };
  const lineOf = (a, b) => { const nx = -(b[1] - a[1]), ny = b[0] - a[0], n = Math.hypot(nx, ny); return [nx / n, ny / n, -(nx * a[0] + ny * a[1]) / n]; };
  const inl = (L) => pts.map((q) => Math.abs(L[0] * q[0] + L[1] * q[1] + L[2]) < TH);
  const fit = (sel) => { const P = pts.filter((_, i) => sel[i]); const n = P.length, mx = P.reduce((a, q) => a + q[0], 0) / n, my = P.reduce((a, q) => a + q[1], 0) / n; let sxx = 0, sxy = 0; for (const q of P) { sxx += (q[0] - mx) ** 2; sxy += (q[0] - mx) * (q[1] - my); } const m = sxy / sxx; return [m, my - m * mx]; };
  const redraw = () => {
    let best = null, bestN = -1, bestK = 0;
    for (let k = 0; k < s.k; k++) { const [i, j] = samples[k], L = lineOf(pts[i], pts[j]), I = inl(L), n = I.filter(Boolean).length; if (n > bestN) { bestN = n; best = I; bestK = k; } }
    const [i, j] = samples[s.k - 1], cur = inl(lineOf(pts[i], pts[j])), [m, c] = fit(best), [ml, cl] = fit(pts.map(() => true));
    p.draw = (P) => { P.axes({ xl: 'x', yl: 'y' }); P.line([0, 10], [cl, cl + 10 * ml], C.bad, 1.6, [6, 4]); P.line([0, 10], [c, c + 10 * m], C.lime, 2.4);
      const L = lineOf(pts[i], pts[j]); const yy = (x) => -(L[0] * x + L[2]) / L[1]; P.line([0, 10], [yy(0), yy(10)], C.signal, 1.2);
      pts.forEach((q, k) => P.dot(q[0], q[1], cur[k] ? C.signal : q[2] ? C.bone : C.fog, cur[k] ? 4 : 3)); P.dot(pts[i][0], pts[i][1], C.warn, 6); P.dot(pts[j][0], pts[j][1], C.warn, 6); };
    p.redraw(); const w = 1 - s.out, need = Math.ceil(Math.log(0.01) / Math.log(1 - w * w)), err = Math.abs(m - 0.45) + Math.abs(c - 1);
    read.innerHTML = `sample ${s.k}: ${sp(C.warn, 'two points')} → ${sp(C.signal, cur.filter(Boolean).length + ' inliers')} · best so far: sample ${bestK + 1} with ${bestN} inliers, refit ${sp(C.lime, `y = ${m.toFixed(3)} x + ${c.toFixed(3)}`)} (illustrative truth 0.45 x + 1) ${err < 0.1 ? ok('✓') : ''} · ${sp(C.bad, 'least squares on everything')}: y = ${ml.toFixed(3)} x + ${cl.toFixed(3)} · for ${Math.round(100 * s.out)} % outliers, 99 % confidence needs ${need} samples`;
  };
  ctrls.append(slider('Outlier fraction', { min: 0, max: 0.8, step: 0.05, value: s.out, fmt: (v) => Math.round(v * 100) + ' %' }, (v) => { s.out = v; gen(); redraw(); }),
    slider('Samples drawn', { min: 1, max: 100, step: 1, value: s.k }, (v) => { s.k = v; redraw(); }),
    button('New points', () => { s.seed++; gen(); redraw(); }, 'ransac-new'));
  gen(); redraw();
};

// ---- p17-l11: marker pose from four noisy corners ----
W.markerpose = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { yaw: 25, pitch: -15, z: 0.8, noise: 0.3, seed: 1 }, S = 0.1, F = 800, OBJ = [[-S / 2, S / 2, 0], [S / 2, S / 2, 0], [S / 2, -S / 2, 0], [-S / 2, -S / 2, 0]];
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [0, 640], y: [0, 480], equal: true, label: 'The marker in the image, and the pose recovered from its corners' });
  const proj = (R, t, X) => { const q = [0, 1, 2].map((i) => R[i][0] * X[0] + R[i][1] * X[1] + R[i][2] * X[2] + t[i]); return [F * q[0] / q[2] + 320, F * q[1] / q[2] + 240]; };
  const solve = (uv) => {
    const H = homog(OBJ.map((o) => [o[0], o[1]]), uv), Ki = [[1 / F, 0, -320 / F], [0, 1 / F, -240 / F], [0, 0, 1]], M = mm(Ki, H);
    const n = Math.hypot(M[0][0], M[1][0], M[2][0]) * Math.sign(M[2][2]); const r1 = [0, 1, 2].map((i) => M[i][0] / n), r2 = [0, 1, 2].map((i) => M[i][1] / n), r3 = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
    let R = [0, 1, 2].map((i) => [r1[i], r2[i], r3[i]]); for (let it = 0; it < 30; it++) { const inv = invT3(tr(R)); R = R.map((r, i) => r.map((v, j) => 0.5 * (v + inv[i][j]))); }   // polar iteration: nearest rotation
    let t = [0, 1, 2].map((i) => M[i][2] / n); const R0 = R.map((r) => [...r]), t0 = [...t];
    const res = (R_, t_) => OBJ.flatMap((o, k) => { const q = proj(R_, t_, o); return [q[0] - uv[k][0], q[1] - uv[k][1]]; });
    for (let it = 0; it < 10; it++) { const r0 = res(R, t), J = r0.map(() => Array(6).fill(0)); for (let c = 0; c < 6; c++) { const d = Array(6).fill(0); d[c] = 1e-7; const r1_ = res(mm(rodr(d.slice(0, 3)), R), t.map((v, i) => v + d[3 + i])); r0.forEach((v, i) => { J[i][c] = (r1_[i] - v) / 1e-7; }); }
      const JtJ = Array.from({ length: 6 }, (_, a) => Array.from({ length: 6 }, (__, b) => J.reduce((acc, row) => acc + row[a] * row[b], 0) + (a === b ? 1e-9 : 0))), Jtr = Array.from({ length: 6 }, (_, a) => -J.reduce((acc, row, i) => acc + row[a] * r0[i], 0)), dx = solveLin(JtJ, Jtr);
      R = mm(rodr(dx.slice(0, 3)), R); t = t.map((v, i) => v + dx[3 + i]); }
    return { R, t, R0, t0 };
  };
  const redraw = () => {
    const R = mm(rodr([0, s.yaw * D2R, 0]), rodr([s.pitch * D2R, 0, 0])), t = [0.05, -0.03, s.z], g = gauss(rng(s.seed));
    const ideal = OBJ.map((o) => proj(R, t, o)), uv = ideal.map(([u, v]) => [u + s.noise * g(), v + s.noise * g()]), est = solve(uv);
    const eR = rotAngle(R, est.R), eH = rotAngle(R, est.R0), eT = Math.hypot(...est.t.map((v, i) => v - t[i]));
    p.draw = (P) => { P.axes({}); P.poly([[0, 0], [640, 0], [640, 480], [0, 480]], null, C.rule2); P.poly(ideal.map(([u, v]) => [u, 480 - v]), 'rgba(236,238,230,.12)', C.bone);
      const ax = (A, T, col) => { const o = proj(A, T, [0, 0, 0]); [[0.06, 0, 0, C.bad], [0, 0.06, 0, C.lime], [0, 0, -0.06, C.signal]].forEach(([a, b, c, cc]) => { const e = proj(A, T, [a, b, c]); P.line([o[0], e[0]], [480 - o[1], 480 - e[1]], col || cc, 2.2); }); };
      ax(R, t, 'rgba(164,168,156,.7)'); ax(est.R, est.t); uv.forEach(([u, v]) => P.dot(u, 480 - v, C.warn, 3.5)); };
    p.redraw(); const w = F * S / s.z;
    read.innerHTML = `marker about ${w.toFixed(0)} px wide · from the homography alone: rotation error ${eH.toFixed(2)}° · after Gauss-Newton: ${eR < 1 ? ok(eR.toFixed(2) + '°') : sp(C.warn, eR.toFixed(2) + '°')}, position error ${(1000 * eT).toFixed(1)} mm · ${sp(C.warn, 'amber')}: noisy corners; grey axes: true pose; coloured axes: estimate`;
  };
  ctrls.append(slider('Yaw', { min: -60, max: 60, step: 1, value: s.yaw, fmt: (v) => v + '°' }, (v) => { s.yaw = v; redraw(); }),
    slider('Pitch', { min: -60, max: 60, step: 1, value: s.pitch, fmt: (v) => v + '°' }, (v) => { s.pitch = v; redraw(); }),
    slider('Distance', { min: 0.3, max: 3, step: 0.05, value: s.z, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.z = v; redraw(); }),
    slider('Corner noise', { min: 0, max: 2, step: 0.05, value: s.noise, fmt: (v) => v.toFixed(2) + ' px' }, (v) => { s.noise = v; redraw(); }),
    button('New noise sample', () => { s.seed++; redraw(); }, 'marker-noise'));
  redraw();
};
function invT3(A) { const [a, b, c] = A[0], [d, e, f] = A[1], [g, hh, i] = A[2], det = a * (e * i - f * hh) - b * (d * i - f * g) + c * (d * hh - e * g); return [[(e * i - f * hh) / det, (c * hh - b * i) / det, (b * f - c * e) / det], [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det], [(d * hh - e * g) / det, (b * g - a * hh) / det, (a * e - b * d) / det]]; }

// ---- p17-l12: stereo block matching ----
const SW = 160, SH = 120, SF = 200, SB = 0.12;
let SWAVES = null;
function stereoTex(X, Y, z0) { if (!SWAVES) { const r = rng(4), g = gauss(r); SWAVES = Array.from({ length: 30 }, () => [25 * g(), 25 * g(), 2 * Math.PI * r()]); } let v = 0; for (const [a, b, c] of SWAVES) v += Math.sin(a * X + b * Y + c + 3 * z0); return 128 + 22 * v / Math.sqrt(15); }
function stereoPair() {
  const out = []; for (const cam of [0, SB]) { const img = new Float64Array(SW * SH), dep = new Float64Array(SW * SH);
    for (let v = 0; v < SH; v++) for (let u = 0; u < SW; u++) { let z = 4, X = (u - 80) * 4 / SF + cam, Y = (v - 60) * 4 / SF; const Xb = (u - 80) * 1.6 / SF + cam, Yb = (v - 60) * 1.6 / SF; if (Math.abs(Xb) < 0.3 && Math.abs(Yb) < 0.25) { z = 1.6; X = Xb; Y = Yb; } img[v * SW + u] = clamp(Math.round(stereoTex(X, Y, z)), 0, 255); dep[v * SW + u] = z; } out.push({ img, dep }); }
  return out;
}
let SPAIR = null;
W.stereo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { half: 3, maxd: 24, show: 'disp' };
  const [a, b] = twoUp(body);
  const pl = new Plot(a, { aspect: 0.75, maxH: 300, x: [0, SW], y: [0, SH], equal: true, label: 'Left image' });
  const pd = new Plot(b, { aspect: 0.75, maxH: 300, x: [0, SW], y: [0, SH], equal: true, label: 'Disparity from block matching' });
  if (!SPAIR) SPAIR = stereoPair(); const [L, Rr] = SPAIR;
  let disp = null, valid = null;
  const compute = () => {
    const k = s.half, n = SW * SH; disp = new Float64Array(n); valid = new Uint8Array(n); const cost = [];
    for (let d = 0; d <= s.maxd; d++) { const c = new Float64Array(n).fill(Infinity), diff = new Float64Array(n); for (let v = 0; v < SH; v++) for (let u = d; u < SW; u++) diff[v * SW + u] = Math.abs(L.img[v * SW + u] - Rr.img[v * SW + u - d]);
      const I = new Float64Array((SW + 1) * (SH + 1)); for (let v = 0; v < SH; v++) for (let u = 0; u < SW; u++) I[(v + 1) * (SW + 1) + u + 1] = diff[v * SW + u] + I[v * (SW + 1) + u + 1] + I[(v + 1) * (SW + 1) + u] - I[v * (SW + 1) + u];
      for (let v = k; v < SH - k; v++) for (let u = d + k; u < SW - k; u++) c[v * SW + u] = I[(v + k + 1) * (SW + 1) + u + k + 1] - I[(v - k) * (SW + 1) + u + k + 1] - I[(v + k + 1) * (SW + 1) + u - k] + I[(v - k) * (SW + 1) + u - k]; cost.push(c); }
    for (let i = 0; i < n; i++) { let b1 = Infinity, d1 = -1; for (let d = 0; d <= s.maxd; d++) if (cost[d][i] < b1) { b1 = cost[d][i]; d1 = d; } if (d1 < 0) continue; let b2 = Infinity; for (let d = 0; d <= s.maxd; d++) if (Math.abs(d - d1) > 1 && cost[d][i] < b2) b2 = cost[d][i];
      let sub = 0; if (d1 > 0 && d1 < s.maxd) { const c0 = cost[d1 - 1][i], c2 = cost[d1 + 1][i], den = c0 - 2 * b1 + c2; if (Number.isFinite(den) && den > 0) sub = 0.5 * (c0 - c2) / den; } disp[i] = d1 + sub; valid[i] = (i % SW) >= s.maxd + k && b1 < 0.9 * b2 ? 1 : 0; }
  };
  pl.draw = (P) => drawImg(P, SW, SH, greyPx(L.img), 0, 0, SW, SH);
  pd.draw = (P) => drawImg(P, SW, SH, (i) => (valid[i] ? heat(disp[i] / 18) : [40, 40, 50]), 0, 0, SW, SH);
  const redraw = () => {
    compute(); pl.redraw(); pd.redraw(); let nv = 0, good = 0; const ez = [];
    for (let i = 0; i < SW * SH; i++) { if (!valid[i]) continue; nv++; const td = SF * SB / L.dep[i], edge = L.dep[clamp(i - 4, 0, SW * SH - 1)] !== L.dep[i] || L.dep[clamp(i + 4, 0, SW * SH - 1)] !== L.dep[i] || L.dep[clamp(i - 4 * SW, 0, SW * SH - 1)] !== L.dep[i] || L.dep[clamp(i + 4 * SW, 0, SW * SH - 1)] !== L.dep[i]; if (!edge) { if (Math.abs(disp[i] - td) < 0.5) good++; ez.push(Math.abs(SF * SB / Math.max(disp[i], 0.5) - L.dep[i])); } }
    ez.sort((x, y) => x - y); const med = ez.length ? ez[ez.length >> 1] : NaN, pct = ez.length ? 100 * good / ez.length : 0;
    read.innerHTML = `true disparity: box ${(SF * SB / 1.6).toFixed(1)} px, wall ${(SF * SB / 4).toFixed(1)} px · ${(100 * nv / (SW * SH)).toFixed(1)} % of pixels pass the uniqueness check (dark: rejected) · away from depth edges ${pct > 95 ? ok(pct.toFixed(1) + ' %') : sp(C.warn, pct.toFixed(1) + ' %')} within 0.5 px · median depth error ${(1000 * med).toFixed(0)} mm${s.maxd < 15 ? ' · ' + bad('range too small for the box') : ''}`;
  };
  ctrls.append(slider('Window size', { min: 1, max: 7, step: 1, value: s.half, fmt: (v) => `${2 * v + 1} × ${2 * v + 1}` }, (v) => { s.half = v; redraw(); }),
    slider('Max disparity', { min: 8, max: 32, step: 1, value: s.maxd, fmt: (v) => v + ' px' }, (v) => { s.maxd = v; redraw(); }));
  redraw();
};

// ---- p17-l13: Lucas-Kanade on one window ----
W.flow = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { dx: 1.3, dy: -0.7, half: 7, pat: 'tex', pyr: false }, N = 96;
  const p = new Plot(body, { aspect: 1, maxH: 360, x: [0, N], y: [0, N], equal: true, label: 'Second frame with the tracking window and the estimated motion' });
  const tex = (x, y) => (s.pat === 'tex' ? texAt(2 * x, 2 * y) : 128 + 80 * Math.sin(0.4 * x));
  const render = (ox, oy, sc = 1) => { const n = Math.round(N / sc), a = new Float64Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) a[y * n + x] = tex(x * sc - ox, y * sc - oy); return { a, n }; };
  const bil = (I, x, y) => { x = clamp(x, 0, I.n - 1.001); y = clamp(y, 0, I.n - 1.001); const x0 = Math.floor(x), y0 = Math.floor(y), ax = x - x0, ay = y - y0, A = I.a, n = I.n; return (1 - ay) * ((1 - ax) * A[y0 * n + x0] + ax * A[y0 * n + x0 + 1]) + ay * ((1 - ax) * A[(y0 + 1) * n + x0] + ax * A[(y0 + 1) * n + x0 + 1]); };
  const lk = (I0, I1, cx, cy, d0, trace) => {
    const pts = []; for (let j = -s.half; j <= s.half; j++) for (let i = -s.half; i <= s.half; i++) { const x = cx + i, y = cy + j; pts.push([x, y, (bil(I0, x + 1, y) - bil(I0, x - 1, y)) / 2, (bil(I0, x, y + 1) - bil(I0, x, y - 1)) / 2, bil(I0, x, y)]); }
    let a = 0, b = 0, c = 0; for (const q of pts) { a += q[2] * q[2]; b += q[2] * q[3]; c += q[3] * q[3]; } const tt = (a + c) / 2, qq = Math.sqrt(((a - c) / 2) ** 2 + b * b), ev = [tt - qq, tt + qq];
    if (ev[0] < 1e-6 * ev[1] + 1e-9) return { d: null, ev }; let d = [...d0];
    for (let it = 0; it < 20; it++) { let ex = 0, ey = 0; for (const q of pts) { const e = bil(I1, q[0] + d[0], q[1] + d[1]) - q[4]; ex += q[2] * e; ey += q[3] * e; } const det = a * c - b * b, sx = -(c * ex - b * ey) / det, sy = -(a * ey - b * ex) / det; d = [d[0] + sx, d[1] + sy]; if (trace) trace.push([...d]); if (Math.hypot(sx, sy) < 1e-4) break; }
    return { d, ev };
  };
  const redraw = () => {
    const I0 = render(0, 0), I1 = render(s.dx, s.dy), c = N / 2, trace = [[0, 0]]; let res;
    if (s.pyr) { let d = [0, 0]; for (const L of [4, 2, 1]) { const r = lk(render(0, 0, L), render(s.dx, s.dy, L), c / L, c / L, [d[0] / L, d[1] / L], L === 1 ? trace : null); if (!r.d) { res = r; break; } d = [r.d[0] * L, r.d[1] * L]; res = { d, ev: r.ev }; if (L > 1) trace.push([...d]); } }
    else res = lk(I0, I1, c, c, [0, 0], trace);
    p.draw = (P) => { drawImg(P, N, N, greyPx(I1.a), 0, 0, N, N); const w = s.half; P.poly([[c - w, N - c - w], [c + w, N - c - w], [c + w, N - c + w], [c - w, N - c + w]], null, C.signal);
      const k = 3; P.arrow(c, N - c, c + k * s.dx, N - c - k * s.dy, C.bone, 2); if (res.d) { P.line(trace.map((q) => c + k * q[0]), trace.map((q) => N - c - k * q[1]), C.warn, 1.2); P.arrow(c, N - c, c + k * res.d[0], N - c - k * res.d[1], C.lime, 2.6); } };
    p.redraw(); const err = res.d ? Math.hypot(res.d[0] - s.dx, res.d[1] - s.dy) : NaN;
    read.innerHTML = `true motion (${s.dx.toFixed(1)}, ${s.dy.toFixed(1)}) px (white, arrows ×3) · ${res.d ? `estimate ${sp(C.lime, `(${res.d[0].toFixed(2)}, ${res.d[1].toFixed(2)})`)} after ${trace.length - 1} steps${s.pyr ? ' (3-level pyramid)' : ''}, error ${err < 0.2 ? ok(err.toFixed(3) + ' px') : bad(err.toFixed(2) + ' px')}` : bad('untrackable: aperture problem')} · structure tensor eigenvalues ${res.ev.map((v) => v.toExponential(1)).join(' and ')}`;
  };
  ctrls.append(slider('Motion x', { min: -8, max: 8, step: 0.1, value: s.dx, fmt: (v) => v.toFixed(1) + ' px' }, (v) => { s.dx = v; redraw(); }),
    slider('Motion y', { min: -8, max: 8, step: 0.1, value: s.dy, fmt: (v) => v.toFixed(1) + ' px' }, (v) => { s.dy = v; redraw(); }),
    slider('Window', { min: 2, max: 15, step: 1, value: s.half, fmt: (v) => `${2 * v + 1} × ${2 * v + 1}` }, (v) => { s.half = v; redraw(); }),
    select('Pattern', [['tex', 'texture'], ['stripes', 'vertical stripes']], s.pat, (v) => { s.pat = v; redraw(); }, 'flow-pat'),
    toggle('Pyramid (3 levels)', s.pyr, (v) => { s.pyr = v; redraw(); }, { id: 'flow-pyr' }));
  redraw();
};

// ---- p17-l14: odometry drift, Monte Carlo against the error model ----
W.drift = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 1, mis: 0, dist: 5 }, B = 0.4, STEP = 0.05;
  const p = new Plot(body, { aspect: 0.75, maxH: 360, x: [-0.5, 5.5], y: [-2, 2], equal: true, label: 'Simulated runs told to drive straight, with the predicted 2-sigma ellipse' });
  const stepP = (x, dl, dr) => { const ds = (dl + dr) / 2, dth = (dr - dl) / B, c = Math.abs(dth) > 1e-12 ? ds * Math.sin(dth / 2) / (dth / 2) : ds; return [x[0] + c * Math.cos(x[2] + dth / 2), x[1] + c * Math.sin(x[2] + dth / 2), x[2] + dth]; };
  const redraw = () => {
    const n = Math.round(s.dist / STEP), k = s.k / 100, dl = STEP, dr = STEP * (1 + s.mis / 100), g = gauss(rng(3)), runs = [], ends = [];
    for (let r = 0; r < 150; r++) { let x = [0, 0, 0]; const tr_ = [[0, 0]]; for (let i = 0; i < n; i++) { x = stepP(x, dl + k * Math.sqrt(dl) * g(), dr + k * Math.sqrt(dr) * g()); if (r < 20) tr_.push([x[0], x[1]]); } ends.push(x); if (r < 20) runs.push(tr_); }
    let x = [0, 0, 0], P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < n; i++) { const ds = (dl + dr) / 2, dth = (dr - dl) / B, a = x[2] + dth / 2, F = [[1, 0, -ds * Math.sin(a)], [0, 1, ds * Math.cos(a)], [0, 0, 1]], G = [[Math.cos(a), -ds * Math.sin(a) / 2], [Math.sin(a), ds * Math.cos(a) / 2], [0, 1]];
      const M = [[0.5, 0.5], [-1 / B, 1 / B]], Qw = [[k * k * dl, 0], [0, k * k * dr]], Q = mm(mm(M, Qw), tr(M)), GQG = mm(mm(G, Q), tr(G)); P = mm(mm(F, P), tr(F)).map((r, ii) => r.map((v, jj) => v + GQG[ii][jj])); x = stepP(x, dl, dr); }
    const mx = ends.reduce((a, e) => a + e[0], 0) / ends.length, my = ends.reduce((a, e) => a + e[1], 0) / ends.length, sy = Math.sqrt(ends.reduce((a, e) => a + (e[1] - my) ** 2, 0) / ends.length), sth = Math.sqrt(ends.reduce((a, e) => a + e[2] ** 2, 0) / ends.length - (ends.reduce((a, e) => a + e[2], 0) / ends.length) ** 2);
    const span = Math.max(s.dist * 1.1, 1), yr = Math.max(span * 0.4, Math.abs(x[1]) + 3 * Math.sqrt(P[1][1]) + 0.2);
    p.setRange([-0.1 * span, span], [-yr, yr]);
    p.draw = (Q) => { Q.axes({ xl: 'x (m)', yl: 'y (m)' }); Q.line([0, s.dist], [0, 0], C.dim, 1, [4, 4]); for (const t of runs) Q.line(t.map((q) => q[0]), t.map((q) => q[1]), 'rgba(111,211,255,.35)', 1); for (const e of ends) Q.dot(e[0], e[1], C.bone, 1.8); ellipse(Q, x[0], x[1], [[P[0][0], P[0][1]], [P[1][0], P[1][1]]], C.lime); Q.dot(x[0], x[1], C.lime, 4); };
    p.redraw();
    read.innerHTML = `after ${s.dist} m · 150 Monte Carlo runs: sideways sigma ${(100 * sy).toFixed(1)} cm, heading sigma ${(sth / D2R).toFixed(2)}° · ${sp(C.lime, 'linear error model')}: ${(100 * Math.sqrt(P[1][1])).toFixed(1)} cm and ${(Math.sqrt(P[2][2]) / D2R).toFixed(2)}° · mean end point (${mx.toFixed(2)}, ${my.toFixed(2)}) m${s.mis ? ` · the ${s.mis}% wheel mismatch alone curves the run ${(100 * x[1]).toFixed(1)} cm sideways` : ''}`;
  };
  ctrls.append(slider('Wheel noise k', { min: 0, max: 3, step: 0.1, value: s.k, fmt: (v) => v.toFixed(1) + ' cm/√m' }, (v) => { s.k = v; redraw(); }),
    slider('Right wheel larger by', { min: -1, max: 1, step: 0.05, value: s.mis, fmt: (v) => v.toFixed(2) + ' %' }, (v) => { s.mis = v; redraw(); }),
    slider('Distance', { min: 1, max: 20, step: 0.5, value: s.dist, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.dist = v; redraw(); }));
  redraw();
};

// ---- p17-l15: Monte Carlo localisation ----
const MCLW = [[0, 0, 8, 0], [8, 0, 8, 5], [8, 5, 3, 5], [3, 5, 3, 4], [3, 4, 0, 4], [0, 4, 0, 0], [5, 1.5, 6, 1.5], [6, 1.5, 6, 2.5], [6, 2.5, 5, 2.5], [5, 2.5, 5, 1.5], [1.5, 0, 1.5, 1.2]];
const mclFree = (x, y) => x > 0.1 && x < 7.9 && y > 0.1 && (y < 3.9 || x > 3.1) && y < 4.9 && !(x > 4.9 && x < 6.1 && y > 1.4 && y < 2.6) && !(x > 1.4 && x < 1.6 && y < 1.3);
const BEAMS6 = [-180, -120, -60, 0, 60, 120].map((d) => d * D2R);
function cast(x, y, a, walls = MCLW, maxR = 4) { const dx = Math.cos(a), dy = Math.sin(a); let best = maxR; for (const [x1, y1, x2, y2] of walls) { const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue; const t = ((x1 - x) * ey - (y1 - y) * ex) / den, u = ((x1 - x) * dy - (y1 - y) * dx) / den; if (t > 0 && u >= 0 && u <= 1 && t < best) best = t; } return best; }
function mclRoute() { const pts = [[1, 2.5], [4, 3.2], [7, 3.8], [7, 0.8], [3, 0.8], [2.5, 2.5]], poses = [[1, 2.5, 0]]; for (let k = 1; k < pts.length; k++) { const [a, b] = [pts[k - 1], pts[k]], th = Math.atan2(b[1] - a[1], b[0] - a[0]), n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2); for (let i = 1; i <= n; i++) poses.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, th]); } poses[0][2] = poses[1][2]; return poses; }
function mclRun(N, seed) {
  const r = rng(seed), g = gauss(rng(seed + 50)), truth = mclRoute(); let P = []; while (P.length < N) { const q = [8 * r(), 5 * r(), Math.PI * (2 * r() - 1)]; if (mclFree(q[0], q[1])) P.push(q); }
  const snaps = [{ P: P.slice(0, 600).map((q) => [...q]), w: null, est: null }];
  for (let k = 1; k < truth.length; k++) {
    const a = truth[k - 1], b = truth[k], ds = Math.hypot(b[0] - a[0], b[1] - a[1]), dth = wrapA(b[2] - a[2]);
    P = P.map((q) => { const s_ = ds + g() * (0.05 * ds + 0.01), rt = dth + g() * (0.02 + 0.05 * Math.abs(dth)), th = q[2] + rt / 2; return [q[0] + s_ * Math.cos(th), q[1] + s_ * Math.sin(th), q[2] + rt]; });
    const z = BEAMS6.map((be) => cast(b[0], b[1], b[2] + be) + 0.25 * g());
    const lw = P.map((q) => (mclFree(q[0], q[1]) ? BEAMS6.reduce((acc, be, i) => acc + Math.log(0.9 * Math.exp(-0.5 * ((cast(q[0], q[1], q[2] + be) - z[i]) / 0.25) ** 2) + 0.02), 0) : -Infinity));
    const mx = Math.max(...lw); let w = lw.map((v) => Math.exp(v - mx)); const sw = w.reduce((x, y) => x + y, 0); w = w.map((v) => v / sw);
    const ex = w.reduce((acc, v, i) => acc + v * P[i][0], 0), ey = w.reduce((acc, v, i) => acc + v * P[i][1], 0), spread = Math.sqrt(w.reduce((acc, v, i) => acc + v * ((P[i][0] - ex) ** 2 + (P[i][1] - ey) ** 2), 0)), neff = 1 / w.reduce((acc, v) => acc + v * v, 0);
    snaps.push({ P: P.slice(0, 600).map((q) => [...q]), est: [ex, ey], spread, neff, err: Math.hypot(ex - b[0], ey - b[1]), z });
    if (neff < N / 2) { const u0 = r() / N, c = []; let acc = 0; for (const v of w) c.push((acc += v)); const NP = []; let j = 0; for (let i = 0; i < N; i++) { const u = u0 + i / N; while (j < N - 1 && c[j] < u) j++; NP.push([...P[j]]); } P = NP; }
  }
  return { truth, snaps };
}
W.mcl = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 0, N: 1000, seed: 1 };
  const p = new Plot(body, { aspect: 0.66, maxH: 360, x: [-0.2, 8.2], y: [-0.2, 5.2], equal: true, label: 'Particles in the room and the true robot pose' });
  let run = null;
  const redraw = () => {
    const sn = run.snaps[s.k], tp = run.truth[s.k];
    p.draw = (P) => { P.axes({}); for (const [x1, y1, x2, y2] of MCLW) P.line([x1, x2], [y1, y2], C.bone, 2.5);
      for (const q of sn.P) { P.ctx.fillStyle = 'rgba(111,211,255,.55)'; P.ctx.fillRect(P.sx(q[0]) - 1.2, P.sy(q[1]) - 1.2, 2.4, 2.4); }
      P.line(run.truth.slice(0, s.k + 1).map((q) => q[0]), run.truth.slice(0, s.k + 1).map((q) => q[1]), 'rgba(198,255,26,.4)', 1.2);
      if (sn.z) BEAMS6.forEach((be, i) => { const a = tp[2] + be; P.line([tp[0], tp[0] + sn.z[i] * Math.cos(a)], [tp[1], tp[1] + sn.z[i] * Math.sin(a)], 'rgba(255,181,71,.6)', 1); });
      robotGlyph(P, tp[0], tp[1], tp[2], C.lime, 0.25); if (sn.est) P.dot(sn.est[0], sn.est[1], C.warn, 4); };
    p.redraw();
    read.innerHTML = s.k === 0 ? `step 0: ${s.N} particles spread over the whole room (global uncertainty) · move the step slider` :
      `step ${s.k} of ${run.truth.length - 1} · estimate ${sp(C.warn, 'amber')} is ${sn.err < 0.3 ? ok((100 * sn.err).toFixed(0) + ' cm') : bad((100 * sn.err).toFixed(0) + ' cm')} from the truth · weighted spread ${(100 * sn.spread).toFixed(0)} cm · effective sample size ${sn.neff.toFixed(0)} of ${s.N} · ${sp(C.warn, 'beams')}: the 6-beam scan (illustrative)`;
  };
  const build = () => { run = mclRun(s.N, s.seed); };
  const ks = slider('Step', { min: 0, max: 76, step: 1, value: s.k }, (v) => { s.k = v; redraw(); });
  ctrls.append(ks, select('Particles', [['300', '300'], ['1000', '1000'], ['3000', '3000']], String(s.N), (v) => { s.N = +v; build(); redraw(); }, 'mcl-n'),
    button('New random run', () => { s.seed++; build(); redraw(); }, 'mcl-seed'));
  build(); redraw();
};

// ---- p17-l16: EKF localisation with known landmarks ----
const LM5 = [[2, 1], [8.5, 1], [5, 8], [2, 7], [9.5, 9.5]];
function ekfLocRun(scale, useLm, seed = 1) {
  const g = gauss(rng(seed)), qd = 0.05, qa = 1 * D2R, rr = 0.1 * scale, rb = 2 * D2R * scale, u = [0.1, 2 * Math.PI / 300];
  const mot = (x, a) => { const th = x[2] + a[1] / 2; return [x[0] + a[0] * Math.cos(th), x[1] + a[0] * Math.sin(th), wrapA(x[2] + a[1])]; };
  let x = [5, 1, 0], xh = [5.05, 0.95, 0.02], P = [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.0025]]; const out = [];
  for (let k = 0; k < 600; k++) {
    x = mot(x, [u[0] + qd * g(), u[1] + qa * g()]); const th = xh[2] + u[1] / 2, F = [[1, 0, -u[0] * Math.sin(th)], [0, 1, u[0] * Math.cos(th)], [0, 0, 1]], G = [[Math.cos(th), -u[0] * Math.sin(th) / 2], [Math.sin(th), u[0] * Math.cos(th) / 2], [0, 1]];
    const GQG = mm(mm(G, [[qd * qd, 0], [0, qa * qa]]), tr(G)); P = mm(mm(F, P), tr(F)).map((r, i) => r.map((v, j) => v + GQG[i][j])); xh = mot(xh, u); const seen = [];
    if (useLm) LM5.forEach((m, i) => { const d = [m[0] - x[0], m[1] - x[1]], rg = Math.hypot(...d); if (rg < 0.5 || rg > 6) return; seen.push(i);
      const z = [rg + rr * g(), wrapA(Math.atan2(d[1], d[0]) - x[2]) + rb * g()], e = [m[0] - xh[0], m[1] - xh[1]], q = e[0] * e[0] + e[1] * e[1], sq = Math.sqrt(q);
      const H = [[-e[0] / sq, -e[1] / sq, 0], [e[1] / q, -e[0] / q, -1]], S = mm(mm(H, P), tr(H)).map((r, a) => r.map((v, b) => v + (a === b ? [rr * rr, rb * rb][a] : 0)));
      const det = S[0][0] * S[1][1] - S[0][1] * S[1][0], Si = [[S[1][1] / det, -S[0][1] / det], [-S[1][0] / det, S[0][0] / det]], K = mm(mm(P, tr(H)), Si);
      const nu = [z[0] - sq, wrapA(z[1] - wrapA(Math.atan2(e[1], e[0]) - xh[2]))]; xh = xh.map((v, a) => v + K[a][0] * nu[0] + K[a][1] * nu[1]); xh[2] = wrapA(xh[2]);
      const IKH = [0, 1, 2].map((a) => [0, 1, 2].map((b) => (a === b ? 1 : 0) - K[a][0] * H[0][b] - K[a][1] * H[1][b])), KRK = mm(mm(K, [[rr * rr, 0], [0, rb * rb]]), tr(K)); P = mm(mm(IKH, P), tr(IKH)).map((r, a) => r.map((v, b) => v + KRK[a][b])); });
    out.push({ x: [...x], xh: [...xh], P: P.map((r) => [...r]), seen });
  }
  return out;
}
W.ekfloc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 150, scale: 1, lm: true };
  const p = new Plot(body, { aspect: 0.9, maxH: 380, x: [-0.5, 11], y: [-0.8, 11], equal: true, label: 'Landmarks, the true path and the EKF estimate with its 2-sigma ellipse' });
  let run = null;
  const redraw = () => {
    const r = run[s.k], sig = Math.sqrt(r.P[0][0] + r.P[1][1]), err = Math.hypot(r.x[0] - r.xh[0], r.x[1] - r.xh[1]);
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); for (const [a, b] of LM5) { P.line([a - 0.2, a + 0.2], [b, b], C.warn, 2); P.line([a, a], [b - 0.2, b + 0.2], C.warn, 2); }
      const seg = run.slice(0, s.k + 1); P.line(seg.map((q) => q.x[0]), seg.map((q) => q.x[1]), 'rgba(236,238,230,.5)', 1.2); P.line(seg.map((q) => q.xh[0]), seg.map((q) => q.xh[1]), C.signal, 1.6);
      for (const i of r.seen) P.line([r.x[0], LM5[i][0]], [r.x[1], LM5[i][1]], 'rgba(255,181,71,.45)', 1);
      ellipse(P, r.xh[0], r.xh[1], [[r.P[0][0], r.P[0][1]], [r.P[1][0], r.P[1][1]]], C.lime); robotGlyph(P, r.x[0], r.x[1], r.x[2], C.bone, 0.3); P.dot(r.xh[0], r.xh[1], C.lime, 3); };
    p.redraw();
    read.innerHTML = `step ${s.k} (${(0.1 * s.k).toFixed(1)} m driven) · ${r.seen.length} landmark${r.seen.length === 1 ? '' : 's'} in view · error ${(100 * err).toFixed(1)} cm, filter sigma ${(100 * sig).toFixed(1)} cm ${err < 2 * sig + 0.02 ? ok('consistent') : sp(C.warn, 'outside 2σ')} · ${s.lm ? 'the ellipse grows between sightings and shrinks at each one' : bad('odometry only: the error grows without bound')}`;
  };
  const build = () => { run = ekfLocRun(s.scale, s.lm); };
  ctrls.append(slider('Step', { min: 0, max: 599, step: 1, value: s.k }, (v) => { s.k = v; redraw(); }),
    select('Sensor noise', [['0.5', 'half (5 cm, 1°)'], ['1', 'lesson (10 cm, 2°)'], ['2', 'double (20 cm, 4°)']], String(s.scale), (v) => { s.scale = +v; build(); redraw(); }, 'ekf-noise'),
    toggle('Use landmarks', s.lm, (v) => { s.lm = v; build(); redraw(); }, { id: 'ekf-lm' }));
  build(); redraw();
};

// ---- p17-l17: occupancy grid mapping ----
const OGW = 160, OGH = 100, RES = 0.05;
let OGT = null;
function ogTruth() { if (OGT) return OGT; const g = new Uint8Array(OGW * OGH); for (let i = 0; i < OGH; i++) for (let j = 0; j < OGW; j++) { if (i < 2 || i >= OGH - 2 || j < 2 || j >= OGW - 2 || (i >= 30 && i < 50 && j >= 100 && j < 120) || (i < 24 && j >= 30 && j < 33) || (i >= 70 && j >= 60 && j < 63)) g[i * OGW + j] = 1; } return (OGT = g); }
W.occgrid = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 5 }, T = ogTruth();
  const p = new Plot(body, { aspect: 0.66, maxH: 360, x: [0, 8], y: [0, 5], equal: true, label: 'Occupancy grid built from the scans so far' });
  const castG = (x, y, a) => { for (let r = 0; r < 6; r += RES / 4) { const i = Math.floor((y + r * Math.sin(a)) / RES), j = Math.floor((x + r * Math.cos(a)) / RES); if (i < 0 || i >= OGH || j < 0 || j >= OGW) return [r, false]; if (T[i * OGW + j]) return [r, true]; } return [6, false]; };
  const brz = (i0, j0, i1, j1, f) => { const di = Math.abs(i1 - i0), dj = Math.abs(j1 - j0), si = i1 > i0 ? 1 : -1, sj = j1 > j0 ? 1 : -1; let e = dj - di; for (;;) { if (i0 === i1 && j0 === j1) return; f(i0, j0); const e2 = 2 * e; if (e2 > -di) { e -= di; j0 += sj; } if (e2 < dj) { e += dj; i0 += si; } } };
  const SCANS = []; { const g = gauss(rng(2)); for (let k = 0; k < 20; k++) { const t = k / 19, x = 0.8 + 6.4 * t, y = 2.5 - 0.8 * Math.sin(2 * Math.PI * t), th = 0.3 * t, beams = []; for (let d = 0; d < 360; d += 2) { const a = th + d * D2R, [r, hit] = castG(x, y, a); beams.push([a, r + 0.02 * g(), hit]); } SCANS.push({ x, y, beams }); } }
  const redraw = () => {
    const L = new Float64Array(OGW * OGH), path = [];
    for (let k = 0; k < s.n; k++) { const S = SCANS[Math.round(k * 19 / Math.max(s.n - 1, 1))]; path.push([S.x, S.y]); const i0 = Math.floor(S.y / RES), j0 = Math.floor(S.x / RES);
      for (const [a, r, hit] of S.beams) { const i1 = clamp(Math.floor((S.y + r * Math.sin(a)) / RES), 0, OGH - 1), j1 = clamp(Math.floor((S.x + r * Math.cos(a)) / RES), 0, OGW - 1); brz(i0, j0, i1, j1, (i, j) => { L[i * OGW + j] = clamp(L[i * OGW + j] - 0.4, -4, 4); }); L[i1 * OGW + j1] = clamp(L[i1 * OGW + j1] + (hit ? 0.85 : -0.4), -4, 4); } }
    let seen = 0, right = 0; for (let i = 0; i < OGW * OGH; i++) if (Math.abs(L[i]) > 0.5) { seen++; if ((L[i] > 0) === !!T[i]) right++; }
    p.draw = (P) => { drawImg(P, OGW, OGH, (q) => { const i = OGH - 1 - Math.floor(q / OGW), j = q % OGW, v = L[i * OGW + j]; if (Math.abs(v) <= 0.5 && v === 0) return [70, 72, 66]; const pr = 1 - 1 / (1 + Math.exp(v)); const c = Math.round(20 + 230 * pr); return [c, c, Math.round(c * 0.9)]; }, 0, 0, 8, 5);
      P.line(path.map((q) => q[0]), path.map((q) => q[1]), C.signal, 1.5); for (const q of path) P.dot(q[0], q[1], C.lime, 3); };
    p.redraw();
    read.innerHTML = `${s.n} scan${s.n > 1 ? 's' : ''} of 180 beams from known poses (lime) · ${(100 * seen / (OGW * OGH)).toFixed(1)} % of cells observed (|log-odds| > 0.5) · ${(100 * right / Math.max(seen, 1)).toFixed(1)} % of those classified correctly against the illustrative truth · grey: never touched, dark: free, bright: occupied`;
  };
  ctrls.append(slider('Scans integrated', { min: 1, max: 20, step: 1, value: s.n }, (v) => { s.n = v; redraw(); }));
  redraw();
};

// ---- p17-l18: ICP, iteration by iteration ----
function icpScene() {
  const segs = [[0, 0, 6, 0], [6, 0, 6, 3], [6, 3, 3, 3], [3, 3, 3, 5], [3, 5, 0, 5], [0, 5, 0, 0], [1.5, 1, 2.3, 1], [2.3, 1, 2.3, 1.6], [2.3, 1.6, 1.5, 1.6], [1.5, 1.6, 1.5, 1]], pts = [];
  for (const [a, b, c, d] of segs) { const n = Math.round(Math.hypot(c - a, d - b) * 20); for (let i = 0; i < n; i++) pts.push([a + (c - a) * i / n, b + (d - b) * i / n]); } return pts;
}
const se2 = (x, y, t) => [[Math.cos(t), -Math.sin(t), x], [Math.sin(t), Math.cos(t), y], [0, 0, 1]];
const tf = (T, p) => [T[0][0] * p[0] + T[0][1] * p[1] + T[0][2], T[1][0] * p[0] + T[1][1] * p[1] + T[1][2]];
const inv2 = (T) => { const c = T[0][0], s_ = T[1][0], x = T[0][2], y = T[1][2]; return [[c, s_, -c * x - s_ * y], [-s_, c, s_ * x - c * y], [0, 0, 1]]; };
W.icp = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { dx: 15, ang: 10, it: 0 };
  const p = new Plot(body, { aspect: 1, maxH: 380, x: [-2.6, 4.6], y: [-2.4, 3.6], equal: true, label: 'Target scan, source scan moved by the current ICP estimate, and the pairs' });
  const pts = icpScene(), r = rng(1), g = gauss(rng(2)), T1 = se2(2, 2, 0.1), T2 = se2(2.3, 1.9, 0.25);
  const scan = (T) => pts.filter(() => r() < 0.8).map((q) => tf(inv2(T), q).map((v) => v + 0.01 * g()));
  const dst = scan(T1), src = scan(T2), Trel = mm(inv2(T1), T2);
  let hist = null;
  const run = () => {
    let T = mm(Trel, se2(s.dx / 100 * Math.cos(0.6), s.dx / 100 * Math.sin(0.6), s.ang * D2R)); hist = [{ T, pairs: null, rms: NaN }];
    for (let k = 0; k < 30; k++) {
      const P = src.map((q) => tf(T, q)), pairs = []; let se = 0;
      for (let i = 0; i < P.length; i++) { let bd = Infinity, bj = -1; for (let j = 0; j < dst.length; j++) { const d = (P[i][0] - dst[j][0]) ** 2 + (P[i][1] - dst[j][1]) ** 2; if (d < bd) { bd = d; bj = j; } } if (bd < 0.25) { pairs.push([i, bj]); se += bd; } }
      hist[k].pairs = pairs; hist[k].rms = Math.sqrt(se / Math.max(pairs.length, 1));
      let ax = 0, ay = 0, bx = 0, by = 0; for (const [i, j] of pairs) { ax += P[i][0]; ay += P[i][1]; bx += dst[j][0]; by += dst[j][1]; } const n = pairs.length; ax /= n; ay /= n; bx /= n; by /= n;
      let sxx = 0, sxy = 0; for (const [i, j] of pairs) { const u = [P[i][0] - ax, P[i][1] - ay], v = [dst[j][0] - bx, dst[j][1] - by]; sxx += u[0] * v[0] + u[1] * v[1]; sxy += u[0] * v[1] - u[1] * v[0]; }
      const th = Math.atan2(sxy, sxx), c = Math.cos(th), sn = Math.sin(th), D = [[c, -sn, bx - (c * ax - sn * ay)], [sn, c, by - (sn * ax + c * ay)], [0, 0, 1]]; T = mm(D, T); hist.push({ T, pairs: null, rms: NaN });
    }
  };
  const redraw = () => {
    const H = hist[s.it], T = H.T, E = mm(inv2(Trel), T), ep = Math.hypot(E[0][2], E[1][2]), ea = Math.abs(Math.atan2(E[1][0], E[0][0])) / D2R, P = src.map((q) => tf(T, q));
    p.draw = (Q) => { Q.axes({}); for (const q of dst) Q.dot(q[0], q[1], C.lime, 1.6); if (H.pairs) for (const [i, j] of H.pairs) if (i % 3 === 0) Q.line([P[i][0], dst[j][0]], [P[i][1], dst[j][1]], 'rgba(255,181,71,.55)', 1); for (const q of P) Q.dot(q[0], q[1], C.signal, 1.6); };
    p.redraw();
    read.innerHTML = `iteration ${s.it} · ${sp(C.lime, 'target')} and ${sp(C.signal, 'source')} scans of an illustrative room · pose error ${ep < 0.01 && ea < 0.3 ? ok(`${(100 * ep).toFixed(1)} cm, ${ea.toFixed(2)}°`) : sp(C.warn, `${(100 * ep).toFixed(1)} cm, ${ea.toFixed(2)}°`)}${H.pairs ? ` · ${H.pairs.length} pairs within 0.5 m (every third drawn), RMS ${(100 * H.rms).toFixed(1)} cm` : ''}`;
  };
  const its = slider('Iteration', { min: 0, max: 30, step: 1, value: s.it }, (v) => { s.it = v; redraw(); });
  ctrls.append(slider('Initial offset', { min: 0, max: 60, step: 1, value: s.dx, fmt: (v) => v + ' cm' }, (v) => { s.dx = v; run(); redraw(); }),
    slider('Initial rotation', { min: -90, max: 90, step: 1, value: s.ang, fmt: (v) => v + '°' }, (v) => { s.ang = v; run(); redraw(); }), its);
  run(); redraw();
};

// ---- p17-l19: EKF-SLAM around a loop ----
const LM8 = [[0, 6.5], [4.5, 4.5], [6.5, 0], [4.5, -4.5], [0, -6.5], [-4.5, -4.5], [-6.5, 0], [-4.5, 4.5]];
function slamRun() {
  const g = gauss(rng(4)), qd = 0.01, qa = 0.2 * D2R, rr = 0.1, rb = 2 * D2R, n = 400, u = [2 * Math.PI * 5 / n, 2 * Math.PI / n];
  const mot = (x, a) => { const th = x[2] + a[1] / 2; return [x[0] + a[0] * Math.cos(th), x[1] + a[0] * Math.sin(th), wrapA(x[2] + a[1])]; };
  let x = [5, 0, Math.PI / 2], m = [5, 0, Math.PI / 2], P = [[1e-12, 0, 0], [0, 1e-12, 0], [0, 0, 1e-12]], closed = -1; const ids = {}, out = [];
  for (let k = 0; k < 500; k++) {
    x = mot(x, [u[0] + qd * g(), u[1] + qa * g()]); const N = m.length, th = m[2] + u[1] / 2;
    const F = (i, j) => (i === j ? 1 : 0) + (j === 2 && i === 0 ? -u[0] * Math.sin(th) : 0) + (j === 2 && i === 1 ? u[0] * Math.cos(th) : 0);
    const Fm = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (__, j) => F(i, j))), G = [[Math.cos(th), -u[0] * Math.sin(th) / 2], [Math.sin(th), u[0] * Math.cos(th) / 2], [0, 1]], GQG = mm(mm(G, [[qd * qd, 0], [0, qa * qa]]), tr(G));
    P = mm(mm(Fm, P), tr(Fm)); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P[i][j] += GQG[i][j]; m = [...mot(m, u), ...m.slice(3)];
    const seen = [];
    LM8.forEach((L, li) => { const d = [L[0] - x[0], L[1] - x[1]], rg = Math.hypot(...d), be = wrapA(Math.atan2(d[1], d[0]) - x[2]); if (rg > 3.5 || Math.abs(be) > 60 * D2R) return; seen.push(li); const z = [rg + rr * g(), be + rb * g()];
      if (!(li in ids)) { const a = m[2] + z[1], lm = [m[0] + z[0] * Math.cos(a), m[1] + z[0] * Math.sin(a)], Gx = [[1, 0, -z[0] * Math.sin(a)], [0, 1, z[0] * Math.cos(a)]], Gz = [[Math.cos(a), -z[0] * Math.sin(a)], [Math.sin(a), z[0] * Math.cos(a)]];
        const n0 = m.length, Prr = P.slice(0, 3).map((r) => r.slice(0, 3)), Pmm = mm(mm(Gx, Prr), tr(Gx)).map((r, i) => r.map((v, j) => v + mm(mm(Gz, [[rr * rr, 0], [0, rb * rb]]), tr(Gz))[i][j])), Pmx = mm(Gx, P.slice(0, 3));
        P = P.map((r, i) => [...r, Pmx[0][i], Pmx[1][i]]); P.push([...Pmx[0], Pmm[0][0], Pmm[0][1]], [...Pmx[1], Pmm[1][0], Pmm[1][1]]); m = [...m, ...lm]; ids[li] = n0; return; }
      const j = ids[li], e = [m[j] - m[0], m[j + 1] - m[1]], q = e[0] * e[0] + e[1] * e[1], sq = Math.sqrt(q), N2 = m.length, H = [Array(N2).fill(0), Array(N2).fill(0)];
      H[0][0] = -e[0] / sq; H[0][1] = -e[1] / sq; H[1][0] = e[1] / q; H[1][1] = -e[0] / q; H[1][2] = -1; H[0][j] = e[0] / sq; H[0][j + 1] = e[1] / sq; H[1][j] = -e[1] / q; H[1][j + 1] = e[0] / q;
      const PH = mm(P, tr(H)), S = mm(H, PH); S[0][0] += rr * rr; S[1][1] += rb * rb; const det = S[0][0] * S[1][1] - S[0][1] * S[1][0], Si = [[S[1][1] / det, -S[0][1] / det], [-S[1][0] / det, S[0][0] / det]], K = mm(PH, Si);
      const nu = [z[0] - sq, wrapA(z[1] - wrapA(Math.atan2(e[1], e[0]) - m[2]))]; m = m.map((v, a) => v + K[a][0] * nu[0] + K[a][1] * nu[1]); m[2] = wrapA(m[2]);
      const KH = mm(K, H); P = P.map((r, a) => r.map((v, b) => v - KH[a].reduce((acc, kv, c) => acc + kv * P[c][b], 0))); P = P.map((r, a) => r.map((v, b) => 0.5 * (v + P[b][a]))); });
    if (closed < 0 && k > 200 && seen.some((li) => ids[li] === 3)) closed = k;   // the first landmark mapped, seen again
    out.push({ x: [...x], m: [...m], P: P.map((r) => [...r]), ids: { ...ids }, seen, closed });
  }
  return out;
}
let SLAM = null;
W.ekfslam = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 440 };
  const p = new Plot(body, { aspect: 1, maxH: 400, x: [-8, 8], y: [-8, 8], equal: true, label: 'True landmarks, estimated landmarks with 2-sigma ellipses, and the robot' });
  if (!SLAM) SLAM = slamRun();
  const redraw = () => {
    const r = SLAM[s.k], m = r.m, P = r.P, rs = Math.sqrt(P[0][0] + P[1][1]), ls = Object.values(r.ids).map((j) => Math.sqrt(P[j][j] + P[j + 1][j + 1])), lsm = ls.length ? ls.reduce((a, b) => a + b, 0) / ls.length : 0;
    p.draw = (Q) => { Q.axes({ xl: 'x (m)', yl: 'y (m)' }); for (const [a, b] of LM8) { Q.line([a - 0.25, a + 0.25], [b, b], C.dim, 1.5); Q.line([a, a], [b - 0.25, b + 0.25], C.dim, 1.5); }
      const seg = SLAM.slice(0, s.k + 1); Q.line(seg.map((q) => q.x[0]), seg.map((q) => q.x[1]), 'rgba(236,238,230,.45)', 1); Q.line(seg.map((q) => q.m[0]), seg.map((q) => q.m[1]), C.signal, 1.4);
      for (const [li, j] of Object.entries(r.ids)) { ellipse(Q, m[j], m[j + 1], [[P[j][j], P[j][j + 1]], [P[j + 1][j], P[j + 1][j + 1]]], r.seen.includes(+li) ? C.warn : C.lime); Q.dot(m[j], m[j + 1], C.lime, 3); }
      for (const li of r.seen) Q.line([r.x[0], LM8[li][0]], [r.x[1], LM8[li][1]], 'rgba(255,181,71,.5)', 1);
      ellipse(Q, m[0], m[1], [[P[0][0], P[0][1]], [P[1][0], P[1][1]]], C.signal); robotGlyph(Q, r.x[0], r.x[1], r.x[2], C.bone, 0.4); };
    p.redraw(); const lap = s.k / 400;
    read.innerHTML = `step ${s.k} (${lap.toFixed(2)} laps) · ${ls.length} of 8 landmarks mapped · robot sigma ${(100 * rs).toFixed(1)} cm · mean landmark sigma ${(100 * lsm).toFixed(1)} cm · ${r.closed < 0 ? 'uncertainty grows as the robot drifts' : ok(`loop closed at step ${r.closed}: the first landmark seen again pulls robot and map in`)} · illustrative simulation, data association known`;
  };
  ctrls.append(slider('Step', { min: 0, max: 499, step: 1, value: s.k }, (v) => { s.k = v; redraw(); }));
  redraw();
};

// ---- p17-l20: pose-graph optimisation ----
function pgProblem() {
  const g = gauss(rng(6)), sig = [0.05, 0.05, 1 * D2R], truth = []; let p = [0, 0, 0];
  const comp = (a, b) => [a[0] + Math.cos(a[2]) * b[0] - Math.sin(a[2]) * b[1], a[1] + Math.sin(a[2]) * b[0] + Math.cos(a[2]) * b[1], wrapA(a[2] + b[2])];
  const rel = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], c = Math.cos(a[2]), s_ = Math.sin(a[2]); return [c * dx + s_ * dy, -s_ * dx + c * dy, wrapA(b[2] - a[2])]; };
  for (let l = 0; l < 2; l++) for (let sd = 0; sd < 4; sd++) { for (let i = 0; i < 10; i++) { truth.push([...p]); p = comp(p, [1, 0, 0]); } p = comp(p, [0, 0, Math.PI / 2]); }
  const n = truth.length, edges = [];
  for (let i = 0; i < n - 1; i++) { const z = rel(truth[i], truth[i + 1]).map((v, k) => v + sig[k] * g()); edges.push([i, i + 1, z, sig.map((v) => 1 / (v * v)), false]); }
  for (let i = n / 2; i < n; i++) { const z = rel(truth[i - n / 2], truth[i]).map((v, k) => v + sig[k] / 2 * g()); edges.push([i - n / 2, i, z, sig.map((v) => 4 / (v * v)), true]); }
  const guess = [[0, 0, 0]]; for (let i = 0; i < n - 1; i++) guess.push(comp(guess[i], edges[i][2]));
  return { truth, edges, guess, rel };
}
function pgErr(xi, xj, z) {
  const c = Math.cos(xi[2]), s_ = Math.sin(xi[2]), dx = xj[0] - xi[0], dy = xj[1] - xi[1], a = [c * dx + s_ * dy, -s_ * dx + c * dy], cz = Math.cos(z[2]), sz = Math.sin(z[2]);
  const e = [cz * (a[0] - z[0]) + sz * (a[1] - z[1]), -sz * (a[0] - z[0]) + cz * (a[1] - z[1]), wrapA(xj[2] - xi[2] - z[2])];
  const RzT = [[cz, sz], [-sz, cz]], RiT = [[c, s_], [-s_, c]], dRi = [[-s_, c], [-c, -s_]], RR = mm(RzT, RiT), dd = mv(mm(RzT, dRi), [dx, dy]);
  const A = [[-RR[0][0], -RR[0][1], dd[0]], [-RR[1][0], -RR[1][1], dd[1]], [0, 0, -1]], B = [[RR[0][0], RR[0][1], 0], [RR[1][0], RR[1][1], 0], [0, 0, 1]];
  return { e, A, B };
}
let PG = null;
function pgSolve(useLoops) {
  const { truth, edges, guess } = PG.prob, E = edges.filter((e) => useLoops || !e[4]), n = truth.length; let x = guess.map((q) => [...q]); const hist = [];
  const chi = (x_) => E.reduce((acc, [i, j, z, om]) => { const { e } = pgErr(x_[i], x_[j], z); return acc + om[0] * e[0] * e[0] + om[1] * e[1] * e[1] + om[2] * e[2] * e[2]; }, 0);
  const ate = (x_) => Math.sqrt(x_.reduce((acc, q, i) => acc + (q[0] - truth[i][0]) ** 2 + (q[1] - truth[i][1]) ** 2, 0) / n);
  hist.push({ x: x.map((q) => [...q]), chi: chi(x), ate: ate(x) });
  for (let it = 0; it < 6; it++) {
    const H = Array.from({ length: 3 * n }, () => new Float64Array(3 * n)), b = new Float64Array(3 * n);
    for (const [i, j, z, om] of E) { const { e, A, B } = pgErr(x[i], x[j], z); const blocks = [[i, A], [j, B]];
      for (const [p_, M] of blocks) { for (let r = 0; r < 3; r++) b[3 * p_ + r] += M[0][r] * om[0] * e[0] + M[1][r] * om[1] * e[1] + M[2][r] * om[2] * e[2]; for (const [q_, N] of blocks) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) H[3 * p_ + r][3 * q_ + c] += M[0][r] * om[0] * N[0][c] + M[1][r] * om[1] * N[1][c] + M[2][r] * om[2] * N[2][c]; } }
    for (let r = 0; r < 3; r++) H[r][r] += 1e9;
    const dx = solveLin(H.map((r) => Array.from(r)), Array.from(b, (v) => -v)); x = x.map((q, i) => [q[0] + dx[3 * i], q[1] + dx[3 * i + 1], wrapA(q[2] + dx[3 * i + 2])]);
    hist.push({ x: x.map((q) => [...q]), chi: chi(x), ate: ate(x) });
  }
  return hist;
}
W.posegraph = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { it: 0, loops: true };
  const p = new Plot(body, { aspect: 1, maxH: 400, x: [-2, 12], y: [-2, 12], equal: true, label: 'Pose graph: true square, current estimate and loop-closure edges' });
  if (!PG) { PG = { prob: pgProblem() }; PG.with = pgSolve(true); }
  const redraw = () => {
    if (!s.loops && !PG.without) PG.without = pgSolve(false);
    const H = (s.loops ? PG.with : PG.without)[s.it], x = H.x, { truth, edges } = PG.prob;
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); P.line([...truth.map((q) => q[0]), 0], [...truth.map((q) => q[1]), 0], C.dim, 1.2, [4, 4]);
      if (s.loops) for (const [i, j, , , loop] of edges) if (loop) P.line([x[i][0], x[j][0]], [x[i][1], x[j][1]], 'rgba(255,181,71,.45)', 1);
      P.line(x.slice(0, 40).map((q) => q[0]), x.slice(0, 40).map((q) => q[1]), C.lime, 1.8); P.line(x.slice(39).map((q) => q[0]), x.slice(39).map((q) => q[1]), C.signal, 1.8); for (const q of x) P.dot(q[0], q[1], C.bone, 1.8); };
    p.redraw(); const nE = s.loops ? edges.length : 79, dof = 3 * (nE - 80 + 1);
    read.innerHTML = `iteration ${s.it} · ${nE} edges (${s.loops ? '79 odometry + 40 loop closures' : 'odometry only'}) · total error ${H.chi < 1 ? H.chi.toExponential(1) : H.chi.toFixed(1)}${s.loops ? ` (about ${dof} expected at the optimum)` : ''} · RMS position error ${H.ate < 0.3 ? ok(H.ate.toFixed(3) + ' m') : sp(C.warn, H.ate.toFixed(3) + ' m')} · ${sp(C.lime, 'lap 1')}, ${sp(C.signal, 'lap 2')}, ${sp(C.warn, 'loop closures')}`;
  };
  ctrls.append(slider('Gauss-Newton iterations', { min: 0, max: 6, step: 1, value: s.it }, (v) => { s.it = v; redraw(); }),
    toggle('Loop closures', s.loops, (v) => { s.loops = v; redraw(); }, { id: 'pg-loops' }));
  redraw();
};

export default W;
