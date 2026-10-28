// Cable-driven parallel robot (CDPR) of the Stringman type: four cables from anchors near the top corners of a room meet
// at one point, the pivot, and a gripper hangs below it on a rigid pole. Pure maths, no rendering, so node --test can check it.
// Frame: x and y horizontal, z up, floor at z = 0, room centred on the origin. Units: metres, kilograms, seconds, newtons.
export const G = 9.81;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
const det3 = (a, b, c) => dot(a, cross(b, c));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Anchors at the four top corners, counter-clockwise from (-x, -y).
export function cornerAnchors(w, d, h) { return [[-w / 2, -d / 2, h], [w / 2, -d / 2, h], [w / 2, d / 2, h], [-w / 2, d / 2, h]]; }

// Inverse kinematics of a point platform: each cable length is a distance, and u_i is the unit vector from the pivot to anchor i.
export function ik(anchors, p) {
  const L = [], u = [];
  for (const A of anchors) { const v = sub(A, p), l = norm(v); L.push(l); u.push(l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 1]); }
  return { L, u };
}

// The 3 x 4 structure matrix U = [u_1 .. u_4] has a one-dimensional null space (four cables, three force equations).
// Its generator is the generalised cross product: n_i = (-1)^i det(U without column i). Then U n = 0.
export function nullVector(u) {
  return [det3(u[1], u[2], u[3]), -det3(u[0], u[2], u[3]), det3(u[0], u[1], u[3]), -det3(u[0], u[1], u[2])];
}

function solve3(M, b) {
  const [c0, c1, c2] = [[M[0][0], M[1][0], M[2][0]], [M[0][1], M[1][1], M[2][1]], [M[0][2], M[1][2], M[2][2]]];
  const D = det3(c0, c1, c2);
  if (Math.abs(D) < 1e-12) return null;
  return [det3(b, c1, c2) / D, det3(c0, b, c2) / D, det3(c0, c1, b) / D];
}

// Minimum-norm particular solution t_p = U^T (U U^T)^-1 f. It is orthogonal to the null space.
export function particular(u, f) {
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const v of u) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) M[r][c] += v[r] * v[c];
  const y = solve3(M, f);
  return y ? u.map((v) => dot(v, y)) : null;
}

// Interval of lambda for which every t_p + lambda n lies in [lo, hi]. Returns null when it is empty.
function lambdaRange(tp, n, lo, hi, tol = 1e-9) {
  let a = -Infinity, b = Infinity;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(n[i]) < 1e-12) { if (tp[i] < lo - tol || tp[i] > hi + tol) return null; continue; }
    const p = (lo - tp[i]) / n[i], q = (hi - tp[i]) / n[i];
    a = Math.max(a, Math.min(p, q)); b = Math.min(b, Math.max(p, q));
  }
  return a <= b + tol ? [a, Math.max(a, b)] : null;
}

// min over lambda in [a, b] of max_i (tp_i + lambda n_i): convex and piecewise linear, so the optimum sits at an end or a crossing.
function minimax(tp, n, a, b) {
  const f = (l) => Math.max(...tp.map((t, i) => t + l * n[i]));
  const cand = [a, b].filter(Number.isFinite);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (Math.abs(n[i] - n[j]) > 1e-12) { const l = (tp[j] - tp[i]) / (n[i] - n[j]); if (l >= a && l <= b) cand.push(l); }
  if (!cand.length) cand.push(0);
  let best = cand[0], bv = f(best); for (const l of cand) { const v = f(l); if (v < bv) { bv = v; best = l; } }
  return { lambda: best, value: bv };
}

// Static tension distribution: find t >= tMin with U t = f, where f is the force the cables must put on the pivot.
// Among all solutions inside [tMin, tMax] it returns the one with the smallest 2-norm (lambda nearest 0).
// reason: 'ok'; 'slack' when no solution has every cable pulling (the point is outside the force-feasible region);
// 'over' when every non-negative solution has a cable above tMax (then t is the one with the lowest peak tension).
export function distribute(u, f, { tMin = 0, tMax = Infinity } = {}) {
  const tp = particular(u, f);
  if (!tp) return { t: [0, 0, 0, 0], ok: false, reason: 'slack', slack: [true, true, true, true] };
  const n = nullVector(u);
  const ln = Math.hypot(...n); const nn = ln > 1e-12 ? n.map((x) => x / ln) : [0, 0, 0, 0];
  const at = (l) => tp.map((t, i) => t + l * nn[i]);
  const inBox = lambdaRange(tp, nn, tMin, tMax);
  if (inBox) { const l = clamp(0, inBox[0], inBox[1]); return { t: at(l), ok: true, reason: 'ok', lambda: l, range: inBox, tp, n: nn, slack: [false, false, false, false] }; }
  const pos = lambdaRange(tp, nn, Math.max(0, tMin), Infinity);
  if (pos) { const m = minimax(tp, nn, pos[0], pos[1]); const t = at(m.lambda); return { t, ok: false, reason: 'over', lambda: m.lambda, tp, n: nn, slack: [false, false, false, false] }; }
  // no all-pulling solution: show the one whose weakest cable is least negative, and flag the cables that would have to push
  const m = minimax(tp.map((x) => -x), nn.map((x) => -x), -Infinity, Infinity);
  const t = at(m.lambda);
  return { t, ok: false, reason: 'slack', lambda: m.lambda, tp, n: nn, slack: t.map((x) => x < 0) };
}

// Payload capacity at a point: with tMin = 0 the tensions scale with the mass, t = m g tau, so the largest mass is
// tMax / (g * min_lambda max_i tau_i) over the lambdas that keep every tau_i >= 0.
export function capacity(anchors, p, tMax) {
  const { u } = ik(anchors, p);
  const tp = particular(u, [0, 0, G]); if (!tp) return 0;
  const n = nullVector(u), ln = Math.hypot(...n), nn = ln > 1e-12 ? n.map((x) => x / ln) : [0, 0, 0, 0];
  const r = lambdaRange(tp, nn, 0, Infinity); if (!r) return 0;
  const m = minimax(tp, nn, r[0], r[1]);
  return m.value > 1e-12 ? tMax / m.value : Infinity;
}

// Capacity on an nx x ny grid over the footprint at pivot height z. Row-major from (-w/2, -d/2).
export function capacityGrid(anchors, w, d, z, tMax, nx = 48, ny = 48) {
  const out = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) out[j * nx + i] = capacity(anchors, [-w / 2 + (w * (i + 0.5)) / nx, -d / 2 + (d * (j + 0.5)) / ny, z], tMax);
  return out;
}

// The moving robot: pivot driven kinematically by the winches (speed and acceleration limited), gripper as a point mass
// on a rigid massless pole (a spherical pendulum on a moving support), optional swing damping, and a tension safety relax.
export class CableSim {
  constructor(o = {}) {
    this.c = Object.assign({
      w: 7, d: 7, h: 3, mass: 1, pole: 0.5, tLimit: 28, vmax: 0.4, amax: 1.5, amaxH: 3, damping: true, relax: true, push: 0,
      kx: 1.0, kv: 4.0, // tracking: desired velocity = kx * position error (capped at vmax), accel = kv * velocity error
      swingKp: 0, swingKd: 0, // set from the pole length in setPole unless given
      swingTau: 2, // s, low-pass that separates a steady lean from a swing
      air: 0.02, // passive swing damping, 1/s: a real pendulum rings down slowly
      tRelax: 2, vRelax: 0.3, // relaxed motors: a few newtons per line, paying out at most 0.3 m/s
    }, o);
    this.setPole(this.c.pole, o.swingKd);
    this.setRoom(this.c.w, this.c.d, this.c.h);
    this.reset();
  }
  setPole(l, kd) {
    this.c.pole = l; const w2 = G / l;
    // PD on the pivot acceleration: a += kp * (d - dbar) + kd * d', with d the gripper's horizontal offset from the pivot and
    // dbar a 2 s low-pass of d, so a steady lean (someone pushing) is not chased across the room; only the swing is.
    // On its own the swing then obeys d'' = -(g/l + kp) d - kd d'. The tracking loop and the filter couple in, so the gains
    // were checked with the eigenvalues of the 5-state linear model (lesson p21-l07): kp = 0.5 g/l and kd = 0.9 sqrt(g/l)
    // keep every mode damped for poles from 0.1 m to 1 m. Real robots measure d' with an IMU on the gripper; here it is exact.
    this.c.swingKp = 0.5 * w2; this.c.swingKd = kd ?? 0.9 * Math.sqrt(w2);
  }
  setRoom(w, d, h) { Object.assign(this.c, { w, d, h }); this.anchors = cornerAnchors(w, d, h); if (this.target) this.setTarget(...this.target); }
  limits() { const { w, d, h, pole } = this.c, m = Math.min(0.05, w * 0.02); return { x: [-w / 2 + m, w / 2 - m], y: [-d / 2 + m, d / 2 - m], z: [Math.min(0.03, h * 0.05), Math.max(0.03, h - pole - Math.max(0.05, h * 0.04))] }; }
  // the target is the gripper position; the pivot aims pole metres above it
  setTarget(x, y, z) { const L = this.limits(); this.target = [clamp(x, ...L.x), clamp(y, ...L.y), clamp(z, ...L.z)]; }
  reset(target) {
    const { h, pole } = this.c;
    if (target) this.setTarget(...target); else this.setTarget(0, 0, Math.max(0.05, (h - pole) * 0.45));
    const t = this.target;
    this.p = [t[0], t[1], t[2] + pole]; this.pv = [0, 0, 0]; this.pa = [0, 0, 0];
    // gripper at its static equilibrium: the pole lines up with g + F/m, and the pole force per unit mass is |g + F/m|
    const e = [this.c.push / this.c.mass, 0, -G], en = norm(e);
    this.r = [this.p[0] + (pole * e[0]) / en, this.p[1], this.p[2] + (pole * e[2]) / en]; this.rv = [0, 0, 0]; this.lam = en;
    this.db = [this.r[0] - this.p[0], this.r[1] - this.p[1]];
    this.relaxed = false; this.relaxReason = ''; this.onFloor = false; this.time = 0;
    this.solve();
  }
  kick(v = 0.6) { this.rv[0] += v; this.rv[1] += v * 0.4; }
  rearm() { this.relaxed = false; this.relaxReason = ''; this.onFloor = false; this.db = [this.r[0] - this.p[0], this.r[1] - this.p[1]]; }
  swingAngle() { const d = sub(this.r, this.p); return Math.atan2(Math.hypot(d[0], d[1]), -d[2]); }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.002)), h = dt / n;
    for (let k = 0; k < n; k++) this.substep(h);
    this.time += dt; this.solve();
  }
  substep(h) {
    const c = this.c, l = c.pole, p = this.p, pv = this.pv;
    const d = sub(this.r, p), dv = sub(this.rv, pv);
    let a = [0, 0, 0];
    for (const i of [0, 1]) this.db[i] += ((d[i] - this.db[i]) * h) / c.swingTau;
    if (!this.relaxed) {
      const tgt = [this.target[0], this.target[1], this.target[2] + l];
      const e = sub(tgt, p); const en = norm(e); const vs = Math.min(c.vmax, c.kx * en);
      const vd = en > 1e-9 ? [e[0] / en * vs, e[1] / en * vs, e[2] / en * vs] : [0, 0, 0];
      a = [c.kv * (vd[0] - pv[0]), c.kv * (vd[1] - pv[1]), c.kv * (vd[2] - pv[2])];
      if (c.damping) for (const i of [0, 1]) a[i] += c.swingKp * (d[i] - this.db[i]) + c.swingKd * dv[i];
      const ah = Math.hypot(a[0], a[1]); if (ah > c.amaxH) { a[0] *= c.amaxH / ah; a[1] *= c.amaxH / ah; }
      a[2] = clamp(a[2], -c.amax, c.amax);
    } else {
      // relaxed: no horizontal drive, the lines pay out so the pivot sinks at up to vRelax until the gripper is on the floor
      a = [-3 * pv[0], -3 * pv[1], 0];
      pv[2] = this.onFloor ? 0 : -c.vRelax;
    }
    for (let i = 0; i < 3; i++) { if (!(this.relaxed && i === 2)) pv[i] += a[i] * h; p[i] += pv[i] * h; }
    // the pivot cannot leave the volume under the anchors
    const lim = this.limits(), box = [lim.x, lim.y, [lim.z[0] + l * 0.98, lim.z[1] + l]];
    for (let i = 0; i < 3; i++) { if (p[i] < box[i][0]) { p[i] = box[i][0]; if (pv[i] < 0) pv[i] = 0; } else if (p[i] > box[i][1]) { p[i] = box[i][1]; if (pv[i] > 0) pv[i] = 0; } }
    this.pa = this.relaxed ? [a[0], a[1], 0] : a;
    // gripper: r'' = g + F/m - lam d/l, with lam from the pole constraint |r - p| = l
    if (this.onFloor) { this.rv = [0, 0, 0]; p[2] = this.r[2] + l * 0.98; return; }
    const F = [c.push, 0, 0], gv = [0, 0, -G];
    const ext = [gv[0] + F[0] / c.mass - this.pa[0] - c.air * dv[0], gv[1] + F[1] / c.mass - this.pa[1] - c.air * dv[1], gv[2] + F[2] / c.mass - this.pa[2]];
    const lam = (dot(d, ext) + dot(dv, dv)) / l;
    const acc = [gv[0] + F[0] / c.mass - c.air * dv[0] - lam * d[0] / l, gv[1] + F[1] / c.mass - c.air * dv[1] - lam * d[1] / l, gv[2] + F[2] / c.mass - lam * d[2] / l];
    for (let i = 0; i < 3; i++) { this.rv[i] += acc[i] * h; this.r[i] += this.rv[i] * h; }
    // project back onto the sphere |r - p| = l and remove the radial part of the relative velocity
    const d2 = sub(this.r, p), dl = norm(d2), un = [d2[0] / dl, d2[1] / dl, d2[2] / dl];
    for (let i = 0; i < 3; i++) this.r[i] = p[i] + un[i] * l;
    const rel = sub(this.rv, pv), rr = dot(rel, un); for (let i = 0; i < 3; i++) this.rv[i] -= rr * un[i];
    this.lam = lam;
    if (this.relaxed && this.r[2] <= 0.03) { this.onFloor = true; this.r[2] = 0.03; }
  }
  // cable force on the pivot = -(force of the pole on the pivot) = -m lam d / l (the pivot itself is massless here)
  solve() {
    const c = this.c, d = sub(this.r, this.p), k = ik(this.anchors, this.p);
    let lam = this.lam;
    if (lam === undefined) { lam = G; this.lam = lam; }
    const f = [-c.mass * lam * d[0] / c.pole, -c.mass * lam * d[1] / c.pole, -c.mass * lam * d[2] / c.pole];
    this.force = f;
    if (this.relaxed) { this.sol = { t: [c.tRelax, c.tRelax, c.tRelax, c.tRelax], ok: false, reason: 'relaxed', slack: [true, true, true, true] }; }
    else {
      this.sol = distribute(k.u, f, { tMin: 0, tMax: c.tLimit });
      const peak = Math.max(...this.sol.t);
      if (c.relax && (this.sol.reason === 'over' || peak > c.tLimit + 1e-9)) { this.relaxed = true; this.relaxReason = `a line reached ${peak.toFixed(1)} N, over the ${c.tLimit} N limit`; }
    }
    this.L = k.L; this.u = k.u;
  }
  get state() {
    const t = this.sol.t, speed = Math.hypot(...this.pv);
    const err = Math.hypot(this.r[0] - this.target[0], this.r[1] - this.target[1], this.r[2] - this.target[2]);
    return { L: this.L, t, reason: this.sol.reason, slack: this.sol.slack, relaxed: this.relaxed, relaxReason: this.relaxReason, onFloor: this.onFloor,
      swing: this.swingAngle(), speed, err, peak: Math.max(...t), pivot: [...this.p], gripper: [...this.r], target: [...this.target], force: this.force };
  }
}
