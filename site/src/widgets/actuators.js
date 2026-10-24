// Widgets for Phase 09 (actuators). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const TAU = 2 * Math.PI;
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(r) { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const row = (...k) => h('div', { class: 'btn-row' }, ...k);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rect(P, x0, y0, x1, y1, fill, stroke) { P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke); }
function circle(P, cx, cy, r, color, w = 1.5, n = 64) { const xs = [], ys = []; for (let i = 0; i <= n; i++) { xs.push(cx + r * Math.cos(TAU * i / n)); ys.push(cy + r * Math.sin(TAU * i / n)); } P.line(xs, ys, color, w); }
function disc(P, cx, cy, r, fill, n = 48) { const pts = []; for (let i = 0; i < n; i++) pts.push([cx + r * Math.cos(TAU * i / n), cy + r * Math.sin(TAU * i / n)]); P.poly(pts, fill); }

// p09-l01: Lorentz force on a coil in a magnet gap
W.lorentz = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { I: 2, B: 0.8, N: 50 }; const Lw = 0.03;
  const p = new Plot(body, { aspect: 0.6, maxH: 300, x: [-1.6, 1.6], y: [-1, 1], equal: true, label: 'Coil conductors in a magnet gap with the force on them' });
  p.draw = (P) => {
    rect(P, -1.5, 0.45, 1.5, 0.85, '#3a1f1f', C.bad); P.text('N', -1.4, 0.6, C.bone); rect(P, -1.5, -0.85, 1.5, -0.45, '#1f2a3a', C.signal); P.text('S', -1.4, -0.75, C.bone);
    for (let x = -1.2; x <= 1.21; x += 0.4) P.arrow(x, 0.42, x, -0.42, 'rgba(164,168,156,.45)', 1.2);
    const F = s.N * s.B * s.I * Lw; const len = clamp(F / 6, -1.1, 1.1);
    [-0.4, 0, 0.4].forEach((x) => { circle(P, x, 0, 0.11, C.bone, 2); if (s.I > 0) { P.line([x - 0.06, x + 0.06], [-0.06, 0.06], C.bone, 2); P.line([x - 0.06, x + 0.06], [0.06, -0.06], C.bone, 2); } else if (s.I < 0) P.dot(x, 0, C.bone, 3); });
    if (Math.abs(len) > 0.02) P.arrow(0.7, 0, 0.7 + len, 0, C.lime, 3);
    P.text('B ↓', 1.2, 0.3, C.fog);
    read.innerHTML = `F = N·B·I·L = ${s.N} × ${s.B.toFixed(2)} T × ${s.I.toFixed(1)} A × ${Lw} m = <b>${F.toFixed(2)} N</b> · force constant k = N·B·L = ${(s.N * s.B * Lw).toFixed(2)} N/A · ${s.I === 0 ? 'no current, no force' : 'reverse the current and the force reverses'}`;
  };
  ctrls.append(slider('Current I', { min: -5, max: 5, step: 0.1, value: s.I, fmt: (v) => v.toFixed(1) + ' A' }, (v) => { s.I = v; p.redraw(); }),
    slider('Gap flux density B', { min: 0.1, max: 1.4, step: 0.05, value: s.B, fmt: (v) => v.toFixed(2) + ' T' }, (v) => { s.B = v; p.redraw(); }),
    slider('Turns N', { min: 10, max: 200, step: 10, value: s.N, fmt: (v) => String(v) }, (v) => { s.N = v; p.redraw(); }));
  p.redraw();
};

// shared DC motor simulation (semi-implicit Euler)
export function simDC({ R = 1.2, L = 0.6e-3, k = 0.02, J = 3e-6, b = 2e-6, V = 12, TL = 0, T = 0.2, dt = 2e-5 }) {
  let i = 0, w = 0; const ts = [], is = [], ws = []; const n = Math.round(T / dt);
  for (let s = 0; s <= n; s++) { if (s % 50 === 0) { ts.push(s * dt); is.push(i); ws.push(w); } i += dt * (V - R * i - k * w) / L; w += dt * (k * i - b * w - (w > 0 || k * i > TL ? TL : 0)) / J; }
  return { ts, is, ws };
}
// p09-l02: DC motor step response
W.dcmotor = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { V: 12, TL: 0 }; const m = { R: 1.2, L: 0.6e-3, k: 0.02, J: 3e-6, b: 2e-6 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 200], y: [0, 700], label: 'Speed (lime) and current ×20 (blue) after a voltage step' });
  p.draw = (P) => {
    const r = simDC({ ...m, V: s.V, TL: s.TL }); const wss = (m.k * s.V - m.R * s.TL) / (m.k * m.k + m.R * m.b);
    P.axes({ xl: 't [ms]', yl: 'ω [rad/s]' }); const tm = r.ts.map((t) => t * 1000);
    P.line(tm, r.ws, C.lime, 2); P.line(tm, r.is.map((v) => v * 20), C.signal, 1.5); P.line([0, 200], [wss, wss], C.warn, 1, [5, 4]);
    const tau = m.J * m.R / (m.k * m.k + m.R * m.b);
    read.innerHTML = `steady speed (k·V − R·T<sub>L</sub>)/(k² + R·b) = <b>${wss.toFixed(0)} rad/s</b> (${(wss * 60 / TAU).toFixed(0)} rpm, amber) · simulated ${r.ws[r.ws.length - 1].toFixed(0)} rad/s · mechanical time constant ≈ ${(tau * 1000).toFixed(1)} ms · steady current ${r.is[r.is.length - 1].toFixed(2)} A`;
  };
  ctrls.append(slider('Supply V', { min: 0, max: 24, step: 0.5, value: s.V, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.V = v; p.redraw(); }),
    slider('Load torque', { min: 0, max: 0.15, step: 0.005, value: s.TL, fmt: (v) => (v * 1000).toFixed(0) + ' mN·m' }, (v) => { s.TL = v; p.redraw(); }));
  p.redraw();
};

// p09-l03: spin-down parameter fit
W.motorid = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { noise: 5, seed: 3 }; const J = 3e-6, b = 2e-6, Tc = 4e-4, w0 = 500;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 3], y: [0, 550], label: 'Spin-down: measured speed (dots) and the fitted model (lime)' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const tau = J / b, wc = Tc / b; const true_w = (t) => Math.max(0, (w0 + wc) * Math.exp(-t / tau) - wc);
    const ts = [], ys = []; for (let t = 0; t < 3; t += 0.05) { const w = true_w(t); if (w <= 20) break; ts.push(t); ys.push(w + s.noise * randn(r)); }
    // fit dw/dt = -(b/J) w - Tc/J by least squares on finite differences
    let sxx = 0, sx = 0, sy = 0, sxy = 0, n = 0; for (let i = 1; i < ts.length - 1; i++) { const d = (ys[i + 1] - ys[i - 1]) / (ts[i + 1] - ts[i - 1]); sxx += ys[i] ** 2; sx += ys[i]; sy += d; sxy += ys[i] * d; n++; }
    const sl = (n * sxy - sx * sy) / (n * sxx - sx * sx), ic = (sy - sl * sx) / n; const tauF = -1 / sl, wcF = ic / sl;
    P.axes({ xl: 't [s]', yl: 'ω [rad/s]' }); ts.forEach((t, i) => P.dot(t, ys[i], C.signal, 2.5));
    P.fn((t) => { const w = (w0 + wcF) * Math.exp(-t / tauF) - wcF; return w > 0 ? w : NaN; }, C.lime, 2);
    const e = (a, bb) => (100 * (a - bb) / bb).toFixed(1);
    read.innerHTML = `true τ = J/b = ${tau.toFixed(2)} s, Coulomb speed T<sub>c</sub>/b = ${wc.toFixed(0)} rad/s · fitted τ = <b>${tauF.toFixed(2)} s</b> (${e(tauF, tau)} %), T<sub>c</sub>/b = <b>${wcF.toFixed(0)}</b> (${e(wcF, wc)} %) · with J known from geometry, b = J/τ and T<sub>c</sub> follow`;
  };
  ctrls.append(slider('Tachometer noise', { min: 0, max: 30, step: 1, value: s.noise, fmt: (v) => v + ' rad/s' }, (v) => { s.noise = v; p.redraw(); }), row(btn('New data', () => { s.seed++; p.redraw(); }, 'mid-new')));
  p.redraw();
};

// p09-l04: torque-speed, power and efficiency
W.torquespeed = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { T: 0.08 }; const V = 12, R = 1.2, k = 0.02, I0 = 0.15; const Ts = k * V / R, w0 = V / k;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 650], y: [0, 1.05], label: 'Torque (lime), output power (blue) and efficiency (amber), each normalised, against speed' });
  p.draw = (P) => {
    const Pmax = Ts * w0 / 4; P.axes({ xl: 'ω [rad/s]', yl: 'normalised' });
    P.fn((w) => (w <= w0 ? 1 - w / w0 : NaN), C.lime, 2); P.fn((w) => (w <= w0 ? (Ts * (1 - w / w0) - k * I0) * w / Pmax : NaN), C.signal, 2);
    P.fn((w) => { const i = (V - k * w) / R; const Tout = k * (i - I0); return w < w0 && Tout > 0 ? Tout * w / (V * i) : NaN; }, C.warn, 2);
    P.line([w0 / 2, w0 / 2], [0, 1.05], C.dim, 1, [4, 4]);
    const i = s.T / k + I0, w = (V - R * i) / k; const eta = s.T * w / (V * i);
    if (w > 0) { P.dot(w, s.T / Ts, C.bone, 6); P.dot(w, s.T * w / Pmax, C.bone, 4); }
    read.innerHTML = w > 0 ? `load ${(s.T * 1000).toFixed(0)} mN·m → speed <b>${w.toFixed(0)} rad/s</b>, current ${i.toFixed(2)} A, output ${(s.T * w).toFixed(1)} W, efficiency <b>${(100 * eta).toFixed(0)} %</b> · stall torque ${(Ts * 1000).toFixed(0)} mN·m, no-load ${w0.toFixed(0)} rad/s, peak power at ω₀/2 (dashed)` : `<b>stall</b>: the load exceeds the stall torque ${(Ts * 1000).toFixed(0)} mN·m and draws ${(V / R).toFixed(1)} A`;
  };
  ctrls.append(slider('Load torque', { min: 0, max: 0.22, step: 0.002, value: s.T, fmt: (v) => (v * 1000).toFixed(0) + ' mN·m' }, (v) => { s.T = v; p.redraw(); }));
  p.redraw();
};

// p09-l05: gear ratio and reflected inertia
W.gearratio = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Jl: 0.01 }; const Jm = 1e-5, Tm = 0.1;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [1, 100], y: [0, 1.05], logx: true, label: 'Load acceleration against gear ratio, normalised to its peak' });
  p.draw = (P) => {
    const a = (N) => N * Tm / (s.Jl + N * N * Jm); const No = Math.sqrt(s.Jl / Jm), amax = a(No);
    P.axes({ xl: 'gear ratio N', yl: 'α / α_max' }); P.fn((N) => a(N) / amax, C.lime, 2); P.line([No, No], [0, 1.05], C.warn, 1, [4, 4]); P.dot(No, 1, C.warn, 5);
    read.innerHTML = `J<sub>load</sub> = ${s.Jl.toExponential(1)} kg·m², J<sub>motor</sub> = 1.0e-5 · optimum N = √(J<sub>load</sub>/J<sub>motor</sub>) = <b>${No.toFixed(1)}</b> · there the reflected inertia J<sub>load</sub>/N² equals J<sub>motor</sub> · peak load acceleration ${amax.toFixed(0)} rad/s²`;
  };
  ctrls.append(slider('Load inertia', { min: -4, max: -1, step: 0.05, value: Math.log10(s.Jl), fmt: (v) => (10 ** v).toExponential(1) + ' kg·m²' }, (v) => { s.Jl = 10 ** v; p.redraw(); }));
  p.redraw();
};

// p09-l06: H-bridge with PWM
W.hbridge = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { D: 0.5, f: 20, dead: 0.5, t: 0.3 }; const V = 24, L = 1e-3, R = 1, Iavg = 2;
  const pd = new Plot(body, { aspect: 0.42, maxH: 200, x: [-1.3, 1.3], y: [-0.62, 0.62], equal: true, label: 'H-bridge: switches that are on are lit' });
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 3], y: [-0.5, 4.5], label: 'Motor current (lime) and gate signals of the left leg' });
  const sim = () => {
    const T = 1 / (s.f * 1000), E = s.D * V - R * Iavg, dt = T / 400; let i = Iavg; const ts = [], is = [];
    for (let n = 0; n < 400 * 23; n++) { const ph = (n % 400) / 400; const v = ph < s.D ? V : 0; i += dt * (v - R * i - E) / L; if (n >= 400 * 20) { ts.push((n - 400 * 20) / 400); is.push(i); } }
    return { ts, is };
  };
  const draw = () => {
    const { ts, is } = sim(); const ph = s.t % 1; const deadF = (s.dead * 1e-6) * s.f * 1000; const on = ph < s.D;
    const inDead = Math.abs(ph - s.D) < deadF || ph < deadF || ph > 1 - deadF;
    const sw = { Q1: on && !inDead, Q2: !on && !inDead, Q3: false, Q4: true };
    pd.draw = (P) => {
      P.line([-1.1, 1.1], [0.5, 0.5], C.dim, 1.5); P.line([-1.1, 1.1], [-0.5, -0.5], C.dim, 1.5); P.text('+24 V', -1.25, 0.55, C.fog); P.text('0 V', -1.25, -0.6, C.fog);
      const box = (x, y, n) => { rect(P, x - 0.16, y - 0.12, x + 0.16, y + 0.12, sw[n] ? 'rgba(198,255,26,.85)' : '#1a1c17', C.rule2); P.text(n, x - 0.1, y - 0.04, sw[n] ? '#000' : C.fog); };
      P.line([-0.7, -0.7], [0.5, -0.5], C.dim, 1.5); P.line([0.7, 0.7], [0.5, -0.5], C.dim, 1.5);
      box(-0.7, 0.25, 'Q1'); box(-0.7, -0.25, 'Q2'); box(0.7, 0.25, 'Q3'); box(0.7, -0.25, 'Q4');
      rect(P, -0.25, -0.09, 0.25, 0.09, '#20241b', C.signal); P.text('M', -0.04, -0.03, C.bone); P.line([-0.7, -0.25], [0, 0], C.signal, 1.5); P.line([0.25, 0.7], [0, 0], C.signal, 1.5);
      P.arrow(-0.6, 0.06, -0.3, 0.06, C.lime, 2);
      P.text(sw.Q1 ? 'drive: Q1 + Q4' : sw.Q2 ? 'freewheel: Q2 + Q4' : 'dead time: diode conducts', -0.55, -0.45, C.bone);
    };
    p.draw = (P) => {
      P.axes({ xl: 't / T' }); P.line(ts, is, C.lime, 2);
      const g = (hi) => { const xs = [], ys = []; for (let k = 0; k <= 600; k++) { const x = 3 * k / 600, q = x % 1; const a = q < s.D; const d = Math.abs(q - s.D) < deadF || q < deadF || q > 1 - deadF; xs.push(x); ys.push((hi ? a && !d : !a && !d) ? 1 : 0); } return { xs, ys }; };
      const g1 = g(true), g2 = g(false); P.line(g1.xs, g1.ys.map((v) => 3.6 + 0.5 * v), C.signal, 1.2); P.line(g2.xs, g2.ys.map((v) => 0.0 + 0.5 * v - 0.4), C.warn, 1.2);
      P.line([s.t, s.t], [-0.5, 4.5], C.dim, 1, [3, 3]);
      const rip = Math.max(...is) - Math.min(...is), est = V * s.D * (1 - s.D) / (L * s.f * 1000);
      read.innerHTML = `average voltage D·V<sub>bus</sub> = <b>${(s.D * V).toFixed(1)} V</b> · ripple simulated <b>${rip.toFixed(3)} A</b>, estimate V·D(1−D)/(L·f) = ${est.toFixed(3)} A (max V/(4Lf) at D = 0.5) · Q1 gate blue, Q2 gate amber, both off for ${s.dead.toFixed(1)} µs dead time`;
    };
    pd.redraw(); p.redraw();
  };
  ctrls.append(slider('Duty D', { min: 0.05, max: 0.95, step: 0.01, value: s.D, fmt: (v) => v.toFixed(2) }, (v) => { s.D = v; draw(); }),
    slider('PWM frequency', { min: 5, max: 50, step: 1, value: s.f, fmt: (v) => v + ' kHz' }, (v) => { s.f = v; draw(); }),
    slider('Dead time', { min: 0, max: 2, step: 0.1, value: s.dead, fmt: (v) => v.toFixed(1) + ' µs' }, (v) => { s.dead = v; draw(); }),
    slider('Instant shown', { min: 0, max: 2.99, step: 0.01, value: s.t, fmt: (v) => v.toFixed(2) + ' T' }, (v) => { s.t = v; draw(); }));
  draw();
};

// p09-l07: current PI by pole-zero cancellation
W.currentloop = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { wc: 3000, err: 1 }; const L = 1e-3, R = 1;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 3], y: [0, 1.3], label: 'Current (lime) tracking a 1 A step command (dashed)' });
  p.draw = (P) => {
    const Kp = L * s.wc, Ki = R * s.err * s.wc; const dt = 1e-6; let i = 0, I = 0; const ts = [], is = []; let t63 = NaN;
    for (let n = 0; n < 3000; n++) { const e = 1 - i; I += Ki * e * dt; const v = Kp * e + I; i += dt * (v - R * i) / L; if (n % 10 === 0) { ts.push(n * dt * 1000); is.push(i); } if (isNaN(t63) && i >= 0.632) t63 = n * dt; }
    P.axes({ xl: 't [ms]', yl: 'i [A]' }); P.line([0, 3], [1, 1], C.dim, 1, [5, 4]); P.line(ts, is, C.lime, 2); P.line([0, 3], [0.632, 0.632], C.rule2, 1, [2, 4]);
    const bw = 1 / t63;
    read.innerHTML = `K<sub>p</sub> = L·ω<sub>c</sub> = ${Kp.toFixed(2)} V/A, K<sub>i</sub> = R̂·ω<sub>c</sub> = ${Ki.toFixed(0)} V/(A·s) · designed bandwidth ${s.wc} rad/s (${(s.wc / TAU).toFixed(0)} Hz) · measured from the 63 % rise: <b>${bw.toFixed(0)} rad/s</b> (${(100 * (bw - s.wc) / s.wc).toFixed(1)} %)${Math.abs(s.err - 1) > 0.01 ? ' · R̂ wrong: the zero no longer cancels the pole, leaving a slow tail' : ''}`;
  };
  ctrls.append(slider('Design bandwidth ω_c', { min: 500, max: 10000, step: 100, value: s.wc, fmt: (v) => v + ' rad/s' }, (v) => { s.wc = v; p.redraw(); }),
    slider('R estimate / true R', { min: 0.3, max: 2, step: 0.05, value: s.err, fmt: (v) => v.toFixed(2) }, (v) => { s.err = v; p.redraw(); }));
  p.redraw();
};

// p09-l08: stepper current tables
W.stepper = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mode: 'micro', k: 5 };
  const pd = new Plot(body, { aspect: 0.62, maxH: 230, x: [-1.7, 1.7], y: [-1.6, 1.6], equal: true, label: 'Current vector in the A–B plane; the rotor aligns with it' });
  const p = new Plot(body, { aspect: 0.45, maxH: 220, x: [0, 64], y: [-1.6, 1.6], label: 'Phase A (lime) and phase B (blue) current against microstep index' });
  const cur = (k) => { const e = TAU * k / 64; if (s.mode === 'full') { const q = Math.floor(k / 16); const a = TAU * (q + 0.5) / 4; return [Math.sign(Math.cos(a)), Math.sign(Math.sin(a))]; } if (s.mode === 'half') { const q = Math.floor(k / 8); const a = TAU * q / 8; const r = (x) => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x)); return [r(Math.cos(a)), r(Math.sin(a))]; } const a = TAU * k / 64; return [Math.cos(a), Math.sin(a)]; };
  const draw = () => {
    const [a, b] = cur(s.k); const m = Math.hypot(a, b);
    pd.draw = (P) => { circle(P, 0, 0, 1, C.rule2); circle(P, 0, 0, Math.SQRT2, C.rule, 1); P.line([-1.5, 1.5], [0, 0], C.dim, 1); P.line([0, 0], [-1.5, 1.5], C.dim, 1); P.text('A', 1.5, 0.08, C.lime); P.text('B', 0.06, 1.45, C.signal); P.arrow(0, 0, a, b, C.bone, 3); };
    p.draw = (P) => {
      P.axes({ xl: 'microstep (64 = one electrical cycle = 4 full steps)' }); const ks = [], A = [], B = []; for (let k = 0; k < 64; k++) { const c = cur(k); ks.push(k, k + 1); A.push(c[0], c[0]); B.push(c[1], c[1]); }
      P.line(ks, A, C.lime, 2); P.line(ks, B, C.signal, 2); P.line([s.k + 0.5, s.k + 0.5], [-1.6, 1.6], C.dim, 1, [3, 3]);
    };
    pd.redraw(); p.redraw();
    const mags = Array.from({ length: 64 }, (_, k) => Math.hypot(...cur(k))); const ripple = (Math.max(...mags) - Math.min(...mags)) / Math.max(...mags);
    read.innerHTML = `${{ full: 'full step, both phases on', half: 'half step', micro: '1/16 microstep (sin/cos table)' }[s.mode]} · |I| = <b>${m.toFixed(3)}</b> · electrical angle ${(Math.atan2(b, a) * 180 / Math.PI).toFixed(1)}° = ${(Math.atan2(b, a) * 180 / Math.PI / 50).toFixed(2)}° of shaft (50 rotor teeth) · |I| variation over a cycle ${(100 * ripple).toFixed(0)} %`;
  };
  ctrls.append(select('Drive mode', [['full', 'Full step'], ['half', 'Half step'], ['micro', 'Microstep (sin/cos)']], 'micro', (v) => { s.mode = v; draw(); }, 'step-mode'),
    slider('Step position', { min: 0, max: 63, step: 1, value: s.k, fmt: (v) => String(v) }, (v) => { s.k = v; draw(); }));
  draw();
};

// p09-l09: stepper missed steps
export function simStepper({ acc = 8000, TL = 0.1, w = 60, Th = 0.5, J = 5e-5, b = 2e-3, Nr = 50, T = 0.15, dt = 1e-5 }) {
  let th = 0, om = 0; const ts = [], lag = []; const n = Math.round(T / dt);
  for (let k = 0; k <= n; k++) { const t = k * dt, ta = w / acc; const tc = t < ta ? 0.5 * acc * t * t : 0.5 * acc * ta * ta + w * (t - ta);
    const Tm = -Th * Math.sin(Nr * (th - tc)); const Tl = Math.abs(om) > 1e-6 ? TL * Math.sign(om) : clamp(Tm, -TL, TL); om += dt * (Tm - b * om - Tl) / J; th += dt * om;
    if (k % 20 === 0) { ts.push(t); lag.push((tc - th) / (TAU / 200)); } }
  return { ts, lag };
}
W.steppermiss = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { acc: 6000, TL: 0.1 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 150], y: [-2, 14], label: 'Rotor lag behind the commanded position, in full steps' });
  p.draw = (P) => {
    const r = simStepper(s); P.axes({ xl: 't [ms]', yl: 'lag [full steps]' }); [4, 8, 12].forEach((v) => P.line([0, 150], [v, v], C.rule2, 1, [3, 4]));
    P.line(r.ts.map((t) => t * 1000), r.lag.map((v) => clamp(v, -2, 14)), C.lime, 2);
    const fin = r.lag[r.lag.length - 1]; const lost = 4 * Math.round(fin / 4); const need = 5e-5 * s.acc + s.TL;
    read.innerHTML = `torque needed to accelerate J·α + T<sub>L</sub> = ${need.toFixed(2)} N·m against holding torque 0.50 N·m · final lag ${fin.toFixed(2)} steps · <b>${fin > 12 ? `lost synchronism and stalled, ${fin.toFixed(0)} steps behind` : lost > 0 ? `${lost} full steps missed` : 'no steps missed'}</b> (each slip loses a multiple of 4 full steps)`;
  };
  ctrls.append(slider('Acceleration', { min: 1000, max: 12000, step: 250, value: s.acc, fmt: (v) => v + ' rad/s²' }, (v) => { s.acc = v; p.redraw(); }),
    slider('Load torque', { min: 0, max: 0.45, step: 0.01, value: s.TL, fmt: (v) => v.toFixed(2) + ' N·m' }, (v) => { s.TL = v; p.redraw(); }));
  p.redraw();
};

// p09-l10: six-step commutation
const SIX_HALL = [1, 3, 2, 6, 4, 5];
const PAIRS = { 330: ['A', 'B'], 30: ['A', 'C'], 90: ['B', 'C'], 150: ['B', 'A'], 210: ['C', 'A'], 270: ['C', 'B'] };
W.sixstep = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 20, fwd: true };
  const p = new Plot(body, { aspect: 0.72, maxH: 320, x: [-1.6, 1.6], y: [-1.25, 1.25], equal: true, label: 'Rotor magnet (blue) and the stator field from the energised pair (lime)' });
  p.draw = (P) => {
    const sec = Math.floor((((s.th + 30) % 360) + 360) % 360 / 60); const st = ((60 * sec + (s.fwd ? 90 : -90)) % 360 + 360) % 360; const [hi, lo] = PAIRS[st];
    circle(P, 0, 0, 1.05, C.rule2, 1.5); ['A', 'B', 'C'].forEach((n, i) => { const a = TAU * i / 3; P.line([0, 1.15 * Math.cos(a)], [0, 1.15 * Math.sin(a)], C.rule2, 1, [3, 4]); P.text(n + (n === hi ? '+' : n === lo ? '−' : ''), 1.22 * Math.cos(a) - 0.06, 1.22 * Math.sin(a) - 0.04, n === hi || n === lo ? C.bone : C.dim); });
    const r = s.th * Math.PI / 180, q = st * Math.PI / 180; P.arrow(0, 0, 0.8 * Math.cos(r), 0.8 * Math.sin(r), C.signal, 4); P.arrow(0, 0, 1.0 * Math.cos(q), 1.0 * Math.sin(q), C.lime, 2.5);
    let lead = (st - s.th) % 360; if (lead > 180) lead -= 360; if (lead < -180) lead += 360;
    read.innerHTML = `rotor at ${s.th}° electrical · Hall code <b>${SIX_HALL[sec].toString(2).padStart(3, '0')}</b> (sector ${sec}) · drive <b>${hi}+ ${lo}−</b>, third phase floating · stator field leads the rotor by ${lead.toFixed(0)}° → torque ∝ sin(lead) = ${Math.sin(lead * Math.PI / 180).toFixed(2)} (${s.fwd ? 'forward' : 'reverse'})`;
  };
  ctrls.append(slider('Rotor angle', { min: 0, max: 359, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; p.redraw(); }),
    row(toggle('Forward', true, (v) => { s.fwd = v; p.redraw(); }, { id: 'six-dir' })));
  p.redraw();
};

// p09-l11: Clarke and Park
W.clarkepark = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 40, g: 90 };
  const p = new Plot(body, { aspect: 0.42, maxH: 200, x: [0, 360], y: [-1.2, 1.2], label: 'Phase currents a (lime), b (blue), c (amber) against rotor angle' });
  const pd = new Plot(body, { aspect: 0.7, maxH: 260, x: [-1.6, 1.6], y: [-1.2, 1.2], equal: true, label: 'Current vector in the stationary α–β frame and the rotating d–q frame' });
  const draw = () => {
    const g = s.g * Math.PI / 180; const ph = (t, k) => Math.cos(t + g - TAU * k / 3);
    p.draw = (P) => { P.axes({ xl: 'θ [°]' }); [C.lime, C.signal, C.warn].forEach((c, k) => P.fn((x) => ph(x * Math.PI / 180, k), c, 1.8)); P.line([s.th, s.th], [-1.2, 1.2], C.dim, 1, [3, 3]); };
    const t = s.th * Math.PI / 180; const [ia, ib, ic] = [0, 1, 2].map((k) => ph(t, k));
    const al = (2 / 3) * (ia - ib / 2 - ic / 2), be = (ib - ic) / Math.sqrt(3); const id = al * Math.cos(t) + be * Math.sin(t), iq = -al * Math.sin(t) + be * Math.cos(t);
    pd.draw = (P) => { P.line([-1.4, 1.4], [0, 0], C.rule2, 1); P.line([0, 0], [-1.1, 1.1], C.rule2, 1); P.text('α', 1.42, 0.05, C.fog); P.text('β', 0.05, 1.08, C.fog);
      P.line([0, 1.3 * Math.cos(t)], [0, 1.3 * Math.sin(t)], C.signal, 1.2, [5, 4]); P.line([0, 1.3 * Math.cos(t + Math.PI / 2)], [0, 1.3 * Math.sin(t + Math.PI / 2)], C.warn, 1.2, [5, 4]);
      P.text('d', 1.35 * Math.cos(t), 1.35 * Math.sin(t), C.signal); P.text('q', 1.35 * Math.cos(t + Math.PI / 2), 1.35 * Math.sin(t + Math.PI / 2), C.warn); P.arrow(0, 0, al, be, C.lime, 3); };
    p.redraw(); pd.redraw();
    read.innerHTML = `i<sub>a</sub>, i<sub>b</sub>, i<sub>c</sub> = ${ia.toFixed(2)}, ${ib.toFixed(2)}, ${ic.toFixed(2)} → Clarke i<sub>α</sub> = ${al.toFixed(3)}, i<sub>β</sub> = ${be.toFixed(3)} → Park <b>i<sub>d</sub> = ${id.toFixed(3)}, i<sub>q</sub> = ${iq.toFixed(3)}</b> · slide the angle: the phase currents keep changing, i<sub>d</sub> and i<sub>q</sub> don't`;
  };
  ctrls.append(slider('Rotor angle θ', { min: 0, max: 360, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; draw(); }),
    slider('Current angle (from d axis)', { min: 0, max: 180, step: 1, value: s.g, fmt: (v) => v + '°' }, (v) => { s.g = v; draw(); }));
  draw();
};

// p09-l12: torque ripple, six-step vs FOC
W.foc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { trap: 0 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 360], y: [0, 1.3], label: 'Torque against electrical angle: six-step (amber) and sinusoidal FOC (lime), normalised to their means' });
  const emf = (t) => { const sn = Math.sin(t); const tr = clamp(sn * 2, -1, 1) ; return (1 - s.trap) * sn + s.trap * tr; };
  p.draw = (P) => {
    const N = 720, six = [], foc = [], xs = [];
    for (let n = 0; n < N; n++) { const t = TAU * n / N; xs.push(360 * n / N);
      const e = [0, 1, 2].map((k) => emf(t - TAU * k / 3));
      const es = [0, 1, 2].map((k) => Math.sin(t - TAU * k / 3)); const hi = es.indexOf(Math.max(...es)), lo = es.indexOf(Math.min(...es)); // ideal Hall commutation: drive the pair with the largest EMF difference
      six.push(e[hi] - e[lo]);
      const iF = [0, 1, 2].map((k) => Math.sin(t - TAU * k / 3)); foc.push(e[0] * iF[0] + e[1] * iF[1] + e[2] * iF[2]); }
    const nm = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.map((v) => v / m); }; const S = nm(six), F = nm(foc);
    const rip = (a) => 100 * (Math.max(...a) - Math.min(...a));
    P.axes({ xl: 'electrical angle [°]', yl: 'T / mean' }); P.line(xs, S, C.warn, 2); P.line(xs, F, C.lime, 2);
    read.innerHTML = `back-EMF shape: ${s.trap < 0.05 ? 'sinusoidal (PMSM)' : s.trap > 0.95 ? 'trapezoidal (BLDC)' : 'in between'} · peak-to-peak ripple: six-step <b>${rip(S).toFixed(1)} %</b>, FOC with sinusoidal currents <b>${rip(F).toFixed(1)} %</b> · six-step suits trapezoidal EMF, FOC suits sinusoidal EMF`;
  };
  ctrls.append(slider('Back-EMF trapezoidality', { min: 0, max: 1, step: 0.05, value: s.trap, fmt: (v) => v.toFixed(2) }, (v) => { s.trap = v; p.redraw(); }));
  p.redraw();
};

// p09-l13: RC servo
W.servo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { pw: 1500, db: 4 };
  const pd = new Plot(body, { aspect: 0.55, maxH: 220, x: [-1.4, 1.4], y: [-0.4, 1.2], equal: true, label: 'Servo horn angle' });
  const p = new Plot(body, { aspect: 0.3, maxH: 140, x: [0, 45], y: [-0.2, 1.3], label: 'Control signal: one pulse every 20 ms' });
  const draw = () => {
    const cmd = (s.pw - 1000) * 0.18; const prev = 90; const e = cmd - prev; const degDb = s.db * 0.18 / 2; const ang = Math.abs(e) <= degDb ? prev : cmd - Math.sign(e) * degDb;
    pd.draw = (P) => { rect(P, -0.6, -0.35, 0.6, 0.15, '#1c1f18', C.rule2); for (let a = 0; a <= 180; a += 30) { const r = a * Math.PI / 180; P.line([1.05 * Math.cos(Math.PI - r), 1.15 * Math.cos(Math.PI - r)], [0.15 + 1.05 * Math.sin(Math.PI - r), 0.15 + 1.15 * Math.sin(Math.PI - r)], C.dim, 1); }
      const r = Math.PI - ang * Math.PI / 180; P.line([0, Math.cos(r)], [0.15, 0.15 + Math.sin(r)], C.lime, 6); disc(P, 0, 0.15, 0.1, C.bone); };
    p.draw = (P) => { P.axes({ xl: 't [ms]' }); const xs = [], ys = []; for (const t0 of [0, 20, 40]) { xs.push(t0, t0, t0 + s.pw / 1000, t0 + s.pw / 1000); ys.push(0, 1, 1, 0); } xs.push(45); ys.push(0); P.line(xs, ys, C.signal, 2); };
    pd.redraw(); p.redraw();
    read.innerHTML = `pulse <b>${s.pw} µs</b> → command ${cmd.toFixed(1)}° (this servo: 1000–2000 µs ↔ 0–180°) · starting from 90°, it stops when the error is inside its ±${(s.db / 2).toFixed(0)} µs deadband: horn at <b>${ang.toFixed(1)}°</b>, error ${(ang - cmd).toFixed(2)}°`;
  };
  ctrls.append(slider('Pulse width', { min: 1000, max: 2000, step: 5, value: s.pw, fmt: (v) => v + ' µs' }, (v) => { s.pw = v; draw(); }),
    slider('Deadband', { min: 0, max: 20, step: 1, value: s.db, fmt: (v) => v + ' µs' }, (v) => { s.db = v; draw(); }));
  draw();
};

// p09-l14: solenoid with peak-and-hold drive
export function simSolenoid({ hold = true, Ih = 0.3, V = 24, R = 12, T = 0.1, dt = 1e-5 }) {
  const m = 0.02, kspr = 300, F0 = 2, g0 = 4e-3, Lmin = 0.02, kL = 1e-4; let x = 0, v = 0, i = 0, psi = 0; const ts = [], is = [], xs = []; let E = 0;
  for (let n = 0; n * dt <= T; n++) { const gap = g0 - x; const Lx = Lmin + kL / (gap + 1e-3); const u = hold && n * dt > 0.03 ? (i > Ih ? 0 : V) : V; // after 30 ms, bang-bang hold at Ih (a chopper)
    psi += dt * (u - R * i); i = Math.max(0, psi / Lx); const F = 0.5 * i * i * kL / (gap + 1e-3) ** 2; const Fs = F0 + kspr * x; let a = (F - Fs) / m; if (x <= 0 && a < 0) { a = 0; v = Math.max(v, 0); } if (x >= g0 && a > 0) { a = 0; v = 0; }
    v += a * dt; x = clamp(x + v * dt, 0, g0); E += dt * i * i * R; if (n % 20 === 0) { ts.push(n * dt); is.push(i); xs.push(x / g0); } }
  return { ts, is, xs, P: E / T };
}
W.solenoid = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { hold: true, Ih: 0.6 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 100], y: [0, 2.2], label: 'Coil current (lime) and plunger travel 0–1 (blue)' });
  p.draw = (P) => {
    const r = simSolenoid({ hold: s.hold, Ih: s.Ih }); const c = simSolenoid({ hold: false });
    P.axes({ xl: 't [ms]', yl: 'i [A]' }); P.line(r.ts.map((t) => t * 1000), r.is, C.lime, 1.6); P.line(r.ts.map((t) => t * 1000), r.xs, C.signal, 2); P.line([30, 30], [0, 2.2], C.dim, 1, [3, 3]);
    const pc = 24 * 24 / 12, ph = s.Ih * s.Ih * 12; const closed = r.xs[r.xs.length - 1] > 0.99;
    read.innerHTML = `continuous 24 V: ${(24 / 12).toFixed(1)} A, ${pc.toFixed(0)} W in the coil · ${s.hold ? `peak-and-hold: full voltage for 30 ms, then chopped at ${s.Ih.toFixed(2)} A → hold power <b>${ph.toFixed(1)} W</b> (${(100 * ph / pc).toFixed(0)} % of continuous)` : 'no hold mode'} · plunger ${closed ? '<b>stays in</b>' : '<b>drops out</b>: hold current too low'} · current dips at pull-in as the moving plunger raises L (back-EMF)`;
  };
  ctrls.append(slider('Hold current', { min: 0.1, max: 2, step: 0.05, value: s.Ih, fmt: (v) => v.toFixed(2) + ' A' }, (v) => { s.Ih = v; p.redraw(); }),
    row(toggle('Peak-and-hold', true, (v) => { s.hold = v; p.redraw(); }, { id: 'sol-hold' })));
  p.redraw();
};

// p09-l15: lead screw efficiency and back-driving
W.leadscrew = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lead: 2, d: 12, mu: 0.15 }; const F = 500;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 30], y: [0, 1], label: 'Efficiency against lead angle: driving (lime) and back-driving (amber)' });
  p.draw = (P) => {
    const phi = Math.atan(s.mu); const lam = Math.atan(s.lead / (Math.PI * s.d)); const deg = 180 / Math.PI;
    P.axes({ xl: 'lead angle λ [°]', yl: 'η' }); P.fn((x) => { const l = x / deg; return Math.tan(l) / Math.tan(l + phi); }, C.lime, 2); P.fn((x) => { const l = x / deg; return l > phi ? Math.tan(l - phi) / Math.tan(l) : NaN; }, C.warn, 2);
    P.line([phi * deg, phi * deg], [0, 1], C.dim, 1, [4, 4]); const eta = Math.tan(lam) / Math.tan(lam + phi); P.dot(lam * deg, eta, C.bone, 6);
    const T = F * s.lead / 1000 / (TAU * eta);
    read.innerHTML = `λ = atan(lead/(π d)) = <b>${(lam * deg).toFixed(2)}°</b>, friction angle φ = atan μ = ${(phi * deg).toFixed(2)}° · driving efficiency <b>${(100 * eta).toFixed(0)} %</b> · torque to push 500 N: ${(T * 1000).toFixed(0)} mN·m · ${lam > phi ? `<b>back-drivable</b> (λ > φ), back-driving efficiency ${(100 * Math.tan(lam - phi) / Math.tan(lam)).toFixed(0)} %` : '<b>self-locking</b> (λ ≤ φ): the load cannot turn the screw'}`;
  };
  ctrls.append(slider('Lead', { min: 0.5, max: 40, step: 0.5, value: s.lead, fmt: (v) => v.toFixed(1) + ' mm' }, (v) => { s.lead = v; p.redraw(); }),
    slider('Diameter', { min: 6, max: 40, step: 1, value: s.d, fmt: (v) => v + ' mm' }, (v) => { s.d = v; p.redraw(); }),
    slider('Friction μ', { min: 0.005, max: 0.3, step: 0.005, value: s.mu, fmt: (v) => v.toFixed(3) }, (v) => { s.mu = v; p.redraw(); }));
  p.redraw();
};

// p09-l16: pneumatic cylinder
export function simCylinder({ d0 = 1.5e-3, F = 200, ps = 7e5, bore = 0.032, stroke = 0.2, m = 5, T = 2, dt = 2e-5 }) {
  const A = Math.PI * bore * bore / 4, Ao = Math.PI * d0 * d0 / 4, Cd = 0.8, Rg = 287, Tk = 293, pa = 1.013e5, x0 = 0.01, c = 50;
  let p = pa, x = 0, v = 0; const ts = [], xs = [], pres = []; let tEnd = NaN;
  for (let n = 0; n * dt <= T; n++) { const r = p / ps; const psi = r <= 0.528 ? 0.0404 : 0.0404 * Math.sqrt(Math.max(0, 1 - ((r - 0.528) / 0.472) ** 2)); const mdot = Cd * Ao * psi * ps / Math.sqrt(Tk);
    const V = A * (x0 + x); let a = ((p - pa) * A - F - c * v) / m; if (x <= 0 && a < 0) { a = 0; v = 0; } if (x >= stroke) { a = Math.min(a, 0); v = Math.min(v, 0); }
    v += a * dt; x = clamp(x + v * dt, 0, stroke); p += dt * (Rg * Tk * mdot - p * A * v) / V; if (isNaN(tEnd) && x >= stroke) tEnd = n * dt;
    if (n % 100 === 0) { ts.push(n * dt); xs.push(x / stroke); pres.push(p / 1e5); } }
  return { ts, xs, pres, tEnd, A, Ao, mdot: Cd * Ao * 0.0404 * ps / Math.sqrt(Tk) };
}
W.pneumatic = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { d0: 1.5, F: 200 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 2], y: [0, 8], label: 'Chamber pressure in bar abs (blue) and piston travel ×7 (lime)' });
  p.draw = (P) => {
    const r = simCylinder({ d0: s.d0 / 1000, F: s.F }); const pw = 1.013e5 + s.F / r.A; const est = 0.2 * r.A * pw / (r.mdot * 287 * 293);
    P.axes({ xl: 't [s]' }); P.line(r.ts, r.pres, C.signal, 2); P.line(r.ts, r.xs.map((v) => 7 * v), C.lime, 2); if (!isNaN(r.tEnd)) P.line([r.tEnd, r.tEnd], [0, 8], C.dim, 1, [3, 3]);
    read.innerHTML = `working pressure p<sub>atm</sub> + F/A = ${(pw / 1e5).toFixed(2)} bar abs (choked if below 3.7 bar) · choked mass flow ${(r.mdot * 1000).toFixed(2)} g/s · estimate stroke·A·p/(ṁ R T) = <b>${est.toFixed(2)} s</b> · simulated full stroke <b>${isNaN(r.tEnd) ? 'not reached' : r.tEnd.toFixed(2) + ' s'}</b> (includes the time to build pressure)`;
  };
  ctrls.append(slider('Valve orifice', { min: 0.8, max: 3, step: 0.1, value: s.d0, fmt: (v) => v.toFixed(1) + ' mm' }, (v) => { s.d0 = v; p.redraw(); }),
    slider('Load force', { min: 0, max: 350, step: 10, value: s.F, fmt: (v) => v + ' N' }, (v) => { s.F = v; p.redraw(); }));
  p.redraw();
};

// p09-l17: hydraulic lift pressures
W.hydraulic = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { load: 20, bore: 50, Q: 12 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 4], y: [0, 250], label: 'Pressure along the circuit, pump to cylinder' });
  p.draw = (P) => {
    const A = Math.PI * (s.bore / 1000) ** 2 / 4; const pc = s.load * 1000 / A / 1e5; const q = s.Q / 60000; const v = q / A;
    const dpValve = 5 * (s.Q / 12) ** 2, dpHose = 3 * (s.Q / 12) ** 1.75, dpFilter = 1; const pp = pc + dpValve + dpHose + dpFilter;
    const nodes = [['pump', pp], ['filter', pp - dpFilter], ['valve', pp - dpFilter - dpValve], ['cylinder', pc]];
    P.axes({ xl: '', yl: 'p [bar]' }); nodes.forEach(([n, v], i) => { rect(P, i + 0.2, 0, i + 0.8, Math.min(v, 250), v > 210 ? C.bad : i === 3 ? C.lime : C.signal); P.text(n, i + 0.22, Math.min(v, 250) + 6, C.bone); });
    P.line([0, 4], [210, 210], C.warn, 1, [5, 4]);
    read.innerHTML = `cylinder pressure F/A = <b>${pc.toFixed(0)} bar</b> · losses: filter ${dpFilter.toFixed(1)}, valve ${dpValve.toFixed(1)}, hose ${dpHose.toFixed(1)} bar · pump ${pp.toFixed(0)} bar (relief valve 210 bar, amber)${pp > 210 ? ' → <b>relief opens, the load does not lift</b>' : ''} · lift speed Q/A = <b>${(v * 1000).toFixed(0)} mm/s</b> · hydraulic power ${(pp * 1e5 * q / 1000).toFixed(2)} kW`;
  };
  ctrls.append(slider('Load', { min: 1, max: 60, step: 1, value: s.load, fmt: (v) => v + ' kN' }, (v) => { s.load = v; p.redraw(); }),
    slider('Bore', { min: 25, max: 100, step: 5, value: s.bore, fmt: (v) => v + ' mm' }, (v) => { s.bore = v; p.redraw(); }),
    slider('Pump flow', { min: 2, max: 40, step: 1, value: s.Q, fmt: (v) => v + ' L/min' }, (v) => { s.Q = v; p.redraw(); }));
  p.redraw();
};

// p09-l18: pump and system curves
W.pumpcurve = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 1, Hs: 6 }; const H0 = 20, k = 0.08, r = 0.04, eta = 0.6;
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 18], y: [0, 24], label: 'Pump curve at this speed (lime), full speed (dim) and system curve (amber)' });
  p.draw = (P) => {
    P.axes({ xl: 'Q [m³/h]', yl: 'H [m]' }); P.fn((q) => { const v = H0 - k * q * q; return v > 0 ? v : NaN; }, C.dim, 1.2, [4, 4]); P.fn((q) => { const v = s.n * s.n * H0 - k * q * q; return v > 0 ? v : NaN; }, C.lime, 2); P.fn((q) => s.Hs + r * q * q, C.warn, 2);
    const disc2 = s.n * s.n * H0 - s.Hs; if (disc2 <= 0) { read.innerHTML = `at ${(s.n * 100).toFixed(0)} % speed the pump's shut-off head ${(s.n * s.n * H0).toFixed(1)} m is below the ${s.Hs} m static lift: <b>no flow</b>`; return; }
    const Q = Math.sqrt(disc2 / (k + r)), H = s.Hs + r * Q * Q; P.dot(Q, H, C.bone, 6); const Pw = 1000 * 9.81 * (Q / 3600) * H / eta;
    const Qf = Math.sqrt((H0 - s.Hs) / (k + r)), Hf = s.Hs + r * Qf * Qf, Pf = 1000 * 9.81 * (Qf / 3600) * Hf / eta;
    read.innerHTML = `operating point Q = <b>${Q.toFixed(1)} m³/h</b>, H = ${H.toFixed(1)} m, shaft power ${Pw.toFixed(0)} W · full speed: ${Qf.toFixed(1)} m³/h, ${Pf.toFixed(0)} W · affinity laws (Q ∝ n, P ∝ n³) predict ${(Qf * s.n).toFixed(1)} m³/h and ${(Pf * s.n ** 3).toFixed(0)} W: ${s.Hs === 0 ? 'exact, since the system curve is a parabola through the origin' : 'off, because the static lift is not scaled by speed'} · energy per m³ ${(Pw / Q / 1000).toFixed(3)} kWh`;
  };
  ctrls.append(slider('Pump speed', { min: 0.4, max: 1, step: 0.01, value: s.n, fmt: (v) => (v * 100).toFixed(0) + ' %' }, (v) => { s.n = v; p.redraw(); }),
    slider('Static lift', { min: 0, max: 15, step: 0.5, value: s.Hs, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.Hs = v; p.redraw(); }));
  p.redraw();
};

// p09-l19: two-node motor thermal model
export function simThermal({ I = 6, duty = 0.5, period = 120, Ta = 30, T = 7200, dt = 0.5 }) {
  const R20 = 0.5, Cw = 300, Ch = 3000, Rwh = 1.0, Rha = 1.5; let Tw = Ta, Th = Ta; const ts = [], tw = [], th = [];
  for (let n = 0; n * dt <= T; n++) { const t = n * dt; const on = (t % period) < duty * period; const P = on ? I * I * R20 * (1 + 0.00393 * (Tw - 20)) : 0;
    const qwh = (Tw - Th) / Rwh; Tw += dt * (P - qwh) / Cw; Th += dt * (qwh - (Th - Ta) / Rha) / Ch; if (n % 40 === 0) { ts.push(t); tw.push(Tw); th.push(Th); } }
  return { ts, tw, th };
}
W.thermal = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { I: 9, duty: 0.5 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 120], y: [20, 200], label: 'Winding (lime) and housing (blue) temperature under an on/off duty cycle' });
  p.draw = (P) => {
    const r = simThermal(s); P.axes({ xl: 't [min]', yl: 'T [°C]' }); P.line([0, 120], [155, 155], C.bad, 1, [5, 4]); P.line(r.ts.map((t) => t / 60), r.tw.map((v) => Math.min(v, 200)), C.lime, 1.6); P.line(r.ts.map((t) => t / 60), r.th, C.signal, 2);
    // steady-state average with copper's resistance rising: solve T = Ta + Pavg(T)·(Rwh+Rha)
    let Tss = 30; for (let k = 0; k < 50; k++) Tss = 30 + s.duty * s.I * s.I * 0.5 * (1 + 0.00393 * (Tss - 20)) * 2.5;
    const peak = Math.max(...r.tw);
    read.innerHTML = `average loss ${(s.duty * s.I * s.I * 0.5).toFixed(0)} W cold · steady average winding temperature T<sub>a</sub> + P̄·(R<sub>wh</sub> + R<sub>ha</sub>) = <b>${Tss > 400 || Tss < 0 ? 'runaway' : Tss.toFixed(0) + ' °C'}</b> · simulated peak <b>${peak.toFixed(0)} °C</b> · class F limit 155 °C (red)${peak > 155 ? ' → <b>too hot</b>' : ''}`;
  };
  ctrls.append(slider('Current when on', { min: 1, max: 12, step: 0.5, value: s.I, fmt: (v) => v.toFixed(1) + ' A' }, (v) => { s.I = v; p.redraw(); }),
    slider('Duty cycle (2-min period)', { min: 0.1, max: 1, step: 0.05, value: s.duty, fmt: (v) => (v * 100).toFixed(0) + ' %' }, (v) => { s.duty = v; p.redraw(); }));
  p.redraw();
};

// p09-l20: scooter hub motor sizing
export function roadLoad({ m = 180, grade = 0.1, v = 30 / 3.6, Crr = 0.015, CdA = 0.6, rho = 1.15 }) {
  const th = Math.atan(grade), g = 9.81; const Fr = Crr * m * g * Math.cos(th), Fa = 0.5 * rho * CdA * v * v, Fg = m * g * Math.sin(th); return { Fr, Fa, Fg, F: Fr + Fa + Fg, P: (Fr + Fa + Fg) * v };
}
W.scooter = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { grade: 10, v: 30, m: 180 }; const rw = 0.25;
  const pd = new Plot(body, { aspect: 0.5, maxH: 220, x: [-1, 3], y: [-0.2, 1.8], equal: true, label: 'Scooter on the slope with the force components' });
  const draw = () => {
    const r = roadLoad({ m: s.m, grade: s.grade / 100, v: s.v / 3.6 }); const th = Math.atan(s.grade / 100);
    pd.draw = (P) => { const c = Math.cos(th), sn = Math.sin(th); P.poly([[-1, 0], [3, 0], [3, 4 * sn / c]], '#1a1d16', C.rule2); const px = 1.2, py = (px + 1) * sn / c;
      const rot = (x, y) => [px + x * c - y * sn, py + x * sn + y * c]; P.poly([rot(-0.45, 0.12), rot(0.45, 0.12), rot(0.35, 0.4), rot(-0.3, 0.45)], '#2a3320', C.lime);
      [[-0.35, 0.12], [0.35, 0.12]].forEach(([x, y]) => { const [a, b] = rot(x, y); circle(P, a, b, 0.12, C.bone, 2); });
      const [ax, ay] = rot(0, 0.3); const sc = 0.0018; P.arrow(ax, ay, ax - r.Fg * sc * c, ay - r.Fg * sc * sn, C.bad, 2.5); P.arrow(ax, ay + 0.25, ax - r.Fa * sc * c, ay + 0.25 - r.Fa * sc * sn, C.signal, 2.5);
      const pw = Math.min(r.P / 6000, 1); rect(P, 2.5, 1.0, 2.9, 1.75, '#14160f', C.rule2); rect(P, 2.5, 1.0, 2.9, 1.0 + 0.75 * pw, r.P > 4000 ? C.bad : C.lime); P.text('kW', 2.55, 0.9, C.fog); };
    pd.redraw();
    const Tw = r.F * rw, rpm = s.v / 3.6 / rw * 60 / TAU; const flat = roadLoad({ m: s.m, grade: 0, v: s.v / 3.6 });
    read.innerHTML = `forces: rolling ${r.Fr.toFixed(0)} N, aero ${r.Fa.toFixed(0)} N (blue), grade ${r.Fg.toFixed(0)} N (red) · wheel power <b>${(r.P / 1000).toFixed(2)} kW</b> · hub torque ${Tw.toFixed(0)} N·m at ${rpm.toFixed(0)} rpm (0.25 m wheel radius) · on the flat ${(flat.P / 1000).toFixed(2)} kW, ${(flat.F / 3600).toFixed(1)} Wh/km at the wheel`;
  };
  ctrls.append(slider('Grade', { min: 0, max: 25, step: 0.5, value: s.grade, fmt: (v) => v.toFixed(1) + ' %' }, (v) => { s.grade = v; draw(); }),
    slider('Speed', { min: 5, max: 70, step: 1, value: s.v, fmt: (v) => v + ' km/h' }, (v) => { s.v = v; draw(); }),
    slider('Mass with rider(s)', { min: 100, max: 260, step: 5, value: s.m, fmt: (v) => v + ' kg' }, (v) => { s.m = v; draw(); }));
  draw();
};

export default W;
