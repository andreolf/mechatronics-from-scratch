// Widgets for Phase 05 (circuits). Sliders and selects only: every control works by touch.
import { Plot, frame, slider, select, h, C, f3 } from './plot.js';

const W = {};
const TAU = 2 * Math.PI;
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

// p05-l01: battery with internal resistance driving a load
W.power = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { V: 12, r: 0.5, R: 6, cap: 2000 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0.1, 100], y: [0, 80], logx: true, label: 'Power delivered to the load against load resistance' });
  p.draw = (P) => {
    const PL = (R) => (s.V * s.V * R) / ((R + s.r) ** 2); const pmax = (s.V * s.V) / (4 * s.r);
    P.setRange(P.xr, [0, Math.max(5, pmax * 1.15)]); P.axes({ xl: 'R_load [Ω]', yl: 'P [W]' }); P.fn(PL, C.lime, 2.5, null, 300); P.line([s.r, s.r], P.yr, C.dim, 1, [4, 4]); P.dot(s.R, PL(s.R), C.warn, 5);
    const I = s.V / (s.R + s.r);
    read.innerHTML = `I = V/(R+r) = <b>${I.toFixed(3)} A</b> · load power <b>${PL(s.R).toFixed(2)} W</b> · lost in the battery ${(I * I * s.r).toFixed(2)} W · efficiency ${(100 * s.R / (s.R + s.r)).toFixed(1)} % · ${s.cap} mAh lasts <b>${(s.cap / 1000 / I).toFixed(2)} h</b> · dashed: R = r gives maximum power`;
  };
  ctrls.append(
    slider('Battery voltage', { min: 1.5, max: 24, step: 0.1, value: s.V, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.V = v; p.redraw(); }),
    slider('Internal resistance', { min: 0.1, max: 5, step: 0.05, value: s.r, fmt: (v) => v.toFixed(2) + ' Ω' }, (v) => { s.r = v; p.redraw(); }),
    slider('Load', { min: 0.1, max: 100, step: 0.1, value: s.R, fmt: (v) => v.toFixed(1) + ' Ω' }, (v) => { s.R = v; p.redraw(); }),
    slider('Capacity', { min: 100, max: 10000, step: 100, value: s.cap, fmt: (v) => v + ' mAh' }, (v) => { s.cap = v; p.redraw(); }));
  p.redraw();
};

// p05-l03: two-node nodal analysis. 10 V source through R1 into node 1; R2 node1-gnd; R3 node1-node2; R4 node2-gnd; current source Is into node 2.
export function nodal(R1, R2, R3, R4, Vs, Is) {
  const g1 = 1 / R1, g2 = 1 / R2, g3 = 1 / R3, g4 = 1 / R4;
  const a = g1 + g2 + g3, b = -g3, c = -g3, d = g3 + g4, r1 = Vs * g1, r2 = Is;
  const det = a * d - b * c;
  return [(r1 * d - b * r2) / det, (a * r2 - c * r1) / det];
}
W.nodal = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { R3: 2, Is: 1 }; const R1 = 1, R2 = 2, R4 = 4, Vs = 10; // kΩ, mA, V
  const p = new Plot(body, { aspect: 0.45, maxH: 240, x: [0, 3], y: [0, 12], label: 'Node voltages solved from G·v = i' });
  p.draw = (P) => {
    P.axes({ yl: 'V' }); const [v1, v2] = nodal(R1, R2, s.R3, R4, Vs, s.Is);
    P.poly([[0.5, 0], [0.5, v1], [1.3, v1], [1.3, 0]], '#c6ff1a88', C.lime); P.poly([[1.7, 0], [1.7, v2], [2.5, v2], [2.5, 0]], '#6fd3ff88', C.signal);
    const kcl1 = (Vs - v1) / R1 - v1 / R2 - (v1 - v2) / s.R3, kcl2 = (v1 - v2) / s.R3 + s.Is - v2 / R4;
    read.innerHTML = `10 V → R1 1 kΩ → node 1 (R2 2 kΩ to ground) → R3 → node 2 (R4 4 kΩ to ground, I<sub>s</sub> in) · <b>V1 = ${v1.toFixed(3)} V</b> (lime), <b>V2 = ${v2.toFixed(3)} V</b> (blue) · KCL residuals ${Math.abs(kcl1).toExponential(1)}, ${Math.abs(kcl2).toExponential(1)} mA`;
  };
  ctrls.append(slider('R3', { min: 0.1, max: 20, step: 0.1, value: s.R3, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.R3 = v; p.redraw(); }),
    slider('Current source Is', { min: -3, max: 3, step: 0.05, value: s.Is, fmt: (v) => v.toFixed(2) + ' mA' }, (v) => { s.Is = v; p.redraw(); }));
  p.redraw();
};

// p05-l12: NPN low-side switch
W.bjt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Rb: 4.7, beta: 100, Vin: 3.3 }; const Vcc = 12, Rc = 0.4; // kΩ (relay coil 400 Ω)
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 5], y: [0, 35], label: 'Collector current against input voltage' });
  const Ic = (vin) => { const ib = Math.max(0, (vin - 0.7) / s.Rb); return Math.min(s.beta * ib, (Vcc - 0.2) / Rc); };
  p.draw = (P) => {
    P.axes({ xl: 'V_in [V]', yl: 'I_C [mA]' }); P.fn(Ic, C.lime, 2.5, null, 300); P.line([0, 5], [(Vcc - 0.2) / Rc, (Vcc - 0.2) / Rc], C.dim, 1, [4, 4]); P.dot(s.Vin, Ic(s.Vin), C.warn, 5);
    const ib = Math.max(0, (s.Vin - 0.7) / s.Rb), ic = Ic(s.Vin), sat = s.beta * ib >= (Vcc - 0.2) / Rc, vce = sat ? 0.2 : Vcc - ic * Rc;
    const region = ib === 0 ? 'cut-off (off)' : sat ? 'saturated (fully on)' : 'active (partly on: hot!)';
    read.innerHTML = `12 V, 400 Ω relay coil · I<sub>B</sub> = ${ib.toFixed(3)} mA · <b>I<sub>C</sub> = ${ic.toFixed(2)} mA</b> · V<sub>CE</sub> = ${vce.toFixed(2)} V · <b>${region}</b> · transistor dissipation ${(vce * ic).toFixed(1)} mW${sat ? ` · overdrive β·I<sub>B</sub>/I<sub>C</sub> = ${(s.beta * ib / ic).toFixed(2)}` : ''}`;
  };
  ctrls.append(slider('Input voltage', { min: 0, max: 5, step: 0.05, value: s.Vin, fmt: (v) => v.toFixed(2) + ' V' }, (v) => { s.Vin = v; p.redraw(); }),
    slider('Base resistor', { min: 0.5, max: 100, step: 0.1, value: s.Rb, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.Rb = v; p.redraw(); }),
    slider('Current gain β', { min: 30, max: 400, step: 5, value: s.beta, fmt: (v) => String(v) }, (v) => { s.beta = v; p.redraw(); }));
  p.redraw();
};

// p05-l13: logic-level MOSFET, simplified on-resistance model Rds(Vgs) = R10 * (10 - Vth) / (Vgs - Vth)
export function rdson(vgs, vth = 1.8, r10 = 0.01) { return vgs <= vth ? Infinity : (r10 * (10 - vth)) / (vgs - vth); }
W.mosfet = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Vgs: 4.5, I: 5 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [2, 10], y: [0.001, 1], logy: true, label: 'On-resistance against gate voltage (simplified model)' });
  p.draw = (P) => {
    P.axes({ xl: 'V_GS [V]', yl: 'R_DS(on) [Ω]' }); P.fn((v) => Math.min(1, rdson(v)), C.lime, 2.5, null, 300); P.dot(s.Vgs, Math.min(1, rdson(s.Vgs)), C.warn, 5);
    const r = rdson(s.Vgs), pw = s.I * s.I * r;
    read.innerHTML = `V<sub>th</sub> 1.8 V, 10 mΩ at 10 V · at V<sub>GS</sub> = ${s.Vgs.toFixed(1)} V: <b>R<sub>DS(on)</sub> = ${(r * 1000).toFixed(1)} mΩ</b> · conduction loss I²R = <b>${pw.toFixed(2)} W</b> at ${s.I} A${pw > 1 ? ' · needs a heatsink' : ''}`;
  };
  ctrls.append(slider('Gate voltage', { min: 2.2, max: 10, step: 0.1, value: s.Vgs, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.Vgs = v; p.redraw(); }),
    slider('Drain current', { min: 0.5, max: 20, step: 0.5, value: s.I, fmt: (v) => v.toFixed(1) + ' A' }, (v) => { s.I = v; p.redraw(); }));
  p.redraw();
};

// p05-l15: inverting / non-inverting amplifier with ±12 V rails
W.amp = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mode: 'inv', Rin: 10, Rf: 47, A: 1 }; const rail = 11.5;
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 2], y: [-13, 13], label: 'Input (blue) and output (lime) of the amplifier' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]', yl: 'V' }); const G = s.mode === 'inv' ? -s.Rf / s.Rin : 1 + s.Rf / s.Rin; const xs = linspace(0, 2, 400);
    P.line([0, 2], [rail, rail], C.dim, 1, [4, 4]); P.line([0, 2], [-rail, -rail], C.dim, 1, [4, 4]);
    P.line(xs, xs.map((t) => s.A * Math.sin(TAU * t)), C.signal, 1.5); P.line(xs, xs.map((t) => Math.max(-rail, Math.min(rail, G * s.A * Math.sin(TAU * t)))), C.lime, 2.5);
    const clip = Math.abs(G * s.A) > rail;
    read.innerHTML = `${s.mode === 'inv' ? 'inverting: G = −R<sub>f</sub>/R<sub>in</sub>' : 'non-inverting: G = 1 + R<sub>f</sub>/R<sub>in</sub>'} = <b>${G.toFixed(3)}</b> · input impedance ${s.mode === 'inv' ? `<b>${s.Rin} kΩ</b>` : '<b>very high</b>'} · output swing ±11.5 V${clip ? ' · <b>clipping</b>' : ''}`;
  };
  ctrls.append(select('Configuration', [['inv', 'Inverting'], ['non', 'Non-inverting']], 'inv', (v) => { s.mode = v; p.redraw(); }, 'amp-mode'),
    slider('R_in', { min: 1, max: 100, step: 1, value: s.Rin, fmt: (v) => v + ' kΩ' }, (v) => { s.Rin = v; p.redraw(); }),
    slider('R_f', { min: 1, max: 470, step: 1, value: s.Rf, fmt: (v) => v + ' kΩ' }, (v) => { s.Rf = v; p.redraw(); }),
    slider('Input amplitude', { min: 0.05, max: 5, step: 0.05, value: s.A, fmt: (v) => v.toFixed(2) + ' V' }, (v) => { s.A = v; p.redraw(); }));
  p.redraw();
};

// p05-l16: three-op-amp instrumentation amplifier, gain 1 + 49.4k/Rg, finite CMRR
W.inamp = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Rg: 499, cmrr: 100, vd: 2, vcm: 1 }; // Ω, dB, mV, V(50 Hz hum)
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 400], y: [-1, 1], label: 'In-amp output: wanted signal plus leaked common-mode hum' });
  p.draw = (P) => {
    const G = 1 + 49400 / s.Rg, leak = Math.pow(10, -s.cmrr / 20); const xs = linspace(0, 400, 4000);
    const out = xs.map((t) => G * (s.vd * 1e-3 * Math.sin(TAU * 5 * t / 1000) + s.vcm * leak * Math.sin(TAU * 50 * t / 1000)));
    const pk = Math.max(0.01, ...out.map(Math.abs)) * 1.15; P.setRange(P.xr, [-pk, pk]); P.axes({ xl: 't [ms]', yl: 'V_out [V]' });
    P.line(xs, out, C.lime, 1.5); P.line(xs, xs.map((t) => G * s.vd * 1e-3 * Math.sin(TAU * 5 * t / 1000)), C.bone, 1, [4, 4]);
    read.innerHTML = `G = 1 + 49.4 kΩ/R<sub>G</sub> = <b>${G.toFixed(1)}</b> · signal out ${(G * s.vd).toFixed(1)} mV peak · hum out <b>${(G * s.vcm * leak * 1000).toFixed(3)} mV</b> peak at CMRR ${s.cmrr} dB · dashed: ideal`;
  };
  ctrls.append(slider('Gain resistor R_G', { min: 50, max: 50000, step: 1, value: s.Rg, fmt: (v) => v + ' Ω' }, (v) => { s.Rg = v; p.redraw(); }),
    slider('CMRR', { min: 40, max: 130, step: 1, value: s.cmrr, fmt: (v) => v + ' dB' }, (v) => { s.cmrr = v; p.redraw(); }),
    slider('Differential signal', { min: 0.1, max: 10, step: 0.1, value: s.vd, fmt: (v) => v.toFixed(1) + ' mV' }, (v) => { s.vd = v; p.redraw(); }),
    slider('Common-mode hum', { min: 0, max: 5, step: 0.1, value: s.vcm, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.vcm = v; p.redraw(); }));
  p.redraw();
};

// p05-l19: 5 V LDO with 0.3 V dropout
W.ldo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { Vin: 12, I: 0.3, th: 50 }; const Vo = 5, drop = 0.3;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 15], y: [0, 6], label: 'Regulator output against input voltage' });
  p.draw = (P) => {
    P.axes({ xl: 'V_in [V]', yl: 'V_out [V]' }); P.fn((v) => Math.max(0, Math.min(Vo, v - drop)), C.lime, 2.5, null, 300); P.dot(s.Vin, Math.max(0, Math.min(Vo, s.Vin - drop)), C.warn, 5);
    const vo = Math.max(0, Math.min(Vo, s.Vin - drop)), pd = (s.Vin - vo) * s.I, tj = 25 + pd * s.th;
    read.innerHTML = `${s.Vin - drop >= Vo ? 'regulating' : '<b>in dropout</b>'} · V<sub>out</sub> ${vo.toFixed(2)} V · dissipation (V<sub>in</sub>−V<sub>out</sub>)·I = <b>${pd.toFixed(2)} W</b> · efficiency ${(100 * vo / s.Vin).toFixed(1)} % · junction ≈ 25 °C + P·θ<sub>JA</sub> = <b>${tj.toFixed(0)} °C</b>${tj > 125 ? ' · <b>above the 125 °C rating</b>' : ''}`;
  };
  ctrls.append(slider('Input voltage', { min: 3, max: 15, step: 0.1, value: s.Vin, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.Vin = v; p.redraw(); }),
    slider('Load current', { min: 0.01, max: 1.5, step: 0.01, value: s.I, fmt: (v) => v.toFixed(2) + ' A' }, (v) => { s.I = v; p.redraw(); }),
    slider('θJA (package + copper)', { min: 10, max: 150, step: 1, value: s.th, fmt: (v) => v + ' °C/W' }, (v) => { s.th = v; p.redraw(); }));
  p.redraw();
};

// p05-l20: real capacitor impedance (ESR + ESL)
W.decoupling = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { C: 0.1, esr: 0.05, esl: 1 }; // µF, Ω, nH
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [1e3, 1e9], y: [0.001, 1000], logx: true, logy: true, label: 'Impedance of a real decoupling capacitor' });
  p.draw = (P) => {
    const c = s.C * 1e-6, l = s.esl * 1e-9; const Z = (f) => Math.hypot(s.esr, TAU * f * l - 1 / (TAU * f * c));
    P.axes({ xl: 'f [Hz]', yl: '|Z| [Ω]' }); P.fn((f) => 1 / (TAU * f * c), C.dim, 1, [4, 4], 300); P.fn((f) => TAU * f * l, C.dim, 1, [4, 4], 300); P.fn(Z, C.lime, 2.5, null, 600);
    const fr = 1 / (TAU * Math.sqrt(l * c)); P.dot(fr, s.esr, C.warn, 5);
    read.innerHTML = `self-resonance 1/(2π√(LC)) = <b>${f3(fr / 1e6, 2)} MHz</b>, where |Z| = ESR = ${s.esr} Ω · below it the part is a capacitor, above it an inductor · |Z| at 100 MHz = <b>${f3(Z(1e8), 3)} Ω</b>`;
  };
  ctrls.append(slider('Capacitance', { min: 0.001, max: 10, step: 0.001, value: s.C, fmt: (v) => (v < 1 ? (v * 1000).toFixed(0) + ' nF' : v.toFixed(2) + ' µF') }, (v) => { s.C = v; p.redraw(); }),
    slider('ESR', { min: 0.005, max: 2, step: 0.005, value: s.esr, fmt: (v) => v.toFixed(3) + ' Ω' }, (v) => { s.esr = v; p.redraw(); }),
    slider('ESL (package + vias)', { min: 0.2, max: 10, step: 0.1, value: s.esl, fmt: (v) => v.toFixed(1) + ' nH' }, (v) => { s.esl = v; p.redraw(); }));
  p.redraw();
};

// p05-l22: RC step with forward Euler, backward Euler and trapezoidal steps
W.spice = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { m: 'be', h: 0.5 }; const tau = 1, V = 5; // ms
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 8], y: [-2, 9], label: 'RC charging: exact (dashed) against the integrator' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]', yl: 'V_C [V]' }); P.fn((t) => V * (1 - Math.exp(-t / tau)), C.dim, 1.5, [4, 4]);
    const a = s.h / tau; const step = { fe: (v) => v + a * (V - v), be: (v) => (v + a * V) / (1 + a), tr: (v) => (v * (1 - a / 2) + a * V) / (1 + a / 2) }[s.m];
    const xs = [0], ys = [0]; let v = 0, err = 0; for (let t = s.h; t <= 8 + 1e-9; t += s.h) { v = step(v); xs.push(t); ys.push(Math.max(-2, Math.min(9, v))); err = Math.max(err, Math.abs(v - V * (1 - Math.exp(-t / tau)))); }
    P.line(xs, ys, C.lime, 2.2); xs.forEach((x, i) => P.dot(x, ys[i], C.lime, 2.5));
    const names = { fe: 'forward Euler', be: 'backward Euler', tr: 'trapezoidal' };
    read.innerHTML = `RC = 1 ms, 5 V step · ${names[s.m]}, h = ${s.h.toFixed(2)} ms (h/τ = ${a.toFixed(2)}) · max error <b>${f3(err, 3)} V</b>${s.m === 'fe' && a > 2 ? ' · <b>unstable: h > 2τ</b>' : s.m === 'fe' && a > 1 ? ' · overshoots and rings' : ''}`;
  };
  ctrls.append(select('Integrator', [['be', 'Backward Euler'], ['tr', 'Trapezoidal'], ['fe', 'Forward Euler']], 'be', (v) => { s.m = v; p.redraw(); }, 'spice-method'),
    slider('Time step h', { min: 0.05, max: 2.5, step: 0.05, value: s.h, fmt: (v) => v.toFixed(2) + ' ms' }, (v) => { s.h = v; p.redraw(); }));
  p.redraw();
};

// p05-l23: IPC-2221 trace width
export function traceWidthMm(I, dT, oz, inner = false) {
  const k = inner ? 0.024 : 0.048; const tMil = 1.378 * oz;
  const area = Math.pow(I / (k * Math.pow(dT, 0.44)), 1 / 0.725); // mil²
  return (area / tMil) * 0.0254;
}
W.trace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { I: 2, dT: 10, oz: 1, layer: 'outer' };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 10], y: [0, 12], label: 'Minimum trace width against current (IPC-2221)' });
  p.draw = (P) => {
    const inner = s.layer === 'inner'; P.axes({ xl: 'I [A]', yl: 'width [mm]' }); P.fn((i) => traceWidthMm(Math.max(i, 0.01), s.dT, s.oz, inner), C.lime, 2.5, null, 200);
    const w = traceWidthMm(s.I, s.dT, s.oz, inner); P.dot(s.I, Math.min(12, w), C.warn, 5);
    const r = (1.72e-8 * 0.1) / ((w / 1000) * 35e-6 * s.oz);
    read.innerHTML = `${s.I} A, ${s.dT} °C rise, ${s.oz} oz ${s.layer} layer · minimum width <b>${w.toFixed(2)} mm</b> · resistance ${(r * 1000).toFixed(1)} mΩ per 10 cm, dropping ${(s.I * r * 1000).toFixed(0)} mV`;
  };
  ctrls.append(slider('Current', { min: 0.1, max: 10, step: 0.1, value: s.I, fmt: (v) => v.toFixed(1) + ' A' }, (v) => { s.I = v; p.redraw(); }),
    slider('Allowed temperature rise', { min: 5, max: 60, step: 1, value: s.dT, fmt: (v) => v + ' °C' }, (v) => { s.dT = v; p.redraw(); }),
    select('Copper weight', [['0.5', '0.5 oz (18 µm)'], ['1', '1 oz (35 µm)'], ['2', '2 oz (70 µm)']], '1', (v) => { s.oz = +v; p.redraw(); }, 'trace-oz'),
    select('Layer', [['outer', 'Outer layer'], ['inner', 'Inner layer']], 'outer', (v) => { s.layer = v; p.redraw(); }, 'trace-layer'));
  p.redraw();
};

export default W;
