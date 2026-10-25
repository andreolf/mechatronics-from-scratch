// Widgets for Phase 19 (power electronics, batteries and safety). Sliders, selects, toggles and buttons only, plus optional drag handles.
// All component values are illustrative. The safety widgets are teaching models, not substitutes for the standards.
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
const setSlider = (c, v) => { const inp = c.querySelector('input'); inp.value = v; inp.dispatchEvent(new Event('input')); };

// ---- p19-l01: linear regulator against a buck converter ----
W.linvssw = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { vin: 12, vout: 3.3, i: 2, eta: 95, th: 40 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0.8, 11.5], y: [0, 100], label: 'Efficiency against output voltage for a linear regulator and a buck converter' });
  const redraw = () => {
    const vout = Math.min(s.vout, s.vin - 0.3), po = vout * s.i, etaL = vout / s.vin, pl = (s.vin - vout) * s.i, pb = po * (100 / s.eta - 1);
    p.setRange([0.8, Math.max(2, s.vin - 0.3)], [0, 100]);
    p.draw = (P) => { P.axes({ xl: 'Vout (V)', yl: 'efficiency (%)' }); P.fn((v) => (100 * v) / s.vin, C.warn, 2); P.fn(() => s.eta, C.lime, 2);
      P.dot(vout, 100 * etaL, C.warn, 5); P.dot(vout, s.eta, C.lime, 5); P.text('linear', 1, 100 * (1 / s.vin) + 4, C.warn); P.text('buck', 1, s.eta - 6, C.lime); };
    p.redraw();
    read.innerHTML = `${f1(s.vin)} → ${f2(vout)} V at ${f1(s.i)} A (${f2(po)} W out) · ${sp(C.warn, 'linear')} ${f1(100 * etaL)} %, ${f2(pl)} W heat, rise ${pl * s.th > 100 ? bad(Math.round(pl * s.th) + ' K') : Math.round(pl * s.th) + ' K'} · ${sp(C.lime, 'buck')} ${f1(s.eta)} %, ${f3(pb)} W heat, rise ${f1(pb * s.th)} K (θ = ${s.th} K/W)`;
  };
  ctrls.append(slider('Input voltage (V)', { min: 5, max: 24, step: 0.5, value: s.vin, fmt: f1 }, (v) => { s.vin = v; redraw(); }),
    slider('Output voltage (V)', { min: 1, max: 15, step: 0.1, value: s.vout, fmt: f1 }, (v) => { s.vout = v; redraw(); }),
    slider('Load current (A)', { min: 0.1, max: 5, step: 0.1, value: s.i, fmt: f1 }, (v) => { s.i = v; redraw(); }),
    slider('Buck efficiency (%)', { min: 75, max: 98, step: 0.5, value: s.eta, fmt: f1 }, (v) => { s.eta = v; redraw(); }),
    slider('Thermal resistance to air (K/W)', { min: 5, max: 80, step: 1, value: s.th }, (v) => { s.th = v; redraw(); }));
  redraw();
};

// ---- p19-l02: buck inductor current and output ripple ----
W.buckripple = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { vin: 12, d: 0.275, L: 22, f: 500, C: 47, R: 1.65 };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.7, maxH: 300, x: [0, 3], y: [0, 4], label: 'Inductor current over three switching periods' });
  const q = new Plot(d2, { aspect: 0.7, maxH: 300, x: [0, 3], y: [-3, 3], label: 'Output voltage ripple (mV) over three periods' });
  const redraw = () => {
    const vo = s.vin * s.d, io = vo / s.R, T = 1 / (s.f * 1e3), dI = ((s.vin - vo) * s.d * T) / (s.L * 1e-6), dV = dI / (8 * s.f * 1e3 * s.C * 1e-6), dcm = io < dI / 2;
    const xs = [], ys = [];
    for (let k = 0; k <= 600; k++) { const t = (k / 200) % 1, x = k / 200; const iL = t < s.d ? io - dI / 2 + (dI * t) / s.d : io + dI / 2 - (dI * (t - s.d)) / (1 - s.d); xs.push(x); ys.push(Math.max(0, iL)); }
    // ripple voltage: integral of (iL - io)/C, centred
    let acc = 0; const raw = ys.map((iL, k) => (acc += ((iL - io) * (T / 200)) / (s.C * 1e-6))); const mid = (Math.max(...raw.slice(200)) + Math.min(...raw.slice(200))) / 2;
    const ymax = Math.max(1, io + dI); p.setRange([0, 3], [0, ymax * 1.15]);
    const vr = raw.map((v) => 1000 * (v - mid)), vm = Math.max(0.5, ...vr.map(Math.abs)) * 1.3; q.setRange([0, 3], [-vm, vm]);
    p.draw = (P) => { P.axes({ xl: 'periods', yl: 'iL (A)' }); P.line([0, 3], [io, io], C.dim, 1, [4, 4]); P.line(xs, ys, dcm ? C.warn : C.lime, 2); };
    q.draw = (P) => { P.axes({ xl: 'periods', yl: 'ΔVout (mV)' }); P.line(xs.slice(200), vr.slice(200), C.signal, 2); };
    p.redraw(); q.redraw();
    read.innerHTML = `Vout ${f3(vo)} V, Iout ${f3(io)} A · ripple current ΔI ${(dI).toFixed(4)} A (${f1((100 * dI) / io)} % of Iout), peak ${f3(io + dI / 2)} A · output ripple ΔV ≈ ${f3(dV * 1000)} mV${dcm ? ' · ' + sp(C.warn, 'Iout < ΔI/2: the converter enters discontinuous mode and these formulas no longer hold') : ''}`;
  };
  ctrls.append(slider('Input voltage (V)', { min: 5, max: 24, step: 0.5, value: s.vin, fmt: f1 }, (v) => { s.vin = v; redraw(); }),
    slider('Duty cycle D', { min: 0.05, max: 0.95, step: 0.005, value: s.d, fmt: f3 }, (v) => { s.d = v; redraw(); }),
    slider('Inductance (µH)', { min: 1, max: 100, step: 1, value: s.L }, (v) => { s.L = v; redraw(); }),
    slider('Switching frequency (kHz)', { min: 100, max: 2000, step: 50, value: s.f }, (v) => { s.f = v; redraw(); }),
    slider('Output capacitance (µF)', { min: 4.7, max: 220, step: 0.1, value: s.C, fmt: f1 }, (v) => { s.C = v; redraw(); }),
    slider('Load resistance (Ω)', { min: 0.5, max: 50, step: 0.05, value: s.R, fmt: f2 }, (v) => { s.R = v; redraw(); }));
  redraw();
};

// ---- p19-l03: boost conversion ratio with inductor resistance ----
W.boostcurve = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { vin: 5, d: 0.7, rl: 0.2, R: 50 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 0.98], y: [0, 12], label: 'Boost output over input against duty cycle, ideal and with inductor resistance' });
  const M = (d) => (1 / (1 - d)) / (1 + s.rl / (s.R * (1 - d) ** 2));
  const redraw = () => {
    let best = 0, dm = 0; for (let d = 0; d < 0.995; d += 0.001) { const m = M(d); if (m > best) { best = m; dm = d; } }
    p.draw = (P) => { P.axes({ xl: 'duty cycle D', yl: 'Vout / Vin' }); P.fn((d) => Math.min(13, 1 / (1 - d)), C.dim, 1.5, [5, 4]); P.fn(M, C.lime, 2);
      P.dot(s.d, M(s.d), C.signal, 5); P.dot(dm, best, C.warn, 4); P.text('ideal 1/(1−D)', 0.05, 11, C.dim); };
    p.redraw();
    const vo = s.vin * M(s.d), eta = (M(s.d) * (1 - s.d)) * 100, iin = vo ** 2 / s.R / s.vin;
    read.innerHTML = `D ${f3(s.d)}: ideal ${f3(s.vin / (1 - s.d))} V, with rL ${f3(vo)} V · efficiency from rL alone ${f1(eta)} % · input current ${f2(iin)} A · ${sp(C.warn, `peak ratio ${f2(best)}× at D ${f2(dm)}`)}${s.d > dm ? ' · ' + bad('beyond the peak: more duty gives less voltage, and a controller here would run away') : ''}`;
  };
  ctrls.append(slider('Input voltage (V)', { min: 3, max: 24, step: 0.5, value: s.vin, fmt: f1 }, (v) => { s.vin = v; redraw(); }),
    slider('Duty cycle D', { min: 0, max: 0.97, step: 0.005, value: s.d, fmt: f3 }, (v) => { s.d = v; redraw(); }),
    slider('Inductor resistance rL (Ω)', { min: 0, max: 1, step: 0.01, value: s.rl, fmt: f2 }, (v) => { s.rl = v; redraw(); }),
    slider('Load resistance (Ω)', { min: 5, max: 200, step: 1, value: s.R }, (v) => { s.R = v; redraw(); }));
  redraw();
};

// ---- p19-l04: flyback magnetising current and core energy ----
W.flybackcore = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { vin: 24, d: 0.4, n: 4, R: 2, Lm: 100, f: 100 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 3], y: [0, 2], label: 'Primary and reflected secondary current over three periods' });
  const redraw = () => {
    const T = 1 / (s.f * 1e3), vo = (s.vin * s.d) / ((1 - s.d) * s.n), po = vo ** 2 / s.R, iavgIn = po / s.vin;
    const dI = (s.vin * s.d * T) / (s.Lm * 1e-6), ipri_avg = iavgIn / s.d, imin = ipri_avg - dI / 2, imax = ipri_avg + dI / 2, dcm = imin < 0;
    const e = 0.5 * s.Lm * 1e-6 * (Math.max(imax, 0) ** 2 - Math.max(imin, 0) ** 2);
    const xs = [], yp = [], ysx = [];
    for (let k = 0; k <= 600; k++) { const t = (k / 200) % 1; xs.push(k / 200); if (t < s.d) { yp.push(Math.max(0, imin + (dI * t) / s.d)); ysx.push(0); } else { yp.push(0); ysx.push(Math.max(0, imax - (dI * (t - s.d)) / (1 - s.d))); } }
    p.setRange([0, 3], [0, Math.max(0.5, imax) * 1.2]);
    p.draw = (P) => { P.axes({ xl: 'periods', yl: 'current (A)' }); P.line(xs, yp, C.lime, 2); P.line(xs, ysx, C.signal, 2); P.text('primary', 0.05, Math.max(0.5, imax) * 1.12, C.lime); P.text('secondary ÷ n', 0.8, Math.max(0.5, imax) * 1.12, C.signal); };
    p.redraw();
    read.innerHTML = `Vout ${f3(vo)} V (CCM formula Vin·D/((1−D)·n)) · Pout ${f2(po)} W · primary current ${f3(Math.max(0, imin))} → ${f3(imax)} A · core energy per cycle ${f1(e * 1e6)} µJ × ${s.f} kHz = ${f2(e * s.f * 1e3)} W (Pout ${f2(po)} W) · switch stress Vin + n·Vout = ${f1(s.vin + s.n * vo)} V${dcm ? ' · ' + sp(C.warn, 'magnetising current reaches zero: discontinuous mode, the CCM formula overestimates') : ''}`;
  };
  ctrls.append(slider('Input voltage (V)', { min: 12, max: 48, step: 1, value: s.vin }, (v) => { s.vin = v; redraw(); }),
    slider('Duty cycle D', { min: 0.1, max: 0.7, step: 0.01, value: s.d, fmt: f2 }, (v) => { s.d = v; redraw(); }),
    slider('Turns ratio n = Np/Ns', { min: 0.5, max: 8, step: 0.1, value: s.n, fmt: f1 }, (v) => { s.n = v; redraw(); }),
    slider('Load (Ω)', { min: 1, max: 100, step: 1, value: s.R }, (v) => { s.R = v; redraw(); }),
    slider('Magnetising inductance (µH)', { min: 10, max: 500, step: 5, value: s.Lm }, (v) => { s.Lm = v; redraw(); }));
  redraw();
};

// ---- p19-l05: loop gain Bode plot with a type-II compensator ----
W.loopbode = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 1.0, fz: 4444, fp: 90000, q: 2 };
  const F0 = 1565, FESR = 6773, VIN = 12, KMOD = 1;
  const [d1, d2] = twoUp(body);
  const pm = new Plot(d1, { aspect: 0.7, maxH: 300, x: [100, 1e6], y: [-60, 60], logx: true, label: 'Loop gain magnitude (dB)' });
  const pp = new Plot(d2, { aspect: 0.7, maxH: 300, x: [100, 1e6], y: [-270, 0], logx: true, label: 'Loop gain phase (degrees)' });
  // complex helpers
  const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], cd = (a, b) => { const d = b[0] ** 2 + b[1] ** 2; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const Lraw = (f) => { const w = 2 * Math.PI * f, w0 = 2 * Math.PI * F0, we = 2 * Math.PI * FESR, wz = 2 * Math.PI * s.fz, wp = 2 * Math.PI * s.fp;
    const G = cd([VIN * KMOD, (VIN * KMOD * w) / we], [1 - (w / w0) ** 2, w / (s.q * w0)]);
    const Gc = cd([1, w / wz], cm([0, w], [1, w / wp]));
    return cm(G, Gc); };
  let K0 = 1; { const v = Lraw(2.0e4); K0 = 1 / Math.hypot(...v); }                                   // gain 1 puts the crossover at 20 kHz with the default zero, pole and Q
  const L = (f) => { const v = Lraw(f); return [v[0] * K0 * s.k, v[1] * K0 * s.k]; };
  const redraw = () => {
    const fs = [], mag = [], ph = []; let prev = 0, unwrap = 0;
    for (let i = 0; i <= 400; i++) { const f = 10 ** (2 + (4 * i) / 400), v = L(f); let a = (Math.atan2(v[1], v[0]) * 180) / Math.PI; if (i && a - prev > 180) unwrap -= 360; if (i && a - prev < -180) unwrap += 360; prev = a; fs.push(f); mag.push(20 * Math.log10(Math.hypot(...v))); ph.push(a + unwrap); }
    let fc = null, pmv = null; for (let i = 1; i < fs.length; i++) if (mag[i - 1] > 0 && mag[i] <= 0) { const t = mag[i - 1] / (mag[i - 1] - mag[i]); fc = fs[i - 1] * (fs[i] / fs[i - 1]) ** t; pmv = 180 + ph[i - 1] + t * (ph[i] - ph[i - 1]); break; }
    while (pmv !== null && pmv > 180) pmv -= 360;
    pm.draw = (P) => { P.axes({ xl: 'Hz', yl: 'dB' }); P.line([100, 1e6], [0, 0], C.dim, 1, [4, 4]); P.line(fs, mag.map((m) => clamp(m, -60, 60)), C.lime, 2); if (fc) P.dot(fc, 0, C.warn, 5); };
    pp.draw = (P) => { P.axes({ xl: 'Hz', yl: 'deg' }); P.line([100, 1e6], [-180, -180], C.bad, 1, [4, 4]); P.line(fs, ph.map((v) => clamp(v, -270, 0)), C.signal, 2); if (fc) P.line([fc, fc], [-270, 0], C.warn, 1, [3, 3]); };
    pm.redraw(); pp.redraw();
    read.innerHTML = fc ? `crossover ${f2(fc / 1000)} kHz (${f1((100 * fc) / 500e3)} % of a 500 kHz switching frequency) · phase margin ${pmv >= 45 ? ok(f1(pmv) + '°') : pmv > 0 ? sp(C.warn, f1(pmv) + '°') : bad(f1(pmv) + '°: unstable')} · LC pole ${F0} Hz, ESR zero ${FESR} Hz, compensator zero ${s.fz} Hz, pole ${s.fp} Hz` : bad('no crossover in range');
  };
  ctrls.append(slider('Compensator gain (relative)', { min: 0.1, max: 4, step: 0.05, value: s.k, fmt: f2 }, (v) => { s.k = v; redraw(); }),
    slider('Compensator zero (Hz)', { min: 200, max: 20000, step: 50, value: s.fz }, (v) => { s.fz = v; redraw(); }),
    slider('Compensator pole (Hz)', { min: 10000, max: 400000, step: 1000, value: s.fp }, (v) => { s.fp = v; redraw(); }),
    slider('Output filter Q (load)', { min: 0.5, max: 8, step: 0.1, value: s.q, fmt: f1 }, (v) => { s.q = v; redraw(); }));
  redraw();
};

// ---- p19-l06: MOSFET thermal equilibrium and runaway ----
W.thermalnet = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { i: 10, rds: 25, psw: 1.2, tha: 11.8, ta: 40 };
  const THJC = 0.8, THCS = 0.5, TC = 0.006;              // K/W, K/W, Rds(on) rise per K
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 250], y: [0, 30], label: 'Heat generated and heat removed against junction temperature' });
  const redraw = () => {
    const th = THJC + THCS + s.tha, gen = (T) => s.i ** 2 * s.rds * 1e-3 * (1 + TC * (T - 25)) + s.psw, rem = (T) => (T - s.ta) / th;
    let T = s.ta, eq = null; for (let k = 0; k < 2000; k++) { const Tn = s.ta + gen(T) * th; if (Math.abs(Tn - T) < 1e-6) { eq = Tn; break; } if (Tn > 400) break; T = Tn; }
    const ymax = Math.max(5, gen(250) * 1.1, rem(250) * 1.1); p.setRange([0, 250], [0, ymax]);
    p.draw = (P) => { P.axes({ xl: 'junction temperature (°C)', yl: 'W' }); P.fn(gen, C.bad, 2); P.fn((x) => Math.max(0, rem(x)), C.signal, 2); P.line([175, 175], [0, ymax], C.warn, 1, [4, 4]); P.text('175 °C limit', 178, ymax * 0.92, C.warn);
      if (eq !== null && eq < 250) P.dot(eq, gen(eq), C.lime, 6); P.text('generated', 5, gen(5) + ymax * 0.05, C.bad); P.text('removed', 120, Math.max(0, rem(120)) + ymax * 0.05, C.signal); };
    p.redraw();
    read.innerHTML = eq === null ? `${bad('thermal runaway')}: heat generated grows faster than the heatsink can remove it, no equilibrium below 400 °C · total θ ${f2(th)} K/W` :
      `equilibrium Tj ${eq > 175 ? bad(f1(eq) + ' °C, above the 175 °C limit') : ok(f1(eq) + ' °C')} · losses ${f2(gen(eq))} W (conduction ${f2(gen(eq) - s.psw)}, switching ${f2(s.psw)}) · θ total ${f2(th)} K/W (jc ${THJC}, cs ${THCS}, sa ${s.tha}) · Rds(on) ${f1(s.rds * (1 + TC * (eq - 25)))} mΩ hot`;
  };
  ctrls.append(slider('Drain current (A)', { min: 1, max: 40, step: 0.5, value: s.i, fmt: f1 }, (v) => { s.i = v; redraw(); }),
    slider('Rds(on) at 25 °C (mΩ)', { min: 2, max: 100, step: 1, value: s.rds }, (v) => { s.rds = v; redraw(); }),
    slider('Switching loss (W)', { min: 0, max: 5, step: 0.1, value: s.psw, fmt: f1 }, (v) => { s.psw = v; redraw(); }),
    slider('Heatsink θsa (K/W)', { min: 0.5, max: 62, step: 0.1, value: s.tha, fmt: f1 }, (v) => { s.tha = v; redraw(); }),
    slider('Ambient (°C)', { min: 0, max: 85, step: 1, value: s.ta }, (v) => { s.ta = v; redraw(); }));
  redraw();
};

// ---- p19-l07: bootstrap capacitor voltage ----
W.bootstrap = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cb: 470, qg: 72.7, ileak: 100, f: 20, d: 0.8, full: false };
  const VCC = 12, VD = 0.6, UVLO = 8;
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 10], y: [7, 12], label: 'Bootstrap capacitor voltage over ten switching periods' });
  const redraw = () => {
    const d = s.full ? 1 : s.d, T = 1 / (s.f * 1e3), cb = s.cb * 1e-9, top = VCC - VD, xs = [], ys = []; let v = top, vmin = top, on = false, tUv = null;
    const periods = s.full ? 2000 : 10, nPer = 100, dt = T / nPer;
    for (let k = 0; k < periods * nPer; k++) { const ph = (k % nPer) / nPer, nowOn = ph < d;
      if (nowOn && !on) v -= (s.qg * 1e-9) / cb;                                  // turn-on: gate charge drawn from Cb
      if (nowOn) v -= (s.ileak * 1e-6 * dt) / cb; else v = top;                    // on: leakage; off: recharged through the diode
      v = Math.max(0, v); on = nowOn; vmin = Math.min(vmin, v); if (tUv === null && v < UVLO) tUv = k * dt;
      if (!s.full || k % nPer === 0) { xs.push(s.full ? (k * dt) * 1e3 : k / nPer); ys.push(v); } }
    p.setRange(s.full ? [0, periods * T * 1e3] : [0, 10], [Math.min(7, vmin - 0.3), 12]);
    p.draw = (P) => { P.axes({ xl: s.full ? 'ms' : 'periods', yl: 'V' }); P.line([0, 1e9], [UVLO, UVLO], C.bad, 1, [4, 4]); P.text('UVLO 8 V', s.full ? 0.5 : 0.1, UVLO + 0.15, C.bad); P.line(xs, ys, C.lime, 2); };
    p.redraw();
    const droop = top - vmin, need = 2 * s.qg;                                       // Cb ≥ 2 Qg / ΔV with 1 V allowed droop
    read.innerHTML = s.full ? `100 % duty: no off-time to recharge · ${tUv !== null ? bad(`reaches UVLO after ${f2(tUv * 1e3)} ms`) : ok('stays above UVLO for the window')} · leakage ${s.ileak} µA from ${s.cb} nF` :
      `minimum ${f3(vmin)} V, droop ${f3(droop)} V per cycle · gate charge ${s.qg} nC · ${vmin > UVLO ? ok('above UVLO') : bad('below UVLO: the high-side switch turns off')} · rule of thumb Cb ≥ 2·Qg/1 V = ${Math.round(need)} nF`;
  };
  ctrls.append(slider('Bootstrap capacitor (nF)', { min: 22, max: 2200, step: 1, value: s.cb }, (v) => { s.cb = v; redraw(); }),
    slider('Gate charge (nC)', { min: 10, max: 200, step: 0.1, value: s.qg, fmt: f1 }, (v) => { s.qg = v; redraw(); }),
    slider('Leakage and driver current (µA)', { min: 10, max: 1000, step: 10, value: s.ileak }, (v) => { s.ileak = v; redraw(); }),
    slider('Switching frequency (kHz)', { min: 1, max: 200, step: 1, value: s.f }, (v) => { s.f = v; redraw(); }),
    slider('Duty cycle', { min: 0.05, max: 0.99, step: 0.01, value: s.d, fmt: f2 }, (v) => { s.d = v; redraw(); }),
    toggle('100 % duty (no recharge)', s.full, (v) => { s.full = v; redraw(); }, { id: 'boot-full' }));
  redraw();
};

// ---- p19-l08: space vector hexagon ----
W.svhex = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const s = { vdc: 48, a: 20, th: 40 };
  const p = new Plot(body, { aspect: 0.8, maxH: 380, x: [-36, 36], y: [-36, 36], equal: true, label: 'Space vector hexagon with the reference vector; drag its tip (in Drag mode on touch)' });
  const sl = {};
  const redraw = () => {
    const R = (2 / 3) * s.vdc, lim = s.vdc / Math.sqrt(3), a = Math.min(s.a, lim * 1.0), th = (((s.th % 360) + 360) % 360) * Math.PI / 180;
    const sec = Math.min(Math.floor(th / (Math.PI / 3)), 5), ang = th - sec * Math.PI / 3, m = (Math.sqrt(3) * s.a) / s.vdc;
    let T1 = m * Math.sin(Math.PI / 3 - ang), T2 = m * Math.sin(ang), over = T1 + T2 > 1; if (over) { const k = T1 + T2; T1 /= k; T2 /= k; } const T0 = 1 - T1 - T2;
    const va = s.a * Math.cos(th), vb = s.a * Math.sin(th);
    const phase = [0, 1, 2].map((k) => s.a * Math.cos(th - (2 * Math.PI * k) / 3)), cm = -(Math.max(...phase) + Math.min(...phase)) / 2, duty = phase.map((v) => clamp(0.5 + (v + cm) / s.vdc, 0, 1));
    const V = R * 1.2; p.setRange([-V, V], [-V, V]);
    p.draw = (P) => { P.axes({ xl: 'vα (V)', yl: 'vβ (V)' }); const hx = []; for (let k = 0; k < 6; k++) hx.push([R * Math.cos((k * Math.PI) / 3), R * Math.sin((k * Math.PI) / 3)]);
      P.poly(hx, 'rgba(198,255,26,.06)', C.rule2); const circ = [], c2 = []; for (let k = 0; k <= 72; k++) { const t = (k * Math.PI) / 36; circ.push(lim * Math.cos(t)); c2.push(lim * Math.sin(t)); } P.line(circ, c2, C.dim, 1, [4, 4]);
      hx.forEach(([x, y], k) => { P.line([0, x], [0, y], k === sec || k === (sec + 1) % 6 ? C.signal : C.rule2, k === sec || k === (sec + 1) % 6 ? 2 : 1); P.text(['100', '110', '010', '011', '001', '101'][k], x * 1.08, y * 1.08, C.fog, 'center'); });
      P.arrow(0, 0, va, vb, over ? C.bad : C.lime, 2.5); P.handle(va, vb, C.warn); };
    p.redraw();
    read.innerHTML = `sector ${sec + 1}, angle in sector ${f1((ang * 180) / Math.PI)}° · m ${f3(m)} · T1 ${(T1).toFixed(4)}, T2 ${(T2).toFixed(4)}, T0 ${(T0).toFixed(4)} · duties (${duty.map((d) => d.toFixed(4)).join(', ')}) · linear limit ${f2(lim)} V${over ? ' · ' + bad('outside the hexagon: overmodulation, the vector is scaled back') : s.a > lim ? ' · ' + sp(C.warn, 'beyond the inscribed circle: distorted') : ''}`;
  };
  p.handles(() => { const th = (s.th * Math.PI) / 180; return [[s.a * Math.cos(th), s.a * Math.sin(th)]]; }, (i, x, y) => {
    const a = clamp(Math.hypot(x, y), 0, 32), th = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360; setSlider(sl.a, a.toFixed(1)); setSlider(sl.th, Math.round(th)); }, el);
  sl.a = slider('Reference amplitude (V)', { min: 0, max: 32, step: 0.1, value: s.a, fmt: f1 }, (v) => { s.a = v; redraw(); });
  sl.th = slider('Reference angle (°)', { min: 0, max: 359, step: 1, value: s.th }, (v) => { s.th = v; redraw(); });
  ctrls.append(sl.a, sl.th, slider('DC bus (V)', { min: 12, max: 60, step: 1, value: s.vdc }, (v) => { s.vdc = v; redraw(); }));
  redraw();
};

// shared battery model (illustrative, as in Lessons 10-14)
const OCV = (s) => 3.0 + 1.2 * s - 0.25 * Math.exp(-12 * s) + 0.05 * Math.sin(3 * s);
const DOCV = (s) => 1.2 + 3.0 * Math.exp(-12 * s) + 0.15 * Math.cos(3 * s);
const pchip = (xs, ys) => { const n = xs.length, hh = [], dl = []; for (let i = 0; i < n - 1; i++) { hh.push(xs[i + 1] - xs[i]); dl.push((ys[i + 1] - ys[i]) / hh[i]); }
  const m = new Array(n).fill(0); m[0] = dl[0]; m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) { if (dl[i - 1] * dl[i] <= 0) m[i] = 0; else { const w1 = 2 * hh[i] + hh[i - 1], w2 = hh[i] + 2 * hh[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); } }
  return (x) => { x = clamp(x, xs[0], xs[n - 1]); let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; const t = (x - xs[i]) / hh[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh[i] * m[i + 1]; }; };
const SOCS = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const NMC = pchip(SOCS, [3.00, 3.30, 3.45, 3.55, 3.62, 3.68, 3.74, 3.82, 3.90, 3.98, 4.07, 4.20]);
const LFP = pchip(SOCS, [2.50, 3.10, 3.20, 3.25, 3.27, 3.28, 3.29, 3.30, 3.31, 3.32, 3.34, 3.60]);

// ---- p19-l09: regenerative braking energy accounts ----
W.regenbooks = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { grade: 10, v: 10, em: 93, eb: 95, pmax: 400 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 100], y: [0, 6.6], label: 'Where the potential energy of the descent goes, as a share of the total' });
  const names = ['stored', 'motor + inverter', 'battery loss', 'rolling', 'air drag', 'friction brakes'], cols = [C.lime, C.warn, C.signal, C.fog, C.dim, C.bad];
  const redraw = () => {
    const m = 40e3, h = 500, g = 9.81, th = Math.atan(s.grade / 100), Ltot = h / Math.sin(th), crr = 0.002, cda = 8, rho = 1.2, ei = 0.97, emi = (s.em / 100) * ei, eb = s.eb / 100, amax = 0.5, dt = 0.05;
    let x = 0, v = 0; const acc = [0, 0, 0, 0, 0, 0];
    for (let k = 0; k < 400000 && x < Ltot; k++) {
      const vref = Ltot - x <= (v * v) / (2 * amax) ? 0 : s.v, fg = m * g * Math.sin(th), fr = crr * m * g * Math.cos(th), fa = 0.5 * rho * cda * v * v;
      const aw = clamp((vref - v) / 2, -amax, amax), fb = Math.max(0, fg - fr - fa - m * aw), pm = fb * v, pe = pm * emi, pb = Math.min(pe, (s.pmax * 1e3) / eb), pf = (pe - pb) / emi;
      acc[0] += pb * eb * dt; acc[1] += (pm - pf) * (1 - emi) * dt; acc[2] += pb * (1 - eb) * dt; acc[3] += fr * v * dt; acc[4] += fa * v * dt; acc[5] += pf * dt;
      const a = (fg - fr - fa - fb) / m, vn = Math.max(0, v + a * dt); x += 0.5 * (v + vn) * dt; v = vn; if (v === 0 && vref === 0) break; }
    const pe = m * g * x * Math.sin(th), gap = pe - acc.reduce((a, b) => a + b, 0) - 0.5 * m * v * v;
    p.draw = (P) => { P.axes({ xl: '% of potential energy', yl: '' }); names.forEach((nm, i) => { const y = 5.6 - i; rect(P, 0, y + 0.15, (100 * acc[i]) / pe, y + 0.8, cols[i], null); const sh = (100 * acc[i]) / pe; P.text(`${nm} ${f1(sh)} %`, sh > 55 ? 2 : sh + 1, y + 0.6, sh > 55 ? C.bg : C.bone); }); };
    p.redraw();
    read.innerHTML = `illustrative 40 t car descending 500 m · released ${f2(pe / 3.6e6)} kWh · stored ${ok(f2(acc[0] / 3.6e6) + ' kWh')} · friction brakes ${acc[5] > 0.01 * pe ? bad(f2(acc[5] / 3.6e6) + ' kWh') : f3(acc[5] / 3.6e6) + ' kWh'} · books close to ${((100 * Math.abs(gap)) / pe).toFixed(3)} % · trip ${f1(x / 1000)} km`;
  };
  ctrls.append(slider('Grade (%)', { min: 2, max: 25, step: 0.5, value: s.grade, fmt: f1 }, (v) => { s.grade = v; redraw(); }),
    slider('Speed (m/s)', { min: 3, max: 20, step: 0.5, value: s.v, fmt: f1 }, (v) => { s.v = v; redraw(); }),
    slider('Motor efficiency (%)', { min: 80, max: 98, step: 0.5, value: s.em, fmt: f1 }, (v) => { s.em = v; redraw(); }),
    slider('Battery charge efficiency (%)', { min: 80, max: 99, step: 0.5, value: s.eb, fmt: f1 }, (v) => { s.eb = v; redraw(); }),
    slider('Battery charge limit (kW)', { min: 0, max: 800, step: 10, value: s.pmax }, (v) => { s.pmax = v; redraw(); }));
  redraw();
};

// ---- p19-l10: OCV curves and a constant-current discharge ----
W.ocvcurve = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { chem: 'nmc', c: 1, r0: 30 };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.75, maxH: 300, x: [0, 100], y: [2.4, 4.3], label: 'Open-circuit voltage against state of charge' });
  const q = new Plot(d2, { aspect: 0.75, maxH: 300, x: [0, 3.1], y: [2.4, 4.3], label: 'Terminal voltage during a constant-current discharge against charge delivered' });
  const redraw = () => {
    const f = s.chem === 'nmc' ? NMC : LFP, vcut = s.chem === 'nmc' ? 3.0 : 2.5, Q = 3.0, I = s.c * Q, r0 = s.r0 / 1000;
    let soc = 1, e = 0, steps = 0; const xs = [], ys = []; const dq = 0.002;
    while (soc > 0 && steps < 5000) { const v = f(soc) - I * r0; if (v <= vcut) break; xs.push((1 - soc) * Q); ys.push(v); e += v * dq * Q; soc -= dq; steps++; }
    const q0 = (1 - soc) * Q, slope = (f(0.8) - f(0.2)) / 60 * 1000;
    p.draw = (P) => { P.axes({ xl: 'SOC (%)', yl: 'V' }); P.fn((x) => NMC(x / 100), s.chem === 'nmc' ? C.lime : C.dim, s.chem === 'nmc' ? 2.5 : 1.2); P.fn((x) => LFP(x / 100), s.chem === 'lfp' ? C.lime : C.dim, s.chem === 'lfp' ? 2.5 : 1.2);
      P.text('NMC', 82, 4.15, C.fog); P.text('LFP', 82, 3.45, C.fog); };
    q.draw = (P) => { P.axes({ xl: 'Ah delivered', yl: 'V' }); P.fn((x) => f(1 - x / Q), C.dim, 1.2, [4, 4]); P.line(xs, ys, C.signal, 2); P.line([0, 3.1], [vcut, vcut], C.bad, 1, [4, 4]); };
    p.redraw(); q.redraw();
    read.innerHTML = `illustrative 3 Ah ${s.chem.toUpperCase()} cell at ${s.c}C (${f1(I)} A) · delivers ${f3(q0)} Ah and ${f2(e)} Wh before the ${vcut} V cut-off, in ${f1((q0 / I) * 60)} min · heat in R0 ${f2(I * I * r0)} W · OCV slope 20-80 % ${f2(slope)} mV per %: a 10 mV error is ${f1(10 / slope)} % SOC`;
  };
  ctrls.append(select('Chemistry', [['nmc', 'NMC (sloped)'], ['lfp', 'LFP (flat)']], s.chem, (v) => { s.chem = v; redraw(); }, 'ocv-chem'),
    slider('C-rate', { min: 0.2, max: 5, step: 0.1, value: s.c, fmt: f1 }, (v) => { s.c = v; redraw(); }),
    slider('Internal resistance R0 (mΩ)', { min: 5, max: 150, step: 1, value: s.r0 }, (v) => { s.r0 = v; redraw(); }));
  redraw();
};

// ---- p19-l11: ECM fit to a pulse test ----
function ecmSim(i, dt, r0, rcs, soc0 = 0.9, Q = 3.0) { let soc = soc0; const vs = rcs.map(() => 0), out = [];
  for (const ik of i) { out.push(OCV(soc) - ik * r0 - vs.reduce((a, b) => a + b, 0)); rcs.forEach(([r, c], j) => { const a = Math.exp(-dt / (r * c)); vs[j] = a * vs[j] + r * (1 - a) * ik; }); soc -= (ik * dt) / (Q * 3600); }
  return out; }
W.ecmfit = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { r0: 15, r1: 10, tau: 10 };
  const dt = 0.5, seg = [[10, 0], [30, 6], [60, 0], [30, 3], [60, 0]], cur = []; seg.forEach(([t, a]) => { for (let k = 0; k < t / dt; k++) cur.push(a); });
  const g = gauss(rng(1)), meas = ecmSim(cur, dt, 0.022, [[0.012, 800], [0.008, 6000]]).map((v) => v + 0.0005 * g()), ts = cur.map((_, k) => k * dt);
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 190], y: [3.6, 4.0], label: 'Measured and modelled terminal voltage during the pulse test' });
  const sl = {};
  const redraw = () => {
    const mod = ecmSim(cur, dt, s.r0 / 1000, [[s.r1 / 1000, s.tau / (s.r1 / 1000)]]), err = mod.map((v, k) => v - meas[k]);
    const rms = 1000 * Math.sqrt(err.reduce((a, e) => a + e * e, 0) / err.length), pk = 1000 * Math.max(...err.map(Math.abs));
    const lo = Math.min(...meas), hi = Math.max(...meas); p.setRange([0, 190], [lo - 0.02, hi + 0.02]);
    p.draw = (P) => { P.axes({ xl: 's', yl: 'V' }); P.line(ts, meas, C.fog, 1.2); P.line(ts, mod, C.lime, 2); P.text('measured', 150, hi + 0.008, C.fog); P.text('model', 150, hi - 0.004, C.lime); };
    p.redraw();
    read.innerHTML = `1-RC model R0 ${f2(s.r0)} mΩ, R1 ${f2(s.r1)} mΩ, τ ${f1(s.tau)} s · error rms ${rms < 10 ? ok(f2(rms) + ' mV') : bad(f2(rms) + ' mV')}, peak ${f2(pk)} mV · data: illustrative two-RC cell with 0.5 mV noise`;
  };
  sl.r0 = slider('R0 (mΩ)', { min: 5, max: 40, step: 0.05, value: s.r0, fmt: f2 }, (v) => { s.r0 = v; redraw(); });
  sl.r1 = slider('R1 (mΩ)', { min: 0, max: 40, step: 0.05, value: s.r1, fmt: f2 }, (v) => { s.r1 = v; redraw(); });
  sl.tau = slider('Time constant τ (s)', { min: 1, max: 60, step: 0.1, value: s.tau, fmt: f1 }, (v) => { s.tau = v; redraw(); });
  ctrls.append(sl.r0, sl.r1, sl.tau, button('Least-squares fit', () => { setSlider(sl.r0, 23.65); setSlider(sl.r1, 17.08); setSlider(sl.tau, 17.3); }, 'ecm-fit'));
  redraw();
};

// ---- p19-l12: Coulomb counting against an EKF ----
W.socekf = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { off: 100, err: 20, noise: 2 };
  const Q = 3.0 * 3600, R0 = 0.022, R1 = 0.015, C1 = 1500;
  const r = rng(3), cur = []; while (cur.length < 3600) { const n = 10 + Math.floor(r() * 50), u = r(), a = u < 0.2 ? 0 : u < 0.55 ? 1 : u < 0.75 ? 2.5 : u < 0.9 ? 5 : -1.5; for (let k = 0; k < n && cur.length < 3600; k++) cur.push(a + 0.3 * (r() - 0.5)); }
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 60], y: [0, 100], label: 'True SOC, Coulomb counting and the extended Kalman filter over an illustrative ride' });
  const redraw = () => {
    const g = gauss(rng(4)), a = Math.exp(-1 / (1.2 * R1 * C1)), ae = Math.exp(-1 / (R1 * C1));
    let sT = 0.9, v1 = 0; const tru = [], volt = [];
    for (const ik of cur) { tru.push(sT); volt.push(OCV(sT) - 1.1 * R0 * ik - v1 + (s.noise / 1000) * g()); v1 = a * v1 + 1.2 * R1 * (1 - a) * ik; sT -= ik / Q; }
    const s0 = 0.9 - s.err / 100, im = cur.map((x) => x + s.off / 1000); let cc = s0; const ccs = [];
    let x0 = s0, x1 = 0, P00 = 0.04, P01 = 0, P11 = 1e-4; const ek = []; const Rn = Math.max(1e-6, (s.noise / 1000 + 0.001) ** 2);
    im.forEach((ik, k) => { ccs.push(cc); cc -= ik / Q;
      const H0 = DOCV(x0), y = volt[k] - (OCV(x0) - R0 * ik - x1), S = H0 * H0 * P00 - 2 * H0 * P01 + P11 + Rn, K0 = (P00 * H0 - P01) / S, K1 = (P01 * H0 - P11) / S;
      x0 += K0 * y; x1 += K1 * y; const n00 = P00 - K0 * (H0 * P00 - P01), n01 = P01 - K0 * (H0 * P01 - P11), n11 = P11 - K1 * (H0 * P01 - P11); P00 = n00; P01 = n01; P11 = n11; ek.push(x0);
      x0 -= ik / Q; x1 = ae * x1 + R1 * (1 - ae) * ik; P00 += 1e-10; P01 *= ae; P11 = ae * ae * P11 + 1e-7; });
    const ts = cur.map((_, k) => k / 60), e1 = Math.abs(ccs[3599] - tru[3599]) * 100, e2 = Math.abs(ek[3599] - tru[3599]) * 100, e2max = Math.max(...ek.slice(600).map((v, k) => Math.abs(v - tru[k + 600]))) * 100;
    p.draw = (P) => { P.axes({ xl: 'minutes', yl: 'SOC (%)' }); P.line(ts, tru.map((v) => 100 * v), C.bone, 2); P.line(ts, ccs.map((v) => 100 * v), C.warn, 1.5, [5, 4]); P.line(ts, ek.map((v) => 100 * v), C.lime, 1.5);
      P.text('true', 45, 100 * tru[2700] + 4, C.bone); P.text('Coulomb', 2, 100 * ccs[120] - 6, C.warn); P.text('EKF', 8, 100 * ek[480] + 5, C.lime); };
    p.redraw();
    read.innerHTML = `true SOC ${f1(100 * tru[0])} → ${f1(100 * tru[3599])} % · ${sp(C.warn, 'Coulomb counting')} final error ${f2(e1)} % · ${sp(C.lime, 'EKF')} final error ${f2(e2)} %, worst after 10 min ${e2max < 3 ? ok(f2(e2max) + ' %') : bad(f2(e2max) + ' %')} · the estimator's model has 10 and 20 % lower resistances than the cell`;
  };
  ctrls.append(slider('Current sensor offset (mA)', { min: -300, max: 300, step: 10, value: s.off }, (v) => { s.off = v; redraw(); }),
    slider('Initial SOC error (%)', { min: -40, max: 40, step: 1, value: s.err }, (v) => { s.err = v; redraw(); }),
    slider('Voltage noise (mV)', { min: 0, max: 10, step: 0.5, value: s.noise, fmt: f1 }, (v) => { s.noise = v; redraw(); }));
  redraw();
};

// ---- p19-l13: passive balancing ----
W.balancebars = (el) => {
  const { body, read, ctrls } = frame(el);
  const S0 = [0.95, 0.92, 0.97, 0.90, 0.94, 0.96], QA = [3.0, 2.9, 3.05, 3.0, 2.95, 3.0];
  const s = { on: true, r: 33, thr: 5, hours: 2 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 6], y: [4.0, 4.2], label: 'Cell voltages of a six-cell string; bleeding cells are highlighted' });
  const redraw = () => {
    const soc = [...S0], dt = 10; let heat = 0, on = soc.map(() => false);
    for (let t = 0; t < s.hours * 3600 && s.on; t += dt) { const v = soc.map(OCV), mn = Math.min(...v); on = v.map((x) => x > mn + s.thr / 1000);
      soc.forEach((_, i) => { if (on[i]) { const ib = v[i] / s.r; heat += ib * v[i] * dt; soc[i] -= (ib * dt) / (QA[i] * 3600); } }); }
    const v = soc.map(OCV), mn = Math.min(...v); if (s.on) on = v.map((x) => x > mn + s.thr / 1000); const spread = 1000 * (Math.max(...v) - mn);
    const up0 = Math.min(...S0.map((x, i) => (1 - x) * QA[i])), up = Math.min(...soc.map((x, i) => (1 - x) * QA[i]));
    p.setRange([0, 6], [Math.min(...v) - 0.02, Math.max(...v) + 0.01]);
    p.draw = (P) => { P.axes({ xl: 'cell', yl: 'V' }); const lo = Math.min(...v) - 0.02; v.forEach((x, i) => { rect(P, i + 0.15, lo, i + 0.85, x, on[i] && s.on ? C.warn : C.lime, null); P.text(f3(x), i + 0.5, x + 0.002, C.bone, 'center'); }); P.line([0, 6], [mn + s.thr / 1000, mn + s.thr / 1000], C.dim, 1, [4, 4]); };
    p.redraw();
    read.innerHTML = `after ${s.hours} h${s.on ? '' : ' (balancing off)'} · spread ${spread < 10 ? ok(f1(spread) + ' mV') : sp(C.warn, f1(spread) + ' mV')} (started 74.1 mV) · ${f3(heat / 3600)} Wh turned into heat · bleed ${Math.round((4.0 / s.r) * 1000)} mA per cell · charge the string can accept ${f3(up0)} → ${f3(up)} Ah · lowest cell untouched`;
  };
  ctrls.append(toggle('Balancing on', s.on, (v) => { s.on = v; redraw(); }, { id: 'bal-on' }),
    slider('Bleed resistor (Ω)', { min: 10, max: 200, step: 1, value: s.r }, (v) => { s.r = v; redraw(); }),
    slider('Threshold (mV)', { min: 1, max: 30, step: 1, value: s.thr }, (v) => { s.thr = v; redraw(); }),
    slider('Time (h)', { min: 0, max: 12, step: 0.25, value: s.hours, fmt: f2 }, (v) => { s.hours = v; redraw(); }));
  redraw();
};

// ---- p19-l14: CC/CV charge with a fault state ----
W.ccvcplot = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { c: 1, end: 20, heat: 0 };
  const Q = 3.0, R0 = 0.022, R1 = 0.015, C1 = 1500, VMAX = 4.2;
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.75, maxH: 300, x: [0, 180], y: [3.0, 4.3], label: 'Cell voltage during the charge' });
  const q = new Plot(d2, { aspect: 0.75, maxH: 300, x: [0, 180], y: [0, 5.2], label: 'Charge current and state during the charge' });
  const redraw = () => {
    const icc = s.c * Q, iend = Q / s.end, dt = 1, a = Math.exp(-dt / (R1 * C1)); let soc = 0.02, v1 = 0, i = 0, integ = 0, st = 'IDLE', t = 0; const T = [], V = [], I = [], ST = [];
    const kp = 20, ki = 10;
    while (st !== 'DONE' && st !== 'FAULT' && t < 6 * 3600) {
      let v = OCV(soc) + R0 * i + v1; const temp = 25 + (s.heat * t) / 60;
      if (['PRECHARGE', 'CC', 'CV'].includes(st) && (temp > 45 || v > VMAX + 0.05)) st = 'FAULT';
      else if (st === 'IDLE') st = v < 3.0 ? 'PRECHARGE' : 'CC';
      else if (st === 'PRECHARGE' && v >= 3.0) st = 'CC';
      else if (st === 'CC' && v >= VMAX - 0.01) { st = 'CV'; integ = i - kp * (VMAX - v); }
      else if (st === 'CV' && i < iend) st = 'DONE';
      if (st === 'PRECHARGE') i = Q / 10; else if (st === 'CC') i = Math.min(icc, i + (icc * dt) / 2);
      else if (st === 'CV') { integ = clamp(integ + ki * (VMAX - v) * dt, 0, icc); i = clamp(integ + kp * (VMAX - v), 0, icc); } else i = 0;
      v = OCV(soc) + R0 * i + v1; T.push(t / 60); V.push(v); I.push(i); ST.push(st); v1 = a * v1 + R1 * (1 - a) * i; soc += (i * dt) / (Q * 3600); t += dt; }
    const tm = Math.max(60, t / 60); p.setRange([0, tm], [3.0, 4.3]); q.setRange([0, tm], [0, Math.max(3.3, icc * 1.15)]);
    const first = (x) => { const k = ST.indexOf(x); return k < 0 ? null : T[k]; };
    p.draw = (P) => { P.axes({ xl: 'min', yl: 'V' }); P.line([0, tm], [VMAX, VMAX], C.bad, 1, [4, 4]); P.line(T, V, C.lime, 2); };
    q.draw = (P) => { P.axes({ xl: 'min', yl: 'A' }); P.line(T, I, C.signal, 2); ['CC', 'CV'].forEach((x) => { const f = first(x); if (f !== null) { P.line([f, f], [0, 5.2], C.dim, 1, [3, 3]); P.text(x, f + 1, Math.max(3.3, icc * 1.15) * 0.9, C.fog); } }); };
    p.redraw(); q.redraw();
    const vmax = Math.max(...V);
    read.innerHTML = `${st === 'DONE' ? ok('DONE') : bad(st)} after ${f1(t / 60)} min at SOC ${f1(100 * soc)} % · CC from ${first('CC') === null ? '-' : f1(first('CC'))} min, CV from ${first('CV') === null ? '-' : f1(first('CV'))} min · max voltage ${vmax <= VMAX + 0.005 ? ok(vmax.toFixed(4) + ' V') : bad(vmax.toFixed(4) + ' V')} · max current ${f3(Math.max(...I))} A${st === 'FAULT' ? ' · ' + sp(C.bad, 'over-temperature at 45 °C: current set to 0') : ''}`;
  };
  ctrls.append(slider('CC rate (C)', { min: 0.2, max: 1.5, step: 0.1, value: s.c, fmt: f1 }, (v) => { s.c = v; redraw(); }),
    select('Termination current', [['10', 'C/10'], ['20', 'C/20'], ['50', 'C/50']], '20', (v) => { s.end = +v; redraw(); }, 'cc-end'),
    slider('Cell heating (K per min)', { min: 0, max: 2, step: 0.1, value: s.heat, fmt: f1 }, (v) => { s.heat = v; redraw(); }));
  redraw();
};

// ---- p19-l15: hot loop coupling into a victim loop ----
const MU0 = 4e-7 * Math.PI;
function bzSeg(x0, y0, x1, y1, px, py, n = 60) { let b = 0; const dlx = (x1 - x0) / n, dly = (y1 - y0) / n;
  for (let k = 0; k < n; k++) { const xs = x0 + dlx * (k + 0.5), ys = y0 + dly * (k + 0.5), rx = px - xs, ry = py - ys, r3 = (rx * rx + ry * ry) ** 1.5; b += (dlx * ry - dly * rx) / r3; } return (MU0 / (4 * Math.PI)) * b; }
function mutualM(hot, vic, n = 16) { const pts = [...hot, hot[0]], [x0, y0, x1, y1] = vic, dx = (x1 - x0) / n, dy = (y1 - y0) / n; let fl = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const px = x0 + dx * (i + 0.5), py = y0 + dy * (j + 0.5); for (let k = 0; k < 4; k++) fl += bzSeg(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], px, py); }
  return fl * dx * dy; }
W.loopcoupling = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cap: 20, gp: false, tr: 10, gap: 5 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [-2, 50], y: [-14, 14], equal: true, label: 'Top view of the hot loop and the victim loop (mm)' });
  const redraw = () => {
    const mm = 1e-3, w = s.cap, hh = s.gp ? 1 : Math.max(4, w), x0 = 0, vx0 = w + s.gap, hot = [[x0, -hh / 2], [x0 + w, -hh / 2], [x0 + w, hh / 2], [x0, hh / 2]].map(([a, b]) => [a * mm, b * mm]);
    const vic = [vx0 * mm, -5 * mm, (vx0 + 20) * mm, 5 * mm], M = Math.abs(mutualM(hot, vic)), didt = 2 / (s.tr * 1e-9), vsp = M * didt, ic = 0.5e-12 * (12 / (s.tr * 1e-9));
    p.setRange([-2, vx0 + 24], [-14, 14]);
    p.draw = (P) => { P.axes({ xl: 'mm', yl: 'mm' }); const L = [[x0, -hh / 2], [x0 + w, -hh / 2], [x0 + w, hh / 2], [x0, hh / 2], [x0, -hh / 2]]; P.line(L.map((q) => q[0]), L.map((q) => q[1]), C.bad, 3);
      rect(P, vx0, -5, vx0 + 20, 5, 'rgba(111,211,255,.08)', C.signal); rect(P, x0 + w - 1.5, -hh / 2 - 1, x0 + w + 1.5, -hh / 2 + 1, C.warn, null);
      P.text('hot loop', x0, hh / 2 + 1.5, C.bad); P.text('victim', vx0, 6.5, C.signal); P.text('C in', x0 + w - 2, -hh / 2 - 2.6, C.warn); };
    p.redraw();
    read.innerHTML = `hot loop ${f1(w)} × ${f1(hh)} mm = ${Math.round(w * hh)} mm²${s.gp ? ' (return under the trace on a ground plane)' : ''} · mutual inductance ${(M * 1e9).toFixed(4)} nH · 2 A in ${s.tr} ns induces ${vsp * 1000 > 50 ? bad(f1(vsp * 1000) + ' mV') : ok(f2(vsp * 1000) + ' mV')} · 12 V edge through 0.5 pF injects ${f2(ic * 1000)} mA · spectrum corner ${Math.round(1 / (Math.PI * s.tr * 1e-9) / 1e6)} MHz`;
  };
  ctrls.append(slider('Capacitor distance: hot loop width (mm)', { min: 4, max: 20, step: 1, value: s.cap }, (v) => { s.cap = v; redraw(); }),
    toggle('Ground plane under the loop', s.gp, (v) => { s.gp = v; redraw(); }, { id: 'emc-gp' }),
    slider('Edge time (ns)', { min: 1, max: 30, step: 1, value: s.tr }, (v) => { s.tr = v; redraw(); }),
    slider('Gap to victim (mm)', { min: 1, max: 25, step: 1, value: s.gap }, (v) => { s.gap = v; redraw(); }));
  redraw();
};

// ---- p19-l16: risk matrix ----
const HZ = [['H1', 'impact by moving arm', 4, 3, 4, 1], ['H2', 'crushing while teaching', 3, 3, 2, 2], ['H3', 'dropped part', 2, 3, 2, 1],
  ['H4', 'electric shock', 4, 2, 4, 1], ['H5', 'unexpected start-up', 4, 3, 4, 1], ['H6', 'burn from motor housing', 1, 4, 1, 2]];
const riskOf = (sv, lk) => { const r = sv * lk; return r >= 9 ? 'high' : r >= 4 ? 'medium' : 'low'; };
W.riskmatrix = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { h: 0, after: false };
  const p = new Plot(body, { aspect: 0.8, maxH: 360, x: [-0.7, 4.6], y: [0, 4.6], label: 'Illustrative 4 × 4 risk matrix: severity up, likelihood across' });
  const SV = ['minor', 'serious', 'major', 'fatal'], LK = ['remote', 'unlikely', 'possible', 'likely'], col = { high: 'rgba(255,107,91,.35)', medium: 'rgba(255,181,71,.28)', low: 'rgba(198,255,26,.16)' };
  const redraw = () => {
    p.draw = (P) => { for (let sv = 1; sv <= 4; sv++) for (let lk = 1; lk <= 4; lk++) { rect(P, lk - 0.4, sv - 0.4, lk + 0.5, sv + 0.5, col[riskOf(sv, lk)], C.rule2); }
      SV.forEach((n, i) => P.text(n, -0.65, i + 1.05, C.fog)); LK.forEach((n, i) => P.text(n, i + 1.05, 0.25, C.fog, 'center'));
      HZ.forEach(([id, , s0, l0, s1, l1], i) => { const sv = s.after ? s1 : s0, lk = s.after ? l1 : l0, off = (i % 3) * 0.22 - 0.22, sel = i === s.h; P.dot(lk + off, sv + (i < 3 ? 0.15 : -0.15), sel ? C.bone : C.dim, sel ? 8 : 5); P.text(id, lk + off + 0.1, sv + (i < 3 ? 0.25 : -0.05), sel ? C.bone : C.dim); });
      const [, , s0, l0, s1, l1] = HZ[s.h]; if (s.after) P.arrow(l0, s0, l1 + 0.05, s1 + 0.05, C.signal, 2); };
    p.redraw();
    const [id, nm, s0, l0, s1, l1] = HZ[s.h], r0 = riskOf(s0, l0), r1 = riskOf(s1, l1), highs = HZ.filter((x) => riskOf(...(s.after ? [x[4], x[5]] : [x[2], x[3]])) === 'high').length;
    read.innerHTML = `${id} ${nm}: before ${SV[s0 - 1]} × ${LK[l0 - 1]} = ${s0 * l0} (${r0}) · after measures ${SV[s1 - 1]} × ${LK[l1 - 1]} = ${s1 * l1} (${r1 === 'low' ? ok(r1) : sp(C.warn, r1 + ', covered by a safety function with a PLr')}) · high risks in the log ${s.after ? (highs ? bad(highs) : ok(0)) : highs} ${s.after ? 'after' : 'before'} measures · teaching example, not an assessment`;
  };
  ctrls.append(select('Hazard', HZ.map((x, i) => [String(i), `${x[0]} ${x[1]}`]), '0', (v) => { s.h = +v; redraw(); }, 'risk-h'),
    toggle('Apply measures', s.after, (v) => { s.after = v; redraw(); }, { id: 'risk-after' }));
  redraw();
};

// ---- p19-l17: PFH against PL and SIL bands ----
W.pfhbands = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mttf: 30, dc: 90, beta: 2, T: 20 };
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 3], y: [1e-9, 1e-4], logy: true, label: 'Average dangerous failure frequency (per hour) on a log scale with the PL bands' });
  const BANDS = [['PL e', 1e-8, 1e-7], ['PL d', 1e-7, 1e-6], ['PL c', 1e-6, 3e-6], ['PL b', 3e-6, 1e-5], ['PL a', 1e-5, 1e-4]], SILB = [['SIL 4', 1e-9, 1e-8], ['SIL 3', 1e-8, 1e-7], ['SIL 2', 1e-7, 1e-6], ['SIL 1', 1e-6, 1e-5]];
  const band = (v, B) => { for (const [n, lo, hi] of B) if (v >= lo && v < hi) return n; return v < B[0][1] ? 'better than the table' : 'not reached'; };
  const redraw = () => {
    const ld = 1 / (s.mttf * 8760), ldu = (1 - s.dc / 100) * ld, b = s.beta / 100, T = s.T * 8760, p1 = ldu, p2 = (1 - b) ** 2 * ldu * ldu * T + b * ldu, ccf = b * ldu;
    p.draw = (P) => { BANDS.forEach(([n, lo, hi], i) => { rect(P, 0, lo, 3, hi, i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(198,255,26,.05)', null); P.text(n, 2.55, Math.sqrt(lo * hi), C.fog); }); P.axes({ xl: '', yl: 'PFH (1/h)' });
      [[p1, '1 channel', C.warn], [p2, '2 channels', C.lime]].forEach(([v, n, c], i) => { rect(P, 0.3 + i * 1.1, 1e-9, 1.1 + i * 1.1, clamp(v, 1.01e-9, 1e-4), c, null); P.text(n, 0.3 + i * 1.1, clamp(v, 1.2e-9, 5e-5) * 1.6, C.bone); });
      P.line([1.4, 2.2], [ccf, ccf], C.bad, 1.5, [4, 3]); P.text('β floor', 1.45, ccf * 0.55, C.bad); };
    p.redraw();
    read.innerHTML = `λD ${ld.toExponential(3)}/h, λDU ${ldu.toExponential(3)}/h · ${sp(C.warn, '1oo1')} PFH ${p1.toExponential(3)}: ${band(p1, BANDS)}, ${band(p1, SILB)} · ${sp(C.lime, '1oo2')} PFH ${p2.toExponential(3)} (simplified formula): ${band(p2, BANDS)}, ${band(p2, SILB)} · common cause ${f1((100 * ccf) / p2)} % of it`;
  };
  ctrls.append(slider('MTTFd per channel (years)', { min: 3, max: 100, step: 1, value: s.mttf }, (v) => { s.mttf = v; redraw(); }),
    slider('Diagnostic coverage (%)', { min: 0, max: 99.9, step: 0.1, value: s.dc, fmt: f1 }, (v) => { s.dc = v; redraw(); }),
    slider('Common-cause fraction β (%)', { min: 0, max: 20, step: 0.5, value: s.beta, fmt: f1 }, (v) => { s.beta = v; redraw(); }),
    slider('Mission time (years)', { min: 1, max: 30, step: 1, value: s.T }, (v) => { s.T = v; redraw(); }));
  redraw();
};

// ---- p19-l18: stop categories ----
function stopSim(cat, driveOk, brake, dt = 2e-4) { const J = 0.002, TF = 0.05, BV = 2e-4, TD = 3, TB = 2, W0 = 300, ramp = 0.2, wmin = 5, timer = 0.3;
  let w = W0, t = 0, sto = cat === 0, tsto = cat === 0 ? 0 : null; const T = [0], Wv = [W0], E = [];
  while (w > 0 && t < 10) { const env = W0 * Math.max(0, 1 - t / ramp) * 1.15 + wmin;
    if (!sto && (w < wmin || t >= timer || w > env)) { sto = true; tsto = t; }
    const tq = sto ? (brake ? TB : 0) : driveOk ? Math.min(TD, (J * W0) / ramp + TF) : 0; w = Math.max(0, w - ((tq + TF + BV * w) / J) * dt); t += dt;
    if (Math.round(t / dt) % 10 === 0) { T.push(t); Wv.push(w); E.push(env); } }
  return { t, tsto, T, Wv }; }
W.stopcat = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cat: '1', fault: false, brake: true };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 0.5], y: [0, 330], label: 'Motor speed against time after the stop request, with the monitoring envelope' });
  const redraw = () => {
    const r = stopSim(+s.cat, !s.fault, s.brake), tm = Math.min(Math.max(0.5, r.t * 1.1), 10); p.setRange([0, tm], [0, 330]);
    p.draw = (P) => { P.axes({ xl: 's', yl: 'rad/s' }); if (s.cat === '1') P.fn((t) => 300 * Math.max(0, 1 - t / 0.2) * 1.15 + 5, C.dim, 1, [4, 4]); P.line([0.3, 0.3], [0, 330], C.warn, 1, [3, 3]); P.text('300 ms budget', 0.305, 310, C.warn);
      P.line(r.T, r.Wv, C.lime, 2); if (r.tsto !== null) { P.line([r.tsto, r.tsto], [0, 330], C.bad, 1.2, [2, 3]); P.text('STO', r.tsto + 0.004, 280, C.bad); } };
    p.redraw();
    const budget = s.fault ? 0.35 : 0.3;
    read.innerHTML = `category ${s.cat}${s.fault ? ', drive fault' : ''}${s.brake ? '' : ', no brake'} · torque off at ${f1(r.tsto * 1000)} ms · at rest after ${r.t * 1000 <= budget * 1000 ? ok(f1(r.t * 1000) + ' ms') : bad(f1(r.t * 1000) + ' ms')} (budget ${budget * 1000} ms${s.fault ? ', worst case' : ''})${s.cat === '1' && s.fault ? ' · ' + sp(C.warn, 'speed left the envelope: the monitor tripped STO early') : ''}`;
  };
  ctrls.append(select('Stop category', [['0', 'Category 0: STO at once'], ['1', 'Category 1: ramp, then STO']], s.cat, (v) => { s.cat = v; redraw(); }, 'stop-cat'),
    toggle('Drive fault (no braking torque)', s.fault, (v) => { s.fault = v; redraw(); }, { id: 'stop-fault' }),
    toggle('Holding brake', s.brake, (v) => { s.brake = v; redraw(); }, { id: 'stop-brake' }));
  redraw();
};

// ---- p19-l19: plausibility monitors on a redundant sensor pair ----
W.plausmon = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fault: 'stuck', tol: 20, n: 10 };
  const FS = 1000, LO = -0.1, HI = 3.3, STEP = 4 / FS + 0.015, STALE = 20;
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0.9, 1.25], y: [0, 3.4], label: 'Both sensor readings around the fault injection at 1.0 s' });
  const redraw = () => {
    const g = gauss(rng(0)), n = 1400, k0 = 1000, A = [], B = [], TR = [], sa = [];
    for (let k = 0; k < n; k++) { const t = k / FS, tr = 1.5 + Math.sin(2 * Math.PI * 0.4 * t); TR.push(tr); A.push(tr + 0.002 * g()); B.push(tr + 0.002 * g()); sa.push(k); }
    for (let k = k0; k < n; k++) { const t = k / FS;
      if (s.fault === 'stuck' || s.fault === 'frozen') A[k] = A[k0]; if (s.fault === 'frozen') sa[k] = k0;
      if (s.fault === 'offset') A[k] += 0.05; if (s.fault === 'drift') A[k] += 0.2 * (t - 1); if (s.fault === 'open') A[k] = 3.6; }
    if (s.fault === 'spike') A[k0] += 0.5;
    let det = null, by = [], xc = 0, age = 0;
    for (let k = 1; k < n && det === null; k++) { const f = [];
      age = sa[k] === sa[k - 1] ? age + 1 : 0; if (age >= STALE) f.push('watchdog');
      if (A[k] < LO || A[k] > HI) f.push('range'); if (Math.abs(A[k] - A[k - 1]) > STEP) f.push('rate');
      xc = Math.abs(A[k] - B[k]) > s.tol / 1000 ? xc + 1 : 0; if (xc >= s.n) f.push('cross-check');
      if (f.length) { det = k; by = f; } }
    const fa = det !== null && det < k0;
    p.draw = (P) => { P.axes({ xl: 's', yl: 'rad' }); const ts = A.map((_, k) => k / FS), sl = (a) => a.slice(880, 1260);
      P.line(sl(ts), sl(B), C.signal, 1.5); P.line(sl(ts), sl(A).map((v) => Math.min(v, 3.4)), C.lime, 1.5); P.line([1, 1], [0, 3.4], C.warn, 1, [3, 3]); P.text('fault', 1.003, 3.2, C.warn);
      if (det !== null) { P.line([det / FS, det / FS], [0, 3.4], C.bad, 1.5); P.text('trip', det / FS + 0.003, 2.9, C.bad); } };
    p.redraw();
    read.innerHTML = det === null ? bad('not detected within 0.4 s') : fa ? bad(`false alarm at ${f2(det / FS)} s by ${by.join(', ')}: loosen the thresholds`) :
      `${s.fault} detected ${f1(((det - k0) / FS) * 1000)} ms after injection by ${ok(by.join(', '))} · cross-check ${s.tol} mrad for ${s.n} samples · rate limit ${f1(STEP * 1000)} mrad per sample · watchdog ${STALE} ms`;
  };
  ctrls.append(select('Injected fault', [['stuck', 'stuck at last value'], ['offset', 'offset 0.05 rad'], ['drift', 'drift 0.2 rad/s'], ['spike', 'single 0.5 rad spike'], ['open', 'open wire (to the rail)'], ['frozen', 'frozen (no new samples)']], s.fault, (v) => { s.fault = v; redraw(); }, 'pl-fault'),
    slider('Cross-check tolerance (mrad)', { min: 5, max: 60, step: 1, value: s.tol }, (v) => { s.tol = v; redraw(); }),
    slider('Cross-check persistence (samples)', { min: 1, max: 40, step: 1, value: s.n }, (v) => { s.n = v; redraw(); }));
  redraw();
};

// ---- p19-l20: FMEA ranked by RPN ----
const FM = [['IMU gyro drift', 6, 6, 5, [6, 3, 3]], ['IMU I2C lock-up', 8, 4, 4, [8, 3, 2]], ['MOSFET short', 9, 2, 6, [9, 2, 2]], ['encoder connector', 5, 5, 4, [5, 2, 3]],
  ['cell over-discharge', 7, 4, 3, [7, 2, 2]], ['loop overrun', 7, 3, 7, [7, 2, 3]], ['wheel set-screw', 6, 5, 6, [6, 2, 3]], ['lifted while running', 9, 3, 3, [9, 3, 1]], ['status LED', 2, 3, 8, null]];
W.fmeagrid = (el) => {
  const { body, read, ctrls } = frame(el);
  const rows = FM.map((r) => ({ n: r[0], s: r[1], o: r[2], d: r[3], a: r[4] })), st = { sel: 2, act: false };
  const p = new Plot(body, { aspect: 0.7, maxH: 380, x: [0, 300], y: [0, 9.2], label: 'Failure modes ranked by RPN; severity 9 or more is outlined in red' });
  const sl = {};
  const eff = (r) => (st.act && r.a ? { s: r.a[0], o: r.a[1], d: r.a[2] } : r);
  const redraw = () => {
    const ranked = rows.map((r, i) => ({ r, i, e: eff(r) })).sort((a, b) => b.e.s * b.e.o * b.e.d - a.e.s * a.e.o * a.e.d);
    const top = Math.max(...ranked.map(({ e }) => e.s * e.o * e.d)); p.setRange([0, Math.max(320, top * 1.6)], [0, 9.2]);
    p.draw = (P) => { P.axes({ xl: 'RPN', yl: '' }); ranked.forEach(({ r, i, e }, k) => { const y = 8.3 - k, v = e.s * e.o * e.d;
      rect(P, 0, y + 0.1, v, y + 0.75, i === st.sel ? C.signal : 'rgba(198,255,26,.5)', e.s >= 9 ? C.bad : null); P.text(`${r.n} ${v}`, v + 4, y + 0.55, C.bone); }); };
    p.redraw();
    const r = rows[st.sel], e = eff(r), rank = ranked.findIndex((x) => x.i === st.sel) + 1, severe = rows.filter((x) => x.s >= 9), missing = severe.filter((x) => !x.a).length;
    read.innerHTML = `${r.n}: S ${e.s} × O ${e.o} × D ${e.d} = RPN ${e.s * e.o * e.d}, rank ${rank} of ${rows.length}${e.s >= 9 ? ' · ' + sp(C.bad, 'severity ≥ 9: needs an action whatever its RPN') : ''} · ${st.act ? 'actions applied' : 'before actions'} · severe modes without an action: ${missing ? bad(missing) : ok(0)} · ratings are a teaching example`;
  };
  const pick = (i) => { st.sel = i; const r = rows[i]; setSlider(sl.s, r.s); setSlider(sl.o, r.o); setSlider(sl.d, r.d); redraw(); };
  sl.s = slider('Severity S', { min: 1, max: 10, step: 1, value: rows[2].s }, (v) => { rows[st.sel].s = v; redraw(); });
  sl.o = slider('Occurrence O', { min: 1, max: 10, step: 1, value: rows[2].o }, (v) => { rows[st.sel].o = v; redraw(); });
  sl.d = slider('Detection D', { min: 1, max: 10, step: 1, value: rows[2].d }, (v) => { rows[st.sel].d = v; redraw(); });
  ctrls.append(select('Failure mode', rows.map((r, i) => [String(i), r.n]), '2', (v) => pick(+v), 'fm-row'), sl.s, sl.o, sl.d,
    toggle('Apply actions', st.act, (v) => { st.act = v; redraw(); }, { id: 'fm-act' }));
  redraw();
};

// ---- p19-l21: fault injection campaign on a joint ----
const FCL = [['dead', 'motor dead'], ['runaway', 'motor runaway'], ['stuck', 'encoder stuck'], ['spike', 'encoder spike'], ['stream', 'setpoint stream lost'], ['overrun', 'control overrun']];
function jointRun(fault, tf, seed, keep = false) { const DT = 1e-3, J = 0.05, MGL = 2, B = 0.02, KT = 0.1, TM = 3, g = gauss(rng(seed)), k0 = Math.round(tf / DT);
  let q = 0, w = 0, tau = 0, seq = 0, last = -1, qs = null, qp = null, age = 0, xc = 0, ca = 0, kb = null; const T = [], Q = [], R = [];
  for (let k = 0; k < 1200; k++) { const t = k * DT, f = fault && k >= k0 ? fault : null, ref = 0.6 * Math.sin(2 * Math.PI * 0.8 * t);
    if (f !== 'stream') seq++; let qj = q + 5e-4 * g(); const qm = q + 5e-4 * g();
    if (f === 'stuck') { if (qs === null) qs = qj; qj = qs; } if (f && kb === null && f !== 'stuck' && f !== 'dead') kb = k; if (f === 'stuck' && kb === null && Math.abs(qj - q) > 0.004) kb = k; if (f === 'spike' && k === k0) qj += 0.3;
    if (f !== 'overrun' || (k - k0) % 40 === 0) { tau = clamp(40 * (ref - qj) - 3 * w + MGL * Math.sin(qj), -TM, TM); ca = 0; } else ca++;
    if (f === 'dead' && kb === null && Math.abs(tau) > 0.1) kb = k;
    const ta = f === 'dead' ? 0 : f === 'runaway' ? TM : tau, im = ta / KT + 0.05 * g(), trips = [];
    if (Math.abs(im - tau / KT) > 1) trips.push('current plausibility'); if (qp !== null && Math.abs(qj - qp) > 0.02) trips.push('rate');
    xc = Math.abs(qj - qm) > 0.004 ? xc + 1 : 0; if (xc >= 3) trips.push('encoder cross-check'); age = seq !== last ? 0 : age + 1; last = seq; if (age >= 10) trips.push('setpoint watchdog'); if (ca >= 5) trips.push('deadline monitor');
    if (keep) { T.push(t); Q.push(q); R.push(ref); }
    if (trips.length) return { k, lat: k < k0 ? null : (k - (kb === null ? k : kb)) * DT * 1000, dorm: kb === null ? 0 : (kb - k0) * DT * 1000, trips, falseTrip: k < k0, T, Q, R };
    qp = qj; w += ((ta - MGL * Math.sin(q) - B * w) / J) * DT; q += w * DT; }
  return { k: null, lat: null, trips: [], falseTrip: false, T, Q, R }; }
W.faultcampaign = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { f: 'dead', tf: 0.6, camp: null };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 1.2], y: [-1, 1], label: 'Joint angle and reference; the red line marks the supervisor trip' });
  const redraw = () => {
    const r = jointRun(s.f, s.tf, 100, true);
    p.draw = (P) => { P.axes({ xl: 's', yl: 'rad' }); P.line(r.T, r.R, C.dim, 1.2, [4, 4]); P.line(r.T, r.Q, C.lime, 2); P.line([s.tf, s.tf], [-1, 1], C.warn, 1, [3, 3]); P.text('inject', s.tf + 0.01, 0.9, C.warn);
      if (r.k !== null) { P.line([r.k / 1000, r.k / 1000], [-1, 1], C.bad, 1.5); P.text('safe state', r.k / 1000 + 0.01, -0.9, C.bad); } };
    p.redraw();
    const one = r.k === null ? bad('no reaction') : r.falseTrip ? bad('false trip') : `${FCL.find((x) => x[0] === s.f)[1]}: ${ok(r.trips.join(', '))} ${f1(r.lat)} ms after the fault produced a wrong output${r.dorm > 0 ? ` (dormant for ${f1(r.dorm)} ms first)` : ''}`;
    read.innerHTML = one + (s.camp ? ` · campaign: ${s.camp}` : ' · press the button for a randomised campaign (15 per class)');
  };
  ctrls.append(select('Fault class', FCL, s.f, (v) => { s.f = v; redraw(); }, 'fi-class'),
    slider('Injection time (s)', { min: 0.3, max: 0.9, step: 0.01, value: s.tf, fmt: f2 }, (v) => { s.tf = v; redraw(); }),
    button('Run campaign', () => { const r = rng(42); let cov = 0, tot = 0, worst = 0;
      FCL.forEach(([f]) => { let all = true; for (let n = 0; n < 15; n++) { const x = jointRun(f, 0.3 + 0.6 * r(), 100 + n); tot++; if (x.k === null || x.falseTrip || x.lat > 30) all = false; else worst = Math.max(worst, x.lat); } if (all) cov++; });
      s.camp = `${tot} injections, ${cov}/6 classes always reacted within 30 ms, worst ${f1(worst)} ms`; redraw(); }, 'fi-run'));
  redraw();
};

// ---- p19-l22: clearance and creepage checker ----
function crosses(p, q, r) { const e = 1e-9, x0 = r[0] + e, y0 = r[1] + e, x1 = r[2] - e, y1 = r[3] - e, dx = q[0] - p[0], dy = q[1] - p[1]; let t0 = 0, t1 = 1;
  for (const [pk, qk] of [[-dx, p[0] - x0], [dx, x1 - p[0]], [-dy, p[1] - y0], [dy, y1 - p[1]]]) { if (pk === 0) { if (qk < 0) return false; } else { const t = qk / pk; if (pk < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); if (t0 > t1) return false; } }
  return t1 - t0 > 1e-9; }
const rdist = (a, b) => Math.hypot(Math.max(b[0] - a[2], a[0] - b[2], 0), Math.max(b[1] - a[3], a[1] - b[3], 0));
const perim = (r, n = 8) => { const o = []; for (let i = 0; i < n; i++) { const u = i / n; o.push([r[0] + (r[2] - r[0]) * u, r[1]], [r[2], r[1] + (r[3] - r[1]) * u], [r[2] - (r[2] - r[0]) * u, r[3]], [r[0], r[3] - (r[3] - r[1]) * u]); } return o; };
function creep(a, b, slots) { if (!slots.length) return { d: rdist(a, b), path: null };
  const obs = [...slots, [-50, -50, 82, 0], [-50, 20, 82, 70], [-50, 0, 0, 20], [32, 0, 82, 20]], corners = slots.flatMap((s) => [[s[0], s[1]], [s[2], s[1]], [s[2], s[3]], [s[0], s[3]]]);
  const A = perim(a), Bp = perim(b), nodes = [...A, ...Bp, ...corners], n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  A.forEach((_, i) => (dist[i] = 0));
  for (;;) { let u = -1; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0) break; done[u] = true; if (u >= A.length && u < A.length + Bp.length) { const path = []; for (let v = u; v >= 0; v = prev[v]) path.push(nodes[v]); return { d: dist[u], path }; }
    for (let v = 0; v < n; v++) { if (done[v] || (u < A.length && v < A.length)) continue; if (obs.some((o) => crosses(nodes[u], nodes[v], o))) continue; const d = dist[u] + Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]); if (d < dist[v]) { dist[v] = d; prev[v] = u; } } }
  return { d: Infinity, path: null }; }
W.creepcheck = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { slot: false, move: false, grade: 'reinforced' };
  const RULE = { functional: [1.0, 1.5], basic: [2.0, 2.5], reinforced: [4.0, 5.0] };
  const p = new Plot(body, { aspect: 0.66, maxH: 360, x: [0, 32], y: [0, 20], equal: true, label: 'Board top view: mains on the left, SELV on the right, creepage path in red' });
  const redraw = () => {
    const pads = { L: [[2, 2, 6, 5], [15, 2, s.move ? 17 : 17.5, 4]], N: [[2, s.move ? 7.5 : 6.2, 6, s.move ? 10.5 : 9.2], [15, 7, s.move ? 17 : 17.5, 9]], SELV: [[22, 2, 24, 4], [22, 7, 24, 9]] }, slots = s.slot ? [[18.5, -1, 20.5, 12]] : [];
    const checks = [['L', 'N', 'functional'], ['L', 'SELV', s.grade], ['N', 'SELV', s.grade]].map(([a, b, gr]) => { let best = { d: Infinity }, cl = Infinity;
      for (const x of pads[a]) for (const y of pads[b]) { cl = Math.min(cl, rdist(x, y)); const c = creep(x, y, slots); if (c.d < best.d) best = c; } const [rc, rr] = RULE[gr]; return { a, b, gr, cl, cr: best.d, path: best.path, ok: cl >= rc && best.d >= rr, rc, rr }; });
    p.draw = (P) => { rect(P, 0, 0, 32, 20, 'rgba(198,255,26,.04)', C.rule2); P.line([20, 20], [0, 20], C.dim, 1, [4, 4]); P.text('isolation barrier', 20.3, 18.5, C.dim);
      slots.forEach((r) => rect(P, r[0], Math.max(0, r[1]), r[2], r[3], C.bg, C.fog)); const col = { L: C.warn, N: C.signal, SELV: C.lime };
      Object.entries(pads).forEach(([k, rs]) => rs.forEach((r) => { rect(P, r[0], r[1], r[2], r[3], col[k], null); P.text(k, r[0], r[3] + 0.6, C.bone); }));
      const worst = checks.slice(1).reduce((a, b) => (b.cr < a.cr ? b : a)); if (worst.path) P.line(worst.path.map((q) => q[0]), worst.path.map((q) => q[1]), C.bad, 2); };
    p.redraw();
    read.innerHTML = checks.map((c) => `${c.a}–${c.b} ${c.gr}: clearance ${f2(c.cl)}/${f1(c.rc)}, creepage ${f2(c.cr)}/${f1(c.rr)} mm ${c.ok ? ok('ok') : bad('FAIL')}`).join(' · ') + ' · rule values illustrative, not from the standard';
  };
  ctrls.append(toggle('Slot under the optocoupler', s.slot, (v) => { s.slot = v; redraw(); }, { id: 'cr-slot' }),
    toggle('Move the N pad and trim the opto pads', s.move, (v) => { s.move = v; redraw(); }, { id: 'cr-move' }),
    select('Mains to SELV insulation', [['basic', 'basic'], ['reinforced', 'reinforced']], s.grade, (v) => { s.grade = v; redraw(); }, 'cr-grade'));
  redraw();
};

export default W;
