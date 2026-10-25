// Widgets for Phase 18 (real-time systems and ROS 2). Sliders, selects, toggles and buttons only, plus optional drag handles.
// The ROS 2 widgets show from-scratch models of the semantics; nothing here talks to a real ROS 2 system.
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
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };
const median = (a) => pct(a, 0.5);
const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => (a * b) / gcd(a, b);
const TASKC = [C.lime, C.signal, C.warn];
// bar histogram of counts over [edges]
function bars(P, edges, counts, color, ymax) { counts.forEach((n, i) => { if (n > 0) rect(P, edges[i], 0, edges[i + 1], Math.min(n, ymax), color, null); }); }

// ---- p18-l01: timing histogram (illustrative synthetic loop) ----
W.timinghist = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sig: 20, stall: 1, len: 2.5, mode: 'abs' };
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0.5, 4.2], y: [0, 3.6], label: 'Histogram of loop periods, log10 of the count per bin' });
  const redraw = () => {
    const r = rng(7), g = gauss(r), T = 1, work = 0.25, N = 5000, dt = [];
    for (let k = 0; k < N; k++) { let d = T + s.sig * 1e-3 * g(); if (r() < s.stall / 1000) d += s.len; if (s.mode === 'rel') d += work; dt.push(Math.max(0.05, d)); }
    const mean = dt.reduce((a, v) => a + v, 0) / N, sd = Math.sqrt(dt.reduce((a, v) => a + (v - mean) ** 2, 0) / N), mx = Math.max(...dt), p99 = pct(dt, 0.99), miss = dt.filter((v) => v > 2 * T).length;
    const edges = Array.from({ length: 75 }, (_, i) => 0.5 + i * 0.05), cnt = new Array(74).fill(0);
    for (const v of dt) { const i = Math.floor((Math.min(v, 4.19) - 0.5) / 0.05); if (i >= 0 && i < 74) cnt[i]++; }
    p.draw = (P) => { P.axes({ xl: 'period (ms)', yl: 'log10 count' }); bars(P, edges, cnt.map((n) => (n ? Math.log10(n) + 0.15 : 0)), 'rgba(198,255,26,.55)', 3.6);
      P.line([1, 1], [0, 3.6], C.signal, 1.2, [4, 4]); P.text('nominal', 1.05, 3.35, C.signal); P.line([2, 2], [0, 3.6], C.bad, 1.2, [4, 4]); P.text('deadline miss', 2.05, 3.35, C.bad); };
    p.redraw();
    read.innerHTML = `${N} periods (illustrative) · mean ${mean.toFixed(4)} ms · std ${(1000 * sd).toFixed(1)} µs · p99 ${p99.toFixed(3)} ms · max ${mx.toFixed(2)} ms · misses ${miss ? bad(miss) : ok(0)}${s.mode === 'rel' ? ' · ' + sp(C.warn, `relative sleep: the mean drifts to ${mean.toFixed(2)} ms`) : ''}`;
  };
  ctrls.append(slider('Jitter σ (µs)', { min: 0, max: 200, step: 5, value: s.sig }, (v) => { s.sig = v; redraw(); }),
    slider('Stall chance (per 1000)', { min: 0, max: 20, step: 1, value: s.stall }, (v) => { s.stall = v; redraw(); }),
    slider('Stall length (ms)', { min: 0.5, max: 3, step: 0.1, value: s.len, fmt: (v) => v.toFixed(1) }, (v) => { s.len = v; redraw(); }),
    select('Sleep', [['abs', 'until absolute release time'], ['rel', '1 ms after 0.25 ms of work']], s.mode, (v) => { s.mode = v; redraw(); }, 'th-mode'));
  redraw();
};

// ---- p18-l02: rate-monotonic Gantt chart ----
function rmSim(tasks, horizon) {
  const n = tasks.length, left = new Array(n).fill(0), rel = new Array(n).fill(0), worst = new Array(n).fill(0), miss = new Array(n).fill(false), sched = [];
  for (let t = 0; t < horizon; t++) {
    tasks.forEach(([Cc, T], i) => { if (t % T === 0) { if (left[i] > 0) miss[i] = true; left[i] = Cc; rel[i] = t; } });
    let run = -1; for (let i = 0; i < n; i++) if (left[i] > 0) { run = i; break; }
    sched.push(run); if (run >= 0 && --left[run] === 0) worst[run] = Math.max(worst[run], t + 1 - rel[run]);
  }
  return { sched, worst: worst.map((w, i) => (miss[i] ? null : w)) };
}
function rta(tasks) { return tasks.map(([Cc, T], i) => { let R = Cc; for (let it = 0; it < 200; it++) { let Rn = Cc; for (let j = 0; j < i; j++) Rn += Math.ceil(R / tasks[j][1]) * tasks[j][0]; if (Rn === R || Rn > T) { R = Rn; break; } R = Rn; } return R <= T ? R : null; }); }
W.rmsgantt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: [[1, 4], [2, 6], [3, 13]] };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 40], y: [0, 3.6], label: 'Rate-monotonic schedule of three tasks over the first 40 ms' });
  const redraw = () => {
    const tasks = [...s.t].map((x, i) => [...x, i]).sort((a, b) => a[1] - b[1]), order = tasks.map((x) => x[2]), tt = tasks.map(([a, b]) => [a, b]);
    const hyper = Math.min(tt.reduce((a, x) => lcm(a, x[1]), 1), 5000), sim = rmSim(tt, hyper), R = rta(tt), U = tt.reduce((a, [Cc, T]) => a + Cc / T, 0), n = 3, B = n * (2 ** (1 / n) - 1);
    p.draw = (P) => { P.axes({ xl: 'time (ms)', yl: '' });
      order.forEach((orig, k) => { const y = 2.6 - k; P.text('ABC'[orig], 0.3, y + 0.75, TASKC[orig]); for (let r = 0; r < 40; r += tt[k][1]) P.line([r, r], [y, y + 0.9], C.dim, 1); });
      sim.sched.slice(0, 40).forEach((k, t) => { if (k >= 0) rect(P, t, 2.6 - k + 0.1, t + 1, 2.6 - k + 0.7, TASKC[order[k]], null); }); };
    p.redraw();
    const name = (k) => sp(TASKC[order[k]], 'ABC'[order[k]]);
    read.innerHTML = `U = ${U.toFixed(3)} ${U <= B ? ok('≤ bound ' + B.toFixed(3) + ': schedulable') : U > 1 ? bad('> 1: overloaded') : sp(C.warn, '> bound ' + B.toFixed(3) + ': run the exact test')} · response-time analysis ${R.map((r, k) => `${name(k)} ${r === null ? bad('miss') : r}`).join(', ')} · simulation over ${hyper} ms ${sim.worst.map((w, k) => `${name(k)} ${w === null ? bad('miss') : w}`).join(', ')}`;
  };
  const lab = ['A', 'B', 'C'];
  s.t.forEach((_, i) => ctrls.append(slider(`${lab[i]} execution C (ms)`, { min: 1, max: 6, step: 1, value: s.t[i][0] }, (v) => { s.t[i][0] = v; redraw(); }),
    slider(`${lab[i]} period T (ms)`, { min: 3, max: 20, step: 1, value: s.t[i][1] }, (v) => { s.t[i][1] = v; redraw(); })));
  redraw();
};

// ---- p18-l03: RTOS task timeline ----
function rtosSim(tasks, horizon) {
  const st = tasks.map(() => ({ ready: false, left: 0, wake: 0, rel: 0, rels: [], fins: [] })), tl = [];
  for (let t = 0; t < horizon; t++) {
    tasks.forEach((k, i) => { const q = st[i]; if (!q.ready && t >= q.wake) { q.ready = true; q.left = k.C; q.rel = t; q.rels.push(t); } });
    let run = -1; tasks.forEach((k, i) => { if (st[i].ready && (run < 0 || k.prio > tasks[run].prio)) run = i; }); tl.push(run);
    if (run >= 0) { const q = st[run], k = tasks[run]; if (--q.left === 0) { q.fins.push(t + 1); q.ready = false; q.wake = k.until ? q.rel + k.T : t + 1 + k.T; } }
  }
  return { tl, st };
}
W.rtostimeline = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cs: 1, cc: 2, cl: 5, delay: false };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 60], y: [0, 3.6], label: 'Which task runs on each of the first 60 ticks' });
  const names = ['sensing', 'control', 'logging'];
  const redraw = () => {
    const tasks = [{ C: s.cs, T: 4, prio: 3, until: true }, { C: s.cc, T: 10, prio: 2, until: !s.delay }, { C: s.cl, T: 50, prio: 1, until: true }];
    const { tl, st } = rtosSim(tasks, 1000), resp = st.map((q) => Math.max(0, ...q.fins.map((f, j) => f - q.rels[j]))), per = st.map((q) => (q.rels.length > 1 ? (q.rels[q.rels.length - 1] - q.rels[0]) / (q.rels.length - 1) : NaN));
    const idle = tl.filter((v) => v < 0).length;
    p.draw = (P) => { P.axes({ xl: 'tick', yl: '' });
      names.forEach((nm, i) => { const y = 2.6 - i; P.text(nm, 0.4, y + 0.78, TASKC[i]); for (const r of st[i].rels) if (r < 60) P.line([r, r], [y, y + 0.9], C.dim, 1); });
      tl.slice(0, 60).forEach((k, t) => { if (k >= 0) rect(P, t, 2.6 - k + 0.1, t + 1, 2.6 - k + 0.66, TASKC[k], null); }); };
    p.redraw();
    read.innerHTML = names.map((nm, i) => `${sp(TASKC[i], nm)} worst response ${resp[i] <= tasks[i].T ? resp[i] : bad(resp[i])}, mean period ${per[i].toFixed(2)}`).join(' · ') + ` · utilisation ${(1 - idle / 1000).toFixed(3)}${s.delay ? ' · ' + sp(C.warn, 'vTaskDelay: control drifts') : ' · ' + ok('vTaskDelayUntil keeps every period')}`;
  };
  ctrls.append(slider('Sensing C (ticks)', { min: 1, max: 3, step: 1, value: s.cs }, (v) => { s.cs = v; redraw(); }),
    slider('Control C (ticks)', { min: 1, max: 6, step: 1, value: s.cc }, (v) => { s.cc = v; redraw(); }),
    slider('Logging C (ticks)', { min: 1, max: 20, step: 1, value: s.cl }, (v) => { s.cl = v; redraw(); }),
    toggle('Control uses vTaskDelay', s.delay, (v) => { s.delay = v; redraw(); }, { id: 'rt-delay' }));
  redraw();
};

// ---- p18-l04: priority inversion ----
function invSim(scripts, rels, base, inherit, horizon = 60) {
  const n = 3, pc = [0, 0, 0], prio = [...base], done = [-1, -1, -1], tl = []; let owner = -1;
  const unlock = (i) => { owner = -1; prio[i] = base[i]; pc[i]++; };
  for (let t = 0; t < horizon; t++) {
    const blocked = [false, false, false]; let run = -1;
    for (;;) {
      run = -1; for (let i = 0; i < n; i++) if (t >= rels[i] && pc[i] < scripts[i].length && !blocked[i] && (run < 0 || prio[i] > prio[run])) run = i;
      if (run < 0) break; const op = scripts[run][pc[run]];
      if (op === 'L') { if (owner < 0 || owner === run) { owner = run; pc[run]++; continue; } blocked[run] = true; if (inherit && prio[owner] < prio[run]) prio[owner] = prio[run]; continue; }
      if (op === 'U') { unlock(run); blocked.fill(false); continue; }
      break;
    }
    tl.push(run); if (run >= 0) { pc[run]++; while (scripts[run][pc[run]] === 'U') unlock(run); if (pc[run] >= scripts[run].length) done[run] = t + 1; }
  }
  return { tl, done };
}
W.inversion = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { m: 10, cs: 4, inh: false };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 40], y: [0, 3.6], label: 'High, medium and low priority tasks sharing one mutex' });
  const names = ['high (H)', 'medium (M)', 'low (W)'], col = [C.bad, C.signal, C.lime];
  const redraw = () => {
    const scripts = ['cLcU', 'c'.repeat(s.m), 'L' + 'c'.repeat(s.cs) + 'Uc'], rels = [2, 3, 0], { tl, done } = invSim(scripts, rels, [3, 2, 1], s.inh), resp = done[0] - rels[0], bound = 2 + s.cs;
    const inCS = []; { let pc = 0; tl.forEach((k) => { if (k === 2) { inCS.push(pc >= 0 && pc < s.cs); pc++; } else inCS.push(false); }); }
    p.draw = (P) => { P.axes({ xl: 'tick', yl: '' });
      names.forEach((nm, i) => { const y = 2.6 - i; P.text(nm, 0.3, y + 0.78, col[i]); if (rels[i] < 40) P.line([rels[i], rels[i]], [y, y + 0.9], C.dim, 1); });
      tl.slice(0, 40).forEach((k, t) => { if (k >= 0) rect(P, t, 2.6 - k + 0.1, t + 1, 2.6 - k + 0.66, inCS[t] ? C.warn : col[k], null); });
      if (done[0] > 0 && done[0] <= 40) P.line([done[0], done[0]], [2.6, 3.5], C.bad, 2); };
    p.redraw();
    read.innerHTML = `H response ${resp <= bound ? ok(resp + ' ticks') : bad(resp + ' ticks')} · bound with inheritance ${bound} (own work 2 + critical section ${s.cs}) · ${s.inh ? 'W inherits H\'s priority while H waits' : sp(C.warn, 'no inheritance: M delays H')} · ${sp(C.warn, 'amber')} = W inside the critical section`;
  };
  ctrls.append(slider('Medium task work (ticks)', { min: 0, max: 24, step: 1, value: s.m }, (v) => { s.m = v; redraw(); }),
    slider('Critical section (ticks)', { min: 1, max: 8, step: 1, value: s.cs }, (v) => { s.cs = v; redraw(); }),
    toggle('Priority inheritance', s.inh, (v) => { s.inh = v; redraw(); }, { id: 'inv-inh' }));
  redraw();
};

// ---- p18-l05: wake-up latency histogram (illustrative model) ----
W.jitterhist = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kern: 'stock', load: true, iso: false };
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 4], y: [0, 5.2], label: 'Illustrative latency model: log10 count against log10 latency in µs' });
  const redraw = () => {
    const r = rng(11), g = gauss(r), N = 100000, lat = new Float64Array(N);
    const rt = s.kern === 'rt', body0 = rt ? 6 : 8, tailP = (s.load ? (rt ? 0.002 : 0.01) : (rt ? 0.0005 : 0.002)) * (s.iso ? 0.2 : 1), tailMax = rt ? (s.iso ? 25 : 60) : (s.load ? 3000 : 400);
    for (let i = 0; i < N; i++) { let v = body0 * Math.exp(0.35 * g()); if (r() < tailP) v += tailMax * Math.pow(r(), 3); lat[i] = v; }
    const edges = Array.from({ length: 81 }, (_, i) => i * 0.05), cnt = new Array(80).fill(0);
    for (const v of lat) { const i = Math.floor(Math.log10(Math.max(v, 1)) / 0.05); if (i >= 0 && i < 80) cnt[i]++; }
    let mx = 0; for (const v of lat) mx = Math.max(mx, v); const p99 = pct(Array.from(lat), 0.99), med = pct(Array.from(lat), 0.5);
    p.draw = (P) => { P.axes({ xl: 'log10 latency (µs)', yl: 'log10 count' }); bars(P, edges, cnt.map((n) => (n ? Math.log10(n) + 0.15 : 0)), rt ? 'rgba(111,211,255,.6)' : 'rgba(255,181,71,.6)', 5.2);
      P.line([Math.log10(mx), Math.log10(mx)], [0, 5.2], C.bad, 1.5, [4, 4]); P.text('max', Math.log10(mx) + 0.04, 4.9, C.bad); };
    p.redraw();
    read.innerHTML = `${sp(C.warn, 'illustrative model, not a measurement')} · ${rt ? 'PREEMPT_RT' : 'stock kernel'}${s.load ? ', under load' : ', idle'}${s.iso ? ', isolated core + mlockall' : ''} · median ${med.toFixed(1)} µs · p99 ${p99.toFixed(1)} µs · max over ${N / 1000}k wake-ups ${mx < 100 ? ok(mx.toFixed(0) + ' µs') : bad(mx.toFixed(0) + ' µs')}`;
  };
  ctrls.append(select('Kernel', [['stock', 'stock (PREEMPT_DYNAMIC)'], ['rt', 'PREEMPT_RT']], s.kern, (v) => { s.kern = v; redraw(); }, 'jh-kern'),
    toggle('Background load', s.load, (v) => { s.load = v; redraw(); }, { id: 'jh-load' }),
    toggle('Isolated core + mlockall', s.iso, (v) => { s.iso = v; redraw(); }, { id: 'jh-iso' }));
  redraw();
};

// ---- p18-l06: torn reads, seqlock and triple buffer ----
function* tbWriter(m, kind) {
  for (const v of [1, 2]) {
    if (kind === 'naive') { m.a = v; yield `write a = ${v}`; m.b = v; yield `write b = ${v}`; }
    else if (kind === 'seqlock') { m.seq++; yield `seq → ${m.seq} (odd: writing)`; m.a = v; yield `write a = ${v}`; m.b = v; yield `write b = ${v}`; m.seq++; yield `seq → ${m.seq}`; }
    else { m.slot[m.back] = [v, null]; yield `slot ${m.back}.a = ${v}`; m.slot[m.back][1] = v; yield `slot ${m.back}.b = ${v}`; const o = m.mid[0]; m.mid = [m.back, true]; m.back = o; yield `exchange: middle = slot ${m.mid[0]} (new)`; }
  }
}
function* tbReader(m, kind, out) {
  if (kind === 'naive') { const a = m.a; yield `read a = ${a}`; const b = m.b; yield `read b = ${b}`; out.push([a, b]); return; }
  if (kind === 'seqlock') {
    for (let k = 0; k < 2; k++) { const s1 = m.seq; yield `read seq = ${s1}`; const a = m.a; yield `read a = ${a}`; const b = m.b; yield `read b = ${b}`; const s2 = m.seq; yield `read seq = ${s2}`; if (s1 % 2 === 0 && s1 === s2) { out.push([a, b]); return; } }
    out.push('gave up'); return;
  }
  if (m.mid[1]) { const o = m.mid[0]; m.mid = [m.front, false]; m.front = o; yield `exchange: front = slot ${o}`; } else yield 'no new data';
  const a = m.slot[m.front][0]; yield `read a = ${a}`; const b = m.slot[m.front][1]; yield `read b = ${b}`; out.push([a, b]);
}
const tbInit = (kind) => (kind === 'triple' ? { slot: [[0, 0], [0, 0], [0, 0]], back: 0, mid: [1, false], front: 2 } : { a: 0, b: 0, seq: 0 });
function tbRun(kind, choose) { const m = tbInit(kind), out = [], th = [tbWriter(m, kind), tbReader(m, kind, out)], alive = [true, true], log = [];
  while (alive[0] || alive[1]) { const who = choose(alive); const r = th[who].next(); if (r.done) alive[who] = false; else log.push([who, r.value]); }
  return { out: out[0], log, m }; }
const torn = (o) => Array.isArray(o) && o[0] !== o[1];
W.triplebuf = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kind: 'naive', seed: 3 };
  const p = new Plot(body, { aspect: 0.62, maxH: 360, x: [0, 10], y: [0, 10], label: 'One interleaving of writer and reader steps, in order from the top' });
  const redraw = () => {
    const r = rng(s.seed), run = tbRun(s.kind, (al) => (al[0] && al[1] ? (r() < 0.5 ? 0 : 1) : al[0] ? 0 : 1));
    let nt = 0, n = 0; const r2 = rng(99); for (let i = 0; i < 2000; i++) { const x = tbRun(s.kind, (al) => (al[0] && al[1] ? (r2() < 0.5 ? 0 : 1) : al[0] ? 0 : 1)); n++; if (torn(x.out)) nt++; }
    const L = run.log, dy = 9.2 / Math.max(L.length, 8);
    p.draw = (P) => { P.text('writer', 1.2, 9.6, C.signal); P.text('reader', 6.2, 9.6, C.warn);
      L.forEach(([who, txt], i) => { const y = 9.1 - (i + 1) * dy; P.text(txt, who ? 5.2 : 0.2, y, who ? C.warn : C.signal); P.line([0, 10], [y - dy * 0.35, y - dy * 0.35], C.rule2, 0.5); }); };
    p.redraw();
    const o = run.out, os = Array.isArray(o) ? `(${o[0]}, ${o[1]})` : o;
    read.innerHTML = `reader got ${torn(o) ? bad(os + ' torn') : ok(os)} · 2000 random interleavings: ${nt ? bad(nt + ' torn') : ok('0 torn')} · ${s.kind === 'naive' ? 'a plain shared struct' : s.kind === 'seqlock' ? 'the reader retries if the counter was odd or changed' : 'writer and reader never touch the same slot'}`;
  };
  ctrls.append(select('Scheme', [['naive', 'naive shared struct'], ['seqlock', 'seqlock'], ['triple', 'triple buffer']], s.kind, (v) => { s.kind = v; redraw(); }, 'tb-kind'),
    slider('Interleaving (seed)', { min: 1, max: 40, step: 1, value: s.seed }, (v) => { s.seed = v; redraw(); }));
  redraw();
};

// ---- p18-l07: ROS graph with QoS compatibility ----
function qosOk(pq, sq) {
  if (pq.rel === 'best_effort' && sq.rel === 'reliable') return 'reliability';
  if (pq.dur === 'volatile' && sq.dur === 'transient_local') return 'durability';
  return '';
}
W.rosgraph = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lidar: 'best_effort', estScan: 'reliable', mapDur: 'transient_local', planMap: 'transient_local', viewOdom: 'transient_local' };
  const p = new Plot(body, { aspect: 0.72, maxH: 400, x: [0, 10], y: [0, 7.2], label: 'Nodes (boxes) and topic connections; red edges do not match' });
  const N = { imu: [1.6, 6, 'imu_driver'], lidar: [1.6, 4, '/robot1/lidar'], est: [5, 5, 'estimator'], map: [1.6, 1.4, 'map_server'], plan: [8.4, 2.6, 'planner'], view: [8.4, 5.9, 'viewer'] };
  const redraw = () => {
    const E = [['imu', 'est', '/imu/data', { rel: 'best_effort', dur: 'volatile' }, { rel: 'best_effort', dur: 'volatile' }],
      ['lidar', 'est', '/robot1/scan', { rel: s.lidar, dur: 'volatile' }, { rel: s.estScan, dur: 'volatile' }],
      ['map', 'plan', '/map', { rel: 'reliable', dur: s.mapDur }, { rel: 'reliable', dur: s.planMap }],
      ['est', 'plan', '/odom', { rel: 'reliable', dur: 'volatile' }, { rel: 'reliable', dur: 'volatile' }],
      ['est', 'view', '/odom', { rel: 'reliable', dur: 'volatile' }, { rel: 'reliable', dur: s.viewOdom }]].map((e) => [...e, qosOk(e[3], e[4])]);
    p.draw = (P) => {
      for (const [a, b, t, , , why] of E) { const [x0, y0] = N[a], [x1, y1] = N[b]; P.arrow(x0 + 0.9 * Math.sign(x1 - x0), y0, x1 - 0.9 * Math.sign(x1 - x0), y1, why ? C.bad : C.lime, 2); P.text(t, (x0 + x1) / 2 - 0.6, (y0 + y1) / 2 + 0.2, why ? C.bad : C.fog); }
      for (const [x, y, nm] of Object.values(N)) { rect(P, x - 0.95, y - 0.35, x + 0.95, y + 0.35, C.rule, C.signal); P.text(nm, x, y - 0.08, C.bone, 'center'); }
    };
    p.redraw();
    const badE = E.filter((e) => e[5]);
    read.innerHTML = `topics: /imu/data, /map, /odom, /robot1/scan · matched ${E.length - badE.length} of ${E.length} · ${badE.length ? badE.map((e) => bad(`${N[e[0]][2]} → ${N[e[1]][2]}: ${e[5]}`)).join(', ') : ok('every connection matches')}`;
  };
  const rel = [['best_effort', 'best effort'], ['reliable', 'reliable']], dur = [['volatile', 'volatile'], ['transient_local', 'transient local']];
  ctrls.append(select('Lidar publisher reliability', rel, s.lidar, (v) => { s.lidar = v; redraw(); }, 'rg-lidar'),
    select('Estimator scan subscription', rel, s.estScan, (v) => { s.estScan = v; redraw(); }, 'rg-est'),
    select('Map server durability', dur, s.mapDur, (v) => { s.mapDur = v; redraw(); }, 'rg-map'),
    select('Planner map subscription', dur, s.planMap, (v) => { s.planMap = v; redraw(); }, 'rg-plan'),
    select('Viewer odom subscription', dur, s.viewOdom, (v) => { s.viewOdom = v; redraw(); }, 'rg-view'));
  redraw();
};

// ---- p18-l08: message flow between nodes ----
W.msgflow = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 0, sync: false };
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 10], y: [0, 6], label: 'Messages between nodes, one event per step' });
  const N = { talker: [1.5, 5], listener: [5, 5], adder: [8.5, 5], client: [1.5, 1.5], fib: [8.5, 1.5] };
  const events = () => {
    const ev = [];
    for (let i = 0; i < 2; i++) ev.push(['talker', 'listener', `topic /chatter: hello ${i}`, C.lime]);
    if (s.sync) { ev.push(['listener', 'adder', 'request (2, 3), called synchronously inside a callback', C.signal]); ev.push(['adder', 'adder', 'server callback waits in the queue: the only executor thread is blocked', C.bad]); ev.push(['adder', 'adder', 'deadlock: nothing else runs, the response never arrives', C.bad]); return ev; }
    ev.push(['listener', 'adder', 'service request add_two_ints (2, 3)', C.signal], ['adder', 'listener', 'service response 5 (done callback runs)', C.signal]);
    ev.push(['client', 'fib', 'action goal: fibonacci order 5', C.warn], ['fib', 'client', 'goal accepted', C.warn]);
    for (const f of ['[0, 1, 1]', '[0, 1, 1, 2]', '[0, 1, 1, 2, 3]', '[0, 1, 1, 2, 3, 5]']) ev.push(['fib', 'client', `feedback ${f}`, C.warn]);
    ev.push(['fib', 'client', 'result SUCCEEDED [0, 1, 1, 2, 3, 5]', C.warn], ['talker', 'listener', 'topic /chatter: hello 2', C.lime]);
    return ev;
  };
  let sl;
  const redraw = () => {
    const ev = events(); s.k = Math.min(s.k, ev.length - 1); const [a, b, txt, col] = ev[s.k];
    p.draw = (P) => {
      P.line([N.talker[0], N.listener[0]], [5, 5], C.rule2, 1); P.line([N.listener[0], N.adder[0]], [5, 5], C.rule2, 1); P.line([N.client[0], N.fib[0]], [1.5, 1.5], C.rule2, 1);
      for (const [nm, [x, y]] of Object.entries(N)) { rect(P, x - 1.1, y - 0.4, x + 1.1, y + 0.4, C.rule, nm === a || nm === b ? col : C.dim); P.text(nm === 'client' ? 'fib_client' : nm === 'fib' ? 'fib_server' : nm, x, y - 0.08, C.bone, 'center'); }
      const [x0, y0] = N[a], [x1, y1] = N[b];
      if (a !== b) { P.arrow(x0 + 1.1 * Math.sign(x1 - x0), y0 + 0.6, x1 - 1.1 * Math.sign(x1 - x0), y1 + 0.6, col, 2.5); }
      else { P.text('⟳ stalled', x0, y0 - 0.9, C.bad, 'center'); }
      P.text(txt, 5, 3.2, col, 'center');
    };
    p.redraw();
    read.innerHTML = `step ${s.k + 1} of ${ev.length} · ${txt} · ${s.sync ? bad('single-threaded executor, sync call: deadlock') : ok('async calls: every message is delivered')}`;
  };
  sl = slider('Step', { min: 0, max: 11, step: 1, value: 0, fmt: (v) => v + 1 }, (v) => { s.k = v; redraw(); });
  ctrls.append(sl, button('Next event', () => { const n = events().length, i = sl.querySelector('input'); i.value = (s.k + 1) % n; i.dispatchEvent(new Event('input')); }, 'mf-next'),
    toggle('Sync call inside a callback', s.sync, (v) => { s.sync = v; const i = sl.querySelector('input'); i.value = 0; i.dispatchEvent(new Event('input')); }, { id: 'mf-sync' }));
  redraw();
};

// ---- p18-l09: IMU publisher and subscriber ----
function pubsubSim({ rate = 200, seconds = 10, rel = 'reliable', loss = 0, cb = 1, depth = 10, seed = 0 }) {
  const r = rng(seed + 1), g = gauss(r), T = 1 / rate, ev = [];
  for (let k = 0; k < Math.round(seconds * rate); k++) { const st = k * T + 0.2e-3 * g(); let t = st;
    for (let tries = 0; tries < 50; tries++) { if (r() >= loss) { ev.push([t + 1e-3 - 0.3e-3 * Math.log(1 - r()), k, st]); break; } if (rel === 'best_effort') break; t += 10e-3; } }
  ev.sort((a, b) => a[0] - b[0]);
  const q = [], got = []; let busy = 0, dq = 0, i = 0;
  const start = (now) => { const [k, st] = q.shift(); busy = now + cb * 1e-3; got.push([k, st, busy]); };
  while (i < ev.length || q.length) {
    const tA = i < ev.length ? ev[i][0] : Infinity;
    if (q.length && busy <= tA) { start(Math.max(busy, 0)); continue; }
    if (tA === Infinity) break;
    const [t, k, st] = ev[i++]; q.push([k, st]); if (q.length > depth) { q.shift(); dq++; }
    if (busy <= t) start(t);
  }
  return { got, dq };
}
W.pubsub = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { rel: 'reliable', loss: 0, cb: 1, depth: 10 };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.7, maxH: 300, x: [0, 1], y: [-0.6, 0.6], label: 'Yaw rate samples the subscriber processed in the first second' });
  const q = new Plot(d2, { aspect: 0.7, maxH: 300, x: [0, 10], y: [0, 100], label: 'Latency of each processed sample over 10 s' });
  const redraw = () => {
    const { got, dq } = pubsubSim(s), lat = got.map((g) => 1000 * (g[2] - g[1])), mx = Math.max(...lat), med = median(lat), rate = got.length / 10;
    p.draw = (P) => { P.axes({ xl: 'stamp (s)', yl: 'rad/s' }); P.fn((t) => 0.4 * Math.sin(2 * Math.PI * 2 * t), C.dim, 1, [3, 3]); for (const [, st] of got) if (st <= 1) P.dot(st, 0.4 * Math.sin(2 * Math.PI * 2 * st), C.lime, 1.8); };
    q.setRange([0, 10], [0, Math.max(10, Math.ceil(mx / 10) * 10)]);
    q.draw = (P) => { P.axes({ xl: 'stamp (s)', yl: 'latency (ms)' }); for (let j = 0; j < got.length; j += 2) P.dot(got[j][1], lat[j], C.signal, 1.4); };
    p.redraw(); q.redraw();
    read.innerHTML = `received ${Math.abs(rate - 200) <= 2 ? ok(rate.toFixed(1) + ' Hz') : sp(C.warn, rate.toFixed(1) + ' Hz')} of 200 Hz · ${dq} overwritten by the depth-${s.depth} history · ${2000 - got.length - dq} lost on the link · latency median ${med.toFixed(2)} ms, max ${mx.toFixed(2)} ms (illustrative link model)`;
  };
  ctrls.append(select('Reliability', [['reliable', 'reliable'], ['best_effort', 'best effort']], s.rel, (v) => { s.rel = v; redraw(); }, 'ps-rel'),
    slider('Packet loss (%)', { min: 0, max: 10, step: 0.5, value: s.loss, fmt: (v) => v.toFixed(1) }, (v) => { s.loss = v / 100; redraw(); }),
    slider('Callback time (ms)', { min: 0.5, max: 10, step: 0.5, value: s.cb, fmt: (v) => v.toFixed(1) }, (v) => { s.cb = v; redraw(); }),
    slider('History depth', { min: 1, max: 50, step: 1, value: s.depth }, (v) => { s.depth = v; redraw(); }));
  redraw();
};

// ---- p18-l10: CDR byte layout ----
W.msgfields = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { label: 4, hist: 3, order: 'def' };
  const p = new Plot(body, { aspect: 0.75, maxH: 420, x: [0, 8], y: [0, 14], label: 'CDR payload, 8 bytes per row; dim cells are padding' });
  const COLS = [C.lime, C.signal, C.warn, '#c792ea', '#ff8fa3', '#7fdbca', '#f4d35e', '#9aa5ff'];
  const redraw = () => {
    const F = [['header.stamp.sec', 'int32'], ['header.stamp.nanosec', 'uint32'], ['header.frame_id', 'string', 9], ['wheel', 'uint8'], ['ticks', 'int32'], ['velocity', 'float64'], ['covariance_diag', 'float32', 3], ['label', 'string', s.label], ['history', 'int16[]', s.hist]];
    const body0 = s.order === 'def' ? F.slice(3) : [F[5], F[4], F[6], F[7], F[8], F[3]], fields = [...F.slice(0, 3), ...body0];
    const cells = []; let off = 0, pad = 0;
    const al = (n) => { while (off % n) { cells.push(-1); off++; pad++; } };
    const put = (fi, n) => { for (let i = 0; i < n; i++) cells.push(fi); off += n; };
    fields.forEach(([nm, ty, n], fi) => {
      if (ty === 'string') { al(4); put(fi, 4 + n + 1); }
      else if (ty === 'int16[]') { al(4); put(fi, 4); if (n) { al(2); put(fi, 2 * n); } }
      else { const sz = { int32: 4, uint32: 4, uint8: 1, float64: 8, float32: 4 }[ty], cnt = n || 1; al(sz); put(fi, sz * cnt); }
    });
    const rows = Math.ceil(cells.length / 8); p.setRange([0, 8], [0, Math.max(rows, 12) + 0.5]);
    p.draw = (P) => { const top = Math.max(rows, 12);
      cells.forEach((fi, i) => { const x = i % 8, y = top - 1 - Math.floor(i / 8); rect(P, x + 0.05, y + 0.08, x + 0.95, y + 0.92, fi < 0 ? C.rule : COLS[fi % COLS.length], fi < 0 ? C.dim : null); });
      for (let rr = 0; rr < rows; rr++) P.text(String(8 * rr), -0.02, top - 1 - rr + 0.35, C.fog, 'right'); };
    p.redraw();
    read.innerHTML = `payload ${cells.length} bytes + 4-byte header = ${ok(cells.length + 4 + ' bytes')} · padding ${pad ? sp(C.warn, pad + ' bytes') : ok('0 bytes')} · ` + fields.map(([nm], fi) => sp(COLS[fi % COLS.length], nm)).join(' ');
  };
  ctrls.append(slider('Label length (characters)', { min: 0, max: 12, step: 1, value: s.label }, (v) => { s.label = v; redraw(); }),
    slider('History length (elements)', { min: 0, max: 8, step: 1, value: s.hist }, (v) => { s.hist = v; redraw(); }),
    select('Field order after the header', [['def', 'as defined'], ['big', 'largest first, wheel last']], s.order, (v) => { s.order = v; redraw(); }, 'mf-order'));
  redraw();
};

// ---- p18-l11: TF tree ----
const qm = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qc = (q) => [-q[0], -q[1], -q[2], q[3]];
const qr = (q, v) => qm(qm(q, [...v, 0]), qc(q)).slice(0, 3);
const qyaw = (y) => [0, 0, Math.sin(y / 2), Math.cos(y / 2)];
const qrpy = (r, p_, y) => qm(qyaw(y), qm([0, Math.sin(p_ / 2), 0, Math.cos(p_ / 2)], [Math.sin(r / 2), 0, 0, Math.cos(r / 2)]));
const tfMul = (A, B) => ({ t: qr(A.q, B.t).map((v, i) => v + A.t[i]), q: qm(A.q, B.q) });
const tfInv = (A) => { const qi = qc(A.q); return { t: qr(qi, A.t).map((v) => -v), q: qi }; };
function slerp(a, b, s) { let d = a.reduce((x, v, i) => x + v * b[i], 0); if (d < 0) { b = b.map((v) => -v); d = -d; } if (d > 0.9995) { const q = a.map((v, i) => v + s * (b[i] - v)), n = Math.hypot(...q); return q.map((v) => v / n); } const th = Math.acos(d); return a.map((v, i) => (Math.sin((1 - s) * th) * v + Math.sin(s * th) * b[i]) / Math.sin(th)); }
const TFP = { odom: 'map', base_link: 'odom', laser: 'base_link', camera_link: 'base_link', camera_optical: 'camera_link' };
function tfEdge(f, t) {
  if (f === 'odom') return { t: [1, 0.5, 0], q: qyaw(0.1) };
  if (f === 'laser') return { t: [0.2, 0, 0.15], q: [0, 0, 0, 1] };
  if (f === 'camera_link') return { t: [0.1, 0, 0.3], q: qrpy(0, 0.2, 0) };
  if (f === 'camera_optical') return { t: [0, 0, 0], q: qrpy(-Math.PI / 2, 0, -Math.PI / 2) };
  const k = clamp(Math.floor(t / 0.1), 0, 19), t0 = 0.1 * k, s = (t - t0) / 0.1, P = (u) => ({ t: [Math.sin(u), 1 - Math.cos(u), 0], q: qyaw(u) }), A = P(t0), B = P(t0 + 0.1);
  return { t: A.t.map((v, i) => v + s * (B.t[i] - v)), q: slerp(A.q, B.q, s) };
}
const chainUp = (f) => { const c = [f]; while (TFP[c[c.length - 1]]) c.push(TFP[c[c.length - 1]]); return c; };
function tfLookup(target, source, t) {
  const us = chainUp(source), ut = chainUp(target), root = us.find((f) => ut.includes(f));
  const toRoot = (path) => { let T = { t: [0, 0, 0], q: [0, 0, 0, 1] }; for (const f of path.slice(0, path.indexOf(root))) T = tfMul(tfEdge(f, t), T); return T; };
  return { T: tfMul(tfInv(toRoot(ut)), toRoot(us)), path: [...us.slice(0, us.indexOf(root) + 1), ...ut.slice(0, ut.indexOf(root)).reverse()] };
}
W.tftree = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: 1.0, src: 'laser', tgt: 'map' };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.9, maxH: 320, x: [0, 10], y: [0, 6.5], label: 'Frame tree; the lookup path is highlighted' });
  const q = new Plot(d2, { aspect: 0.9, maxH: 320, x: [0.5, 2.6], y: [0.2, 2.3], equal: true, label: 'Top view of the map: odometry path and frames at the chosen time' });
  const POS = { map: [5, 6], odom: [5, 4.8], base_link: [5, 3.6], laser: [2.2, 2.2], camera_link: [7.6, 2.2], camera_optical: [7.6, 0.8] };
  const redraw = () => {
    if (s.t > 2.0) { s.t = 2.0; }
    const { T, path } = tfLookup(s.tgt, s.src, s.t), yaw = 2 * Math.atan2(T.q[2], T.q[3]);
    const onPath = (a, b) => path.some((f, i) => i > 0 && ((path[i - 1] === a && f === b) || (path[i - 1] === b && f === a)));
    p.draw = (P) => { for (const [c, par] of Object.entries(TFP)) P.line([POS[c][0], POS[par][0]], [POS[c][1], POS[par][1]], onPath(c, par) ? C.lime : C.dim, onPath(c, par) ? 3 : 1.2, ['laser', 'camera_link', 'camera_optical'].includes(c) ? [5, 4] : undefined);
      for (const [f, [x, y]] of Object.entries(POS)) { rect(P, x - 1.5, y - 0.32, x + 1.5, y + 0.32, C.bg, f === s.src ? C.signal : f === s.tgt ? C.warn : C.rule2); P.text(f, x, y - 0.1, C.bone, 'center'); } };
    q.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); const xs = [], ys = [];
      for (let u = 0; u <= 2.0001; u += 0.05) { const B = tfLookup('map', 'base_link', u).T; xs.push(B.t[0]); ys.push(B.t[1]); } P.line(xs, ys, C.dim, 1.2, [4, 4]);
      for (const f of ['base_link', 'laser', 'camera_link']) { const F = tfLookup('map', f, s.t).T, ax = qr(F.q, [0.18, 0, 0]), ay = qr(F.q, [0, 0.18, 0]);
        P.arrow(F.t[0], F.t[1], F.t[0] + ax[0], F.t[1] + ax[1], C.bad, 1.6); P.arrow(F.t[0], F.t[1], F.t[0] + ay[0], F.t[1] + ay[1], C.lime, 1.6); } };
    p.redraw(); q.redraw();
    read.innerHTML = `lookup ${sp(C.warn, s.tgt)} ← ${sp(C.signal, s.src)} at t = ${s.t.toFixed(2)} s · translation (${T.t.map((v) => v.toFixed(4)).join(', ')}) m · quaternion (${T.q.map((v) => v.toFixed(3)).join(', ')})${Math.abs(T.q[0]) < 1e-9 && Math.abs(T.q[1]) < 1e-9 ? ` · yaw ${yaw.toFixed(4)} rad` : ''} · path ${path.join(' → ')} · odometry samples every 0.1 s, slerp in between`;
  };
  const fr = Object.keys(POS).map((f) => [f, f]);
  ctrls.append(slider('Time (s)', { min: 0, max: 2, step: 0.05, value: s.t, fmt: (v) => v.toFixed(2) }, (v) => { s.t = v; redraw(); }),
    select('Source frame', fr, s.src, (v) => { s.src = v; redraw(); }, 'tf-src'), select('Target frame', fr, s.tgt, (v) => { s.tgt = v; redraw(); }, 'tf-tgt'));
  redraw();
};

// ---- p18-l12: URDF arm viewer ----
const ARM = { base: 0.05, l: [0.30, 0.25, 0.15] };
function armPts(q) { const [q1, q2, q3] = q, z0 = ARM.base, z1 = z0 + ARM.l[0], r2 = ARM.l[1] * Math.sin(q2), z2 = z1 + ARM.l[1] * Math.cos(q2), r3 = r2 + ARM.l[2] * Math.sin(q2 + q3), z3 = z2 + ARM.l[2] * Math.cos(q2 + q3);
  return { rz: [[0, 0], [0, z0], [0, z1], [r2, z2], [r3, z3]], xyz: [r3 * Math.cos(q1), r3 * Math.sin(q1), z3], r: [0, 0, 0, r2, r3], q1 }; }
W.urdfview = (el) => {
  const { body, read, ctrls } = frame(el, { interact: true });
  const s = { q: [0.6, 0.7, -1.2] };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 1, maxH: 320, x: [-0.5, 0.6], y: [-0.05, 0.85], equal: true, label: 'Side view in the arm plane; drag the tool (in Drag mode on touch)' });
  const q = new Plot(d2, { aspect: 1, maxH: 320, x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, label: 'Top view' });
  const sl = [];
  const redraw = () => {
    const A = armPts(s.q), col = [C.dim, C.lime, C.signal, C.warn];
    p.draw = (P) => { P.axes({ xl: 'r (m)', yl: 'z (m)' }); rect(P, -0.08, -0.02, 0.08, 0.05, C.rule2, null);
      for (let i = 1; i < 4; i++) P.line([A.rz[i][0], A.rz[i + 1][0]], [A.rz[i][1], A.rz[i + 1][1]], col[i], 6);
      P.line([A.rz[0][0], A.rz[1][0]], [A.rz[0][1], A.rz[1][1]], C.dim, 6); A.rz.slice(1, 4).forEach(([x, y]) => P.dot(x, y, C.bone, 4)); P.handle(A.rz[4][0], A.rz[4][1], C.bad); };
    q.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); const c = Math.cos(A.q1), sn = Math.sin(A.q1);
      for (let i = 2; i < 4; i++) P.line([A.r[i] * c, A.r[i + 1] * c], [A.r[i] * sn, A.r[i + 1] * sn], col[i], 6); P.dot(0, 0, C.lime, 6); P.dot(A.xyz[0], A.xyz[1], C.bad, 5); };
    p.redraw(); q.redraw();
    read.innerHTML = `tool0 at (${A.xyz.map((v) => v.toFixed(4)).join(', ')}) m from the URDF chain base_link → link1 → link2 → link3 → tool0 · joints (${s.q.map((v) => v.toFixed(2)).join(', ')}) rad · limits ±2.6 rad`;
  };
  // drag: inverse kinematics of the two pitch joints in the arm plane (elbow-down branch matching the sign of q3)
  p.handles(() => { const A = armPts(s.q); return [A.rz[4]]; }, (i, r, z) => {
    const a = ARM.l[1], b = ARM.l[2], dz = z - ARM.base - ARM.l[0], d = clamp(Math.hypot(r, dz), Math.abs(a - b) + 1e-6, a + b - 1e-6), c3 = (d * d - a * a - b * b) / (2 * a * b), q3 = (s.q[2] >= 0 ? 1 : -1) * Math.acos(clamp(c3, -1, 1));
    const ang = Math.atan2(r, dz), q2 = ang - Math.atan2(b * Math.sin(q3), a + b * Math.cos(q3));
    s.q[1] = clamp(q2, -2.6, 2.6); s.q[2] = clamp(q3, -2.6, 2.6); [1, 2].forEach((k) => { const inp = sl[k].querySelector('input'); inp.value = s.q[k].toFixed(2); inp.dispatchEvent(new Event('input')); }); redraw();
  }, el);
  ['joint1 (yaw)', 'joint2 (pitch)', 'joint3 (pitch)'].forEach((nm, k) => { const c = slider(nm + ' (rad)', { min: -2.6, max: 2.6, step: 0.01, value: s.q[k], fmt: (v) => v.toFixed(2) }, (v) => { s.q[k] = v; redraw(); }); sl.push(c); ctrls.append(c); });
  redraw();
};

// ---- p18-l13: launch tree and resolved parameters ----
W.launchtree = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { robot: 'robot1', sim: 'false', logger: 'true', pattern: false };
  const p = new Plot(body, { aspect: 0.62, maxH: 360, x: [0, 10], y: [0, 6.4], label: 'Launch tree: arguments, namespaced groups and nodes' });
  const resolve = () => {
    const yaml = [['/**', { use_sim_time: false, rate: 50.0 }], ['/*/driver', { port: '/dev/ttyUSB0' }], [s.pattern ? '/*/controller' : '/robot1/controller', { kp: 2.5, rate: 200.0 }]];
    const match = (pat, fqn) => new RegExp('^' + pat.replace(/\/\*\*/g, '\u0001').replace(/\*/g, '[^/]+').replace(/\u0001/g, '(/[^/]+)*') + '$').test(fqn);
    const node = (fqn, inline) => { const pr = {}, src = {}; for (const [pat, b] of yaml) if (match(pat, fqn)) for (const [k, v] of Object.entries(b)) { pr[k] = v; src[k] = pat; } for (const [k, v] of Object.entries(inline)) { pr[k] = v; src[k] = 'launch file'; } return { fqn, pr, src }; };
    const out = [node(`/${s.robot}/driver`, {}), node(`/${s.robot}/controller`, { use_sim_time: s.sim === 'true' })];
    if (s.logger === 'true') out.push(node('/tools/logger', { rate: 10.0 }));
    return out;
  };
  const redraw = () => {
    const nodes = resolve(), ctl = nodes[1];
    p.draw = (P) => { rect(P, 0.2, 5.5, 9.8, 6.2, C.rule, C.dim); P.text(`bringup.launch.py   robot:=${s.robot}  use_sim_time:=${s.sim}  with_logger:=${s.logger}`, 0.4, 5.75, C.bone);
      const g = [[`group /${s.robot}`, 0.4, 4.4, true], ['group /tools', 5.2, 4.4, s.logger === 'true']];
      for (const [nm, x, y, on] of g) { rect(P, x, y, x + 4.4, y + 0.6, C.bg, on ? C.signal : C.rule2); P.text(on ? nm : nm + ' (skipped)', x + 0.2, y + 0.2, on ? C.signal : C.dim); }
      nodes.forEach((n, i) => { const x = n.fqn.startsWith('/tools') ? 5.2 : 0.4, y = n.fqn.startsWith("/tools") ? 3.4 : 3.4 - 1.85 * i;
        rect(P, x + 0.3, y - 1.05, x + 4.4, y + 0.6, C.bg, C.lime); P.text(n.fqn, x + 0.5, y + 0.2, C.lime);
        Object.entries(n.pr).forEach(([k, v], j) => P.text(`${k}: ${v}`, x + 0.5, y - 0.25 - 0.3 * j, n.src[k] === 'launch file' ? C.warn : C.bone)); }); };
    p.redraw();
    read.innerHTML = nodes.map((n) => `${n.fqn}: ${Object.entries(n.pr).map(([k, v]) => `${k} ${v} ${sp(C.dim, '(' + n.src[k] + ')')}`).join(', ')}`).join(' · ') + ` · controller kp ${'kp' in ctl.pr ? ok('set') : bad('missing: the file names /robot1 explicitly')}` + ` · /${s.robot}/controller remaps cmd_vel → /${s.robot}/base/cmd_vel`;
  };
  ctrls.append(select('robot', [['robot1', 'robot1'], ['robot2', 'robot2']], s.robot, (v) => { s.robot = v; redraw(); }, 'lt-robot'),
    select('use_sim_time', [['false', 'false'], ['true', 'true']], s.sim, (v) => { s.sim = v; redraw(); }, 'lt-sim'),
    select('with_logger', [['true', 'true'], ['false', 'false']], s.logger, (v) => { s.logger = v; redraw(); }, 'lt-log'),
    toggle('YAML uses /*/controller', s.pattern, (v) => { s.pattern = v; redraw(); }, { id: 'lt-pat' }));
  redraw();
};

// ---- p18-l14: ros2_control lifecycle ----
W.ctrlstates = (el) => {
  const { body, read, ctrls } = frame(el);
  const TR = { 'unconfigured|configure': 'inactive', 'inactive|activate': 'active', 'active|deactivate': 'inactive', 'inactive|cleanup': 'unconfigured' };
  const s = { jtc: 'unconfigured', other: 'inactive', msg: 'press configure, then activate', sent: false };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.8, maxH: 300, x: [0, 10], y: [0, 7], label: 'Lifecycle of the joint trajectory controller' });
  const q = new Plot(d2, { aspect: 0.8, maxH: 300, x: [0, 3], y: [-0.4, 1.2], label: 'joint1 reference (dashed) and mock hardware position' });
  const POS = { unconfigured: [2, 5.6], inactive: [7.6, 5.6], active: [7.6, 1.4] };
  const traj = () => { const pts = [[0, 0, 0], [1, 0.5, 0.4], [2, 1.0, 0]], tt = [], ref = [], pos = []; let x = 0;
    for (let k = 0; k <= 300; k++) { const t = k / 100; let r = 1.0; for (let i = 0; i < 2; i++) if (t <= pts[i + 1][0]) { const [ta, pa, va] = pts[i], [tb, pb, vb] = pts[i + 1], T = tb - ta, u = (t - ta) / T; r = (2 * u ** 3 - 3 * u ** 2 + 1) * pa + (u ** 3 - 2 * u ** 2 + u) * T * va + (-2 * u ** 3 + 3 * u ** 2) * pb + (u ** 3 - u ** 2) * T * vb; break; }
      x += Math.min(1, 0.01 / 0.02) * (r - x); tt.push(t); ref.push(r); pos.push(x); } return { tt, ref, pos }; };
  const redraw = () => {
    p.draw = (P) => { const E = [['unconfigured', 'inactive', 'configure', 1], ['inactive', 'unconfigured', 'cleanup', 1], ['inactive', 'active', 'activate', 1], ['active', 'inactive', 'deactivate', 1]];
      for (const [a, b, nm] of E) { const [x0, y0] = POS[a], [x1, y1] = POS[b], L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * 0.35, ny = ux * 0.35, gx = ux * 1.75, gy = uy * 0.6;
        P.arrow(x0 + gx + nx, y0 + gy + ny, x1 - gx + nx, y1 - gy + ny, C.dim, 1.4); P.text(nm, (x0 + x1) / 2 + 2.2 * nx + (uy ? 0.2 * Math.sign(nx) : 0), (y0 + y1) / 2 + 1.6 * ny - 0.1, C.fog, uy ? (nx > 0 ? 'left' : 'right') : 'center'); }
      for (const [st, [x, y]] of Object.entries(POS)) { rect(P, x - 1.6, y - 0.45, x + 1.6, y + 0.45, st === s.jtc ? 'rgba(198,255,26,.18)' : C.bg, st === s.jtc ? C.lime : C.rule2); P.text(st, x, y - 0.1, st === s.jtc ? C.lime : C.bone, 'center'); } };
    q.draw = (P) => { P.axes({ xl: 'time since goal (s)', yl: 'rad' }); if (s.sent) { const { tt, ref, pos } = traj(); P.line(tt, ref, C.dim, 1.5, [4, 4]); P.line(tt, pos, C.lime, 2); } else P.text('no trajectory running', 1.5, 0.4, C.dim, 'center'); };
    p.redraw(); q.redraw();
    read.innerHTML = `joint_trajectory_controller ${s.jtc === 'active' ? ok('active') : sp(C.warn, s.jtc)} · arm_position_controller ${s.other} · ${s.msg}`;
  };
  const trig = (t) => () => { const n = TR[`${s.jtc}|${t}`]; if (n === 'active' && s.other === 'active') s.msg = bad('activate refused: interfaces already claimed by arm_position_controller'); else if (!n) s.msg = bad(`${t} refused in state ${s.jtc}`); else { s.msg = `${s.jtc} → ${n}`; s.jtc = n; if (n !== 'active') s.sent = false; } redraw(); };
  const row = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' });
  row.append(button('Configure', trig('configure'), 'cs-configure'), button('Activate', trig('activate'), 'cs-activate'), button('Deactivate', trig('deactivate'), 'cs-deactivate'), button('Cleanup', trig('cleanup'), 'cs-cleanup'),
    button('Toggle second controller', () => { if (s.other === 'active') { s.other = 'inactive'; s.msg = 'second controller deactivated; its interfaces are free'; } else if (s.jtc === 'active') s.msg = bad('refused: jointN/position already claimed by the trajectory controller'); else { s.other = 'active'; s.msg = ok('second controller active; it now owns the joints'); } redraw(); }, 'cs-other'),
    button('Send trajectory', () => { if (s.jtc !== 'active') s.msg = bad('goal rejected: controller not active'); else { s.sent = true; const { ref, pos } = traj(), e = Math.max(...ref.map((r, i) => Math.abs(r - pos[i]))), fe = Math.abs(ref[300] - pos[300]); s.msg = `goal accepted · max tracking error ${e.toFixed(3)} rad (20 ms mock lag) · ${fe < 0.01 ? ok('result SUCCESSFUL') : bad('goal tolerance violated')}`; } redraw(); }, 'cs-send'));
  ctrls.append(row); redraw();
};

// ---- p18-l15: simulated 2-link arm ----
function armSim({ kp, kd, dt, integ, gcomp, goal = [0.8, -0.6], T = 3 }) {
  const m1 = 1.0, m2 = 0.6, l1 = 0.4, l2 = 0.3, g = 9.81; let q = [0, 0], qd = [0, 0]; const ts = [], q1 = [], q2 = [], E = [];
  const G = (q) => { const c1 = Math.cos(q[0]), c12 = Math.cos(q[0] + q[1]); return [(m1 + m2) * g * l1 * c1 + m2 * g * l2 * c12, m2 * g * l2 * c12]; };
  const n = Math.round(T / dt); let blew = false;
  for (let k = 0; k <= n; k++) {
    if (k % Math.max(1, Math.round(0.01 / dt)) === 0) { ts.push(k * dt); q1.push(q[0]); q2.push(q[1]); }
    const c2 = Math.cos(q[1]), s2 = Math.sin(q[1]), M = [[m1 * l1 ** 2 + m2 * (l1 ** 2 + l2 ** 2 + 2 * l1 * l2 * c2), m2 * (l2 ** 2 + l1 * l2 * c2)], [m2 * (l2 ** 2 + l1 * l2 * c2), m2 * l2 ** 2]];
    const Cv = [-m2 * l1 * l2 * s2 * (2 * qd[0] * qd[1] + qd[1] ** 2), m2 * l1 * l2 * s2 * qd[0] ** 2], Gq = G(q);
    const tau = [0, 1].map((i) => kp * (goal[i] - q[i]) - kd * qd[i] + (gcomp ? Gq[i] : 0)), rhs = [0, 1].map((i) => tau[i] - Cv[i] - Gq[i]);
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0], qdd = [(M[1][1] * rhs[0] - M[0][1] * rhs[1]) / det, (-M[1][0] * rhs[0] + M[0][0] * rhs[1]) / det];
    if (integ === 'semi') { qd = qd.map((v, i) => v + dt * qdd[i]); q = q.map((v, i) => v + dt * qd[i]); } else { const qo = [...q]; q = q.map((v, i) => v + dt * qd[i]); qd = qd.map((v, i) => v + dt * qdd[i]); void qo; }
    if (!q.every(Number.isFinite) || Math.abs(q[0]) > 50) { blew = true; break; }
  }
  return { q, ts, q1, q2, blew, goal };
}
const fk2 = (q) => [0.4 * Math.cos(q[0]) + 0.3 * Math.cos(q[0] + q[1]), 0.4 * Math.sin(q[0]) + 0.3 * Math.sin(q[0] + q[1])];
W.simarm = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kp: 60, kd: 8, dt: 1, integ: 'semi', gcomp: true };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 1, maxH: 320, x: [-0.75, 0.75], y: [-0.75, 0.75], equal: true, label: 'Arm after 3 s of simulation (solid) and the kinematic target (dashed)' });
  const q = new Plot(d2, { aspect: 0.8, maxH: 320, x: [0, 3], y: [-1.5, 1.5], label: 'Joint angles over time' });
  const redraw = () => {
    const R = armSim({ ...s, dt: s.dt / 1000 }), ee = fk2(R.q), tg = fk2(R.goal), err = Math.hypot(ee[0] - tg[0], ee[1] - tg[1]);
    const pts = (qq) => { const e = [0.4 * Math.cos(qq[0]), 0.4 * Math.sin(qq[0])]; return [[0, 0], e, fk2(qq)]; };
    p.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'z (m)' }); const T = pts(R.goal); P.line(T.map((v) => v[0]), T.map((v) => v[1]), C.dim, 2, [5, 4]);
      if (!R.blew) { const A = pts(R.q); P.line(A.map((v) => v[0]), A.map((v) => v[1]), C.lime, 5); A.forEach(([x, y]) => P.dot(x, y, C.bone, 3.5)); } else P.text('simulation diverged', 0, 0.5, C.bad, 'center'); };
    q.draw = (P) => { P.axes({ xl: 't (s)', yl: 'rad' }); P.line([0, 3], [0.8, 0.8], C.dim, 1, [4, 4]); P.line([0, 3], [-0.6, -0.6], C.dim, 1, [4, 4]); P.line(R.ts, R.q1.map((v) => clamp(v, -1.5, 1.5)), C.lime, 1.8); P.line(R.ts, R.q2.map((v) => clamp(v, -1.5, 1.5)), C.signal, 1.8); };
    p.redraw(); q.redraw();
    read.innerHTML = R.blew ? bad(`diverged: ${s.integ === 'semi' ? 'semi-implicit' : 'explicit'} Euler at dt = ${s.dt} ms with kp ${s.kp}, kd ${s.kd}`) : `tool (${ee.map((v) => v.toFixed(4)).join(', ')}) m vs kinematics (${tg.map((v) => v.toFixed(4)).join(', ')}) m · error ${err < 1e-3 ? ok((1000 * err).toFixed(2) + ' mm') : bad((1000 * err).toFixed(1) + ' mm')}${s.gcomp ? '' : ' · ' + sp(C.warn, 'no gravity compensation: the arm sags')} · ${sp(C.lime, 'q1')} ${sp(C.signal, 'q2')}`;
  };
  ctrls.append(slider('kp (N m/rad)', { min: 5, max: 400, step: 5, value: s.kp }, (v) => { s.kp = v; redraw(); }),
    slider('kd (N m s/rad)', { min: 0, max: 30, step: 0.5, value: s.kd, fmt: (v) => v.toFixed(1) }, (v) => { s.kd = v; redraw(); }),
    select('Time step', [['1', '1 ms'], ['5', '5 ms'], ['10', '10 ms'], ['20', '20 ms']], String(s.dt), (v) => { s.dt = +v; redraw(); }, 'sa-dt'),
    select('Integrator', [['semi', 'semi-implicit Euler'], ['explicit', 'explicit Euler']], s.integ, (v) => { s.integ = v; redraw(); }, 'sa-int'),
    toggle('Gravity compensation', s.gcomp, (v) => { s.gcomp = v; redraw(); }, { id: 'sa-g' }));
  redraw();
};

// ---- p18-l16: micro-ROS link budget ----
W.microros = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { rate: 100, baud: 115200, ber: 2 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 0.2], y: [0, 3], label: 'First 200 ms on the serial line: frames (green), rejected by CRC (red)' });
  const redraw = () => {
    const fb = 26, cap = s.baud / 10, need = s.rate * fb, load = need / cap, r = rng(5), sent = Math.round(s.rate * 10), fit = Math.min(sent, Math.floor(cap * 10 / fb));
    let badN = 0; const frames = [];
    for (let k = 0; k < fit; k++) { const b = r() < s.ber / 100; if (b) badN++; const t = load <= 1 ? k / s.rate : k * fb / cap; if (t < 0.2) frames.push([t, b]); }
    const pub = fit - badN, w = fb / cap;
    p.draw = (P) => { P.axes({ xl: 'time (s)', yl: '' }); P.text('UART', 0.002, 2.4, C.fog); for (const [t, b] of frames) rect(P, t, 1.4, t + w, 2.2, b ? C.bad : C.lime, null);
      rect(P, 0, 0.3, 0.2 * Math.min(load, 1), 0.8, load > 1 ? C.bad : load > 0.7 ? C.warn : C.signal, null); rect(P, 0, 0.3, 0.2, 0.8, null, C.dim); P.text(`link load ${(100 * load).toFixed(1)} %`, 0.004, 0.95, C.bone); };
    p.redraw();
    read.innerHTML = `${sent} frames of ${fb} bytes wanted in 10 s · link capacity ${cap.toFixed(0)} bytes/s · load ${load > 1 ? bad((100 * load).toFixed(1) + ' %: the link cannot keep up') : ok((100 * load).toFixed(1) + ' %')} · ${badN} rejected by CRC · ${pub} published · rate in the graph ${(pub / 10).toFixed(1)} Hz of ${s.rate} Hz (illustrative error model)`;
  };
  ctrls.append(slider('Publish rate (Hz)', { min: 10, max: 1000, step: 10, value: s.rate }, (v) => { s.rate = v; redraw(); }),
    select('Baud rate', [['115200', '115200'], ['460800', '460800'], ['921600', '921600']], String(s.baud), (v) => { s.baud = +v; redraw(); }, 'mr-baud'),
    slider('Corrupted frames (%)', { min: 0, max: 10, step: 0.5, value: s.ber, fmt: (v) => v.toFixed(1) }, (v) => { s.ber = v; redraw(); }));
  redraw();
};

// ---- p18-l17: rosbag timeline scrubber ----
let BAG = null;
function bagData() {
  if (BAG) return BAG; const r = rng(21), g = gauss(r), ev = [];
  for (let k = 0; k < 500; k++) { const t = k / 100; ev.push({ recv: t - 2e-3 * Math.log(1 - r()), topic: 'imu', stamp: t, v: 0.4 * Math.sin(0.8 * t) + 0.01 * g() }); }
  for (let k = 0; k < 100; k++) { const t = k / 20; ev.push({ recv: t - 2e-3 * Math.log(1 - r()), topic: 'odom', stamp: t, v: 0.5 + 0.1 * Math.sin(t) }); }
  ev.sort((a, b) => a.recv - b.recv); return (BAG = ev);
}
function deadReckon(ev, clock, upto) { let x = 0, y = 0, th = 0, v = 0, tl = null; const path = [[0, 0]];
  for (const e of ev) { const c = clock(e); if (e.recv > upto) break; if (e.topic === 'odom') { v = e.v; continue; } if (tl !== null) { const dt = c - tl; x += v * Math.cos(th) * dt; y += v * Math.sin(th) * dt; th += e.v * dt; } tl = c; path.push([x, y]); }
  return { x, y, th, path }; }
W.bagscrub = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: 5, rate: 1, clock: 'stamp' };
  const [d1, d2] = twoUp(body);
  const p = new Plot(d1, { aspect: 0.7, maxH: 300, x: [0, 5], y: [0, 3], label: 'Messages in the bag by receive time; the cursor is the playback position' });
  const q = new Plot(d2, { aspect: 0.9, maxH: 300, x: [-0.2, 2.4], y: [-0.2, 2.0], equal: true, label: 'Dead-reckoning pose: live (dashed) and replay (solid)' });
  const redraw = () => {
    const ev = bagData(), n = ev.filter((e) => e.recv <= s.t).length, t0 = ev[0].recv;
    const live = deadReckon(ev, (e) => e.stamp, s.t), rep = deadReckon(ev, s.clock === 'stamp' ? (e) => e.stamp : (e) => t0 + (e.recv - t0) / s.rate, s.t);
    const liveFull = deadReckon(ev, (e) => e.stamp, 99), same = Math.abs(rep.x - live.x) + Math.abs(rep.y - live.y) + Math.abs(rep.th - live.th) < 1e-12;
    p.draw = (P) => { P.axes({ xl: 'bag time (s)', yl: '' }); P.text('/imu', 0.05, 2.35, C.lime); P.text('/odom', 0.05, 1.05, C.signal);
      for (const e of ev) { const yy = e.topic === 'imu' ? 1.7 : 0.4; P.line([e.recv, e.recv], [yy, yy + 0.5], e.recv <= s.t ? (e.topic === 'imu' ? C.lime : C.signal) : C.rule2, 1); }
      P.line([s.t, s.t], [0, 3], C.warn, 2); };
    q.draw = (P) => { P.axes({ xl: 'x (m)', yl: 'y (m)' }); P.line(liveFull.path.map((v) => v[0]), liveFull.path.map((v) => v[1]), C.dim, 1.4, [4, 4]); P.line(rep.path.map((v) => v[0]), rep.path.map((v) => v[1]), same ? C.lime : C.bad, 2); P.dot(rep.x, rep.y, C.warn, 4); };
    p.redraw(); q.redraw();
    read.innerHTML = `simulated bag: ${n} of ${ev.length} messages played · replay at ×${s.rate} wall-clock ${(s.t / s.rate).toFixed(2)} s · pose (${rep.x.toFixed(4)}, ${rep.y.toFixed(4)}) m, heading ${rep.th.toFixed(4)} rad · ${same ? ok('identical to the live run') : bad(`differs from live (${live.x.toFixed(4)}, ${live.y.toFixed(4)})`)} · ${s.clock === 'stamp' ? 'node uses header stamps' : 'node uses its playback clock'}`;
  };
  ctrls.append(slider('Playback position (s)', { min: 0, max: 5, step: 0.05, value: s.t, fmt: (v) => v.toFixed(2) }, (v) => { s.t = v; redraw(); }),
    select('Rate', [['0.5', '×0.5'], ['1', '×1'], ['2', '×2'], ['4', '×4']], String(s.rate), (v) => { s.rate = +v; redraw(); }, 'bs-rate'),
    select('Node clock', [['stamp', 'header stamps'], ['wall', 'playback (wall) clock']], s.clock, (v) => { s.clock = v; redraw(); }, 'bs-clock'));
  redraw();
};

export default W;
