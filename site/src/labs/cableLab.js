// Lab 05: a room-scale cable robot (four cables, a pivot, a gripper on a 0.5 m pole). Used on the home page and inline in the
// Phase 21 lessons. This module has no three.js: the controls, tension bars, capacity map and scope work on their own, and the
// 3D view (cable3d.js) is loaded on demand. The physics lives in sim/cable.js and is unit-tested there.
import { CableSim, capacityGrid, capacity, G } from '../sim/cable.js';
import { register, reducedMotion } from '../loop.js';
import { Scope } from '../scope.js';
import { h, labShell, bindPause, toggle, slider, select, group, row, button, setBadge } from '../ui.js';

const ROOMS = { stringman: [7, 7, 3, 0.5], small: [4, 3.5, 2.5, 0.5], desk: [0.8, 0.6, 0.5, 0.1] };
const LIME = [198, 255, 26], CORAL = [255, 107, 91], AMBER = [255, 181, 71], DIM = [70, 82, 40];
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
// colour of a cable from its tension: dim at zero, lime as it carries load, amber near the limit, coral when slack or over it
export function tensionRGB(t, limit, slack) {
  if (slack || t > limit + 1e-9) return CORAL;
  const k = Math.max(0, Math.min(1, t / limit));
  return k < 0.8 ? mix(DIM, LIME, k / 0.8) : mix(LIME, AMBER, (k - 0.8) / 0.2);
}
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '∞');

export function cableLab(root, opts = {}) {
  const embedded = !!opts.embedded, id = opts.id || 'cable', preset = opts.preset || 'room';
  const sim = new CableSim();
  const L = labShell({
    id, num: '05', title: 'Cable robot: four lines, one gripper',
    blurb: 'Four winches at the top corners of a room hold a pivot; the gripper hangs 0.5 m below it on a pole, like Neufangled’s open-source Stringman. Drag the target and watch the inverse kinematics, the tension in each line, the payload map and the swing. Push the gripper hard enough and every motor relaxes at 28 N.',
    interact: true,
    lessons: [['p21-l02', 'Geometry and IK'], ['p21-l03', 'Tension distribution'], ['p21-l04', 'Workspace and capacity'], ['p21-l07', 'Swing and control'], ['p21-l08', 'Safety']],
  });
  L.sec.classList.add('lab-cable'); if (embedded) L.sec.classList.add('lab-embedded');
  root.append(L.sec);
  const scope = new Scope(L.scope, [
    { label: 'line 1', color: '#c6ff1a', range: [0, 40], width: 1.3 }, { label: 'line 2', color: '#6fd3ff', range: [0, 40], width: 1.3 },
    { label: 'line 3', color: '#ffb547', range: [0, 40], width: 1.3 }, { label: 'line 4', color: '#eceee6', range: [0, 40], width: 1.3 },
    { label: 'swing ×10 [°]', color: '#ff6b5b', range: [0, 400], width: 1.6 },
  ]);
  L.note.textContent = 'Tensions 0–40 N on the scope. Tap the map or the room to place the gripper; on a phone switch on Drag mode to drag. Arrow keys move it, Page Up and Page Down change height.';

  // ---- tension bars and capacity map, under the 3D view ----
  const bars = h('div', { class: 'cable-bars', 'data-testid': `lab-${id}-bars` });
  const barEls = [0, 1, 2, 3].map((i) => { const fill = h('i'); const val = h('b'); const len = h('span', { class: 'len' }); const r = h('div', { class: 'cable-bar' }, h('span', { class: 'nm' }, `Line ${i + 1}`), h('span', { class: 'track' }, fill, h('span', { class: 'lim' })), val, len); bars.append(r); return { r, fill, val, len }; });
  const mapCv = h('canvas', { role: 'img', 'aria-label': 'Top view of the room: payload capacity map at the pivot height, with the gripper position', 'data-testid': `lab-${id}-map` });
  const mapNote = h('p', { class: 'cable-map-note' });
  const mapBox = h('div', { class: 'cable-map' }, mapCv, mapNote);
  const extra = h('div', { class: 'cable-extra' }, bars, mapBox);
  L.note.before(extra);

  // ---- controls ----
  const c = sim.c; let auto = preset === 'ik' || preset === 'swing', autoT = 0, showMap = preset !== 'ik';
  const S = {};
  const setS = (el, v, f) => { const inp = el.querySelector('input'); inp.value = v; el.querySelector('output').textContent = f(v); };
  const lim = () => sim.limits();
  const f2 = (v) => v.toFixed(2) + ' m';
  S.x = slider('Gripper x', { min: -3.5, max: 3.5, step: 0.01, value: 0, fmt: f2, id: `${id}-x` }, (v) => setT([v, sim.target[1], sim.target[2]]));
  S.y = slider('Gripper y', { min: -3.5, max: 3.5, step: 0.01, value: 0, fmt: f2, id: `${id}-y` }, (v) => setT([sim.target[0], v, sim.target[2]]));
  S.z = slider('Gripper height', { min: 0, max: 2.5, step: 0.01, value: 1, fmt: f2, id: `${id}-z` }, (v) => setT([sim.target[0], sim.target[1], v]));
  const tAuto = toggle('Auto tour', auto, (v) => { auto = v; }, { id: `${id}-auto` });
  S.w = slider('Room width', { min: 0.5, max: 10, step: 0.1, value: c.w, fmt: f2, id: `${id}-w` }, (v) => room(v, c.d, c.h));
  S.d = slider('Room depth', { min: 0.5, max: 10, step: 0.1, value: c.d, fmt: f2, id: `${id}-d` }, (v) => room(c.w, v, c.h));
  S.h = slider('Anchor height', { min: 0.4, max: 4, step: 0.05, value: c.h, fmt: f2, id: `${id}-h` }, (v) => room(c.w, c.d, v));
  const roomSel = select('Room', [['stringman', '7 × 7 × 3 m (Stringman’s example room)'], ['small', '4 × 3.5 × 2.5 m bedroom'], ['desk', '0.8 × 0.6 × 0.5 m desk frame'], ['custom', 'Custom (use the sliders)']], 'stringman', (v) => { if (ROOMS[v]) applyRoom(v); }, `${id}-room`);
  S.m = slider('Payload incl. gripper', { min: 0.05, max: 4, step: 0.05, value: c.mass, fmt: (v) => v.toFixed(2) + ' kg', id: `${id}-mass` }, (v) => { c.mass = v; changed(true); });
  S.t = slider('Tension limit', { min: 2, max: 60, step: 0.5, value: c.tLimit, fmt: (v) => v.toFixed(1) + ' N', id: `${id}-limit` }, (v) => { c.tLimit = v; changed(true); });
  S.l = slider('Pole length', { min: 0.05, max: 1, step: 0.01, value: c.pole, fmt: f2, id: `${id}-pole` }, (v) => { sim.setPole(v); sim.setTarget(...sim.target); changed(true); });
  S.p = slider('Push on the gripper (x)', { min: 0, max: 40, step: 0.5, value: 0, fmt: (v) => v.toFixed(1) + ' N', id: `${id}-push` }, (v) => { c.push = v; changed(false); });
  const tDamp = toggle('Swing damping', c.damping, (v) => (c.damping = v), { id: `${id}-damp` });
  const tRelax = toggle('Relax at the limit', c.relax, (v) => { c.relax = v; changed(false); }, { id: `${id}-relax` });
  const tMap = toggle('Capacity map', showMap, (v) => { showMap = v; heatKey = ''; changed(true); }, { id: `${id}-mapt` });
  L.controls.append(
    group('Gripper target', S.x, S.y, S.z, row(tAuto, button('Centre', () => { auto = false; tAuto.set(false); setT([0, 0, (c.h - c.pole) * 0.4]); }, `${id}-centre`))),
    group('Load and limits', S.m, S.t, S.l),
    group('Swing and safety', row(tDamp, button('Kick the swing', () => { sim.kick(0.5); if (item.paused) preview(); }, `${id}-kick`)), S.p, row(tRelax, button('Re-arm', () => { sim.rearm(); changed(false); }, `${id}-rearm`))),
    group('Room', roomSel, S.w, S.d, S.h, row(tMap)),
  );
  function setT(t) { auto = false; tAuto.set(false); sim.setTarget(...t); syncTarget(); changed(false); }
  function syncTarget() { const t = sim.target; setS(S.x, t[0], f2); setS(S.y, t[1], f2); setS(S.z, t[2], f2); }
  function syncRanges() {
    const l = lim();
    for (const [k, r] of [['x', l.x], ['y', l.y], ['z', l.z]]) { const inp = S[k].querySelector('input'); inp.min = r[0]; inp.max = r[1]; inp.step = Math.max(0.005, (r[1] - r[0]) / 400); }
    syncTarget();
  }
  function room(w, d, hh) { roomSel.querySelector('select').value = 'custom'; sim.setRoom(w, d, hh); syncRanges(); view?.setRoom(); changed(true); }
  function applyRoom(k) {
    const [w, d, hh, pole] = ROOMS[k]; roomSel.querySelector('select').value = k;
    sim.setRoom(w, d, hh); sim.setPole(pole);
    if (k === 'desk') { c.mass = 0.1; c.tLimit = 5; c.vmax = 0.2; } else { c.vmax = 0.4; if (c.tLimit === 5) c.tLimit = 28; if (c.mass === 0.1) c.mass = 1; }
    setS(S.w, w, f2); setS(S.d, d, f2); setS(S.h, hh, f2); setS(S.l, pole, f2); setS(S.m, c.mass, (v) => v.toFixed(2) + ' kg'); setS(S.t, c.tLimit, (v) => v.toFixed(1) + ' N');
    const pushMax = k === 'desk' ? 8 : 40; S.p.querySelector('input').max = pushMax;
    sim.reset([0, 0, Math.max(0.03, (hh - pole) * 0.45)]); syncRanges(); view?.setRoom(); changed(true);
  }

  // ---- capacity map (offscreen 40 x 40, shared with the 3D slice plane) ----
  const NX = 40, heat = document.createElement('canvas'); heat.width = NX; heat.height = NX;
  let heatKey = '', heatGrid = null, heatMax = 0, sliceZ = 0, meanCap = 0, meanKey = '';
  function updateHeat() {
    sliceZ = sim.target[2] + c.pole;
    const key = [c.w, c.d, c.h, c.mass, c.tLimit, sliceZ.toFixed(2), showMap].join('|');
    if (key === heatKey) return false; heatKey = key;
    heatGrid = capacityGrid(sim.anchors, c.w, c.d, sliceZ, c.tLimit, NX, NX);
    heatMax = 0; let heatMin = Infinity; for (const v of heatGrid) if (Number.isFinite(v)) { heatMax = Math.max(heatMax, v); heatMin = Math.min(heatMin, v); }
    const g = heat.getContext('2d'), img = g.createImageData(NX, NX);
    for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) {
      const v = heatGrid[j * NX + i], o = ((NX - 1 - j) * NX + i) * 4; // row 0 of the image is +y (top of the map)
      let col, a;
      if (v < c.mass) { col = CORAL; a = 165; } else { const k = Math.min(1, Math.max(0, (v - heatMin) / Math.max(1e-6, heatMax - heatMin))); col = mix([30, 44, 6], LIME, 0.15 + 0.85 * k); a = 230; }
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = showMap ? a : 0;
    }
    g.putImageData(img, 0, 0);
    const mk = [c.w, c.d, c.h, c.tLimit, c.pole].join('|');
    if (mk !== meanKey) { meanKey = mk; let s = 0, n = 0; const zl = lim().z; for (let k = 0; k < 8; k++) { const z = zl[0] + ((zl[1] - zl[0]) * (k + 0.5)) / 8 + c.pole; for (let j = 0; j < 14; j++) for (let i = 0; i < 14; i++) { const v = capacity(sim.anchors, [-c.w / 2 + (c.w * (i + 0.5)) / 14, -c.d / 2 + (c.d * (j + 0.5)) / 14, z], c.tLimit); if (Number.isFinite(v)) { s += v; n++; } } } meanCap = n ? s / n : 0; }
    return true;
  }
  function drawMap(st) {
    const dpr = Math.min(2, devicePixelRatio || 1), W = Math.max(120, mapBox.clientWidth), aspect = c.d / c.w, H = Math.round(Math.min(260, W * aspect));
    const Wd = Math.round(H / aspect);
    if (mapCv.width !== Math.round(Wd * dpr) || mapCv.height !== Math.round(H * dpr)) { mapCv.width = Math.round(Wd * dpr); mapCv.height = Math.round(H * dpr); mapCv.style.width = Wd + 'px'; mapCv.style.height = H + 'px'; }
    const g = mapCv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wd, H);
    g.fillStyle = '#0d0e0c'; g.fillRect(0, 0, Wd, H);
    g.imageSmoothingEnabled = true; if (showMap) g.drawImage(heat, 0, 0, Wd, H);
    g.strokeStyle = '#353a2d'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, Wd - 1, H - 1);
    const sx = (x) => ((x + c.w / 2) / c.w) * Wd, sy = (y) => H - ((y + c.d / 2) / c.d) * H;
    const piv = st.pivot;
    sim.anchors.forEach((A, i) => { const col = tensionRGB(st.t[i], c.tLimit, st.slack[i] || st.relaxed); g.strokeStyle = css(col); g.lineWidth = 2; g.beginPath(); g.moveTo(sx(A[0]), sy(A[1])); g.lineTo(sx(piv[0]), sy(piv[1])); g.stroke(); g.fillStyle = '#eceee6'; g.font = '600 11px "JetBrains Mono Variable", monospace'; g.fillText(String(i + 1), Math.min(Wd - 12, Math.max(4, sx(A[0]) + (A[0] < 0 ? 5 : -12))), Math.min(H - 5, Math.max(13, sy(A[1]) + (A[1] < 0 ? -5 : 14)))); });
    g.strokeStyle = '#c6ff1a'; g.lineWidth = 2; g.beginPath(); g.arc(sx(st.target[0]), sy(st.target[1]), 9, 0, 7); g.stroke();
    g.fillStyle = st.relaxed ? '#ff6b5b' : '#eceee6'; g.beginPath(); g.arc(sx(st.gripper[0]), sy(st.gripper[1]), 4.5, 0, 7); g.fill();
    const here = capacity(sim.anchors, piv, c.tLimit);
    mapNote.innerHTML = showMap
      ? `Pivot height <b>${fmt(sliceZ)} m</b>. Green cells hold ${fmt(c.mass)} kg with every line under ${fmt(c.tLimit, 1)} N, brighter holding more (up to ${fmt(heatMax, 1)} kg); coral cells cannot. Here: <b>${fmt(here)} kg</b>. Mean over the room: <b>${fmt(meanCap)} kg</b>.`
      : `Top view. Capacity here: <b>${fmt(here)} kg</b> at ${fmt(c.tLimit, 1)} N per line.`;
    L.sec.dataset.capHere = here.toFixed(3); L.sec.dataset.capMean = meanCap.toFixed(3);
  }

  // ---- picking on the map ----
  let mapDrag = false;
  const mapPick = (e) => { const r = mapCv.getBoundingClientRect(); const x = -c.w / 2 + ((e.clientX - r.left) / r.width) * c.w, y = c.d / 2 - ((e.clientY - r.top) / r.height) * c.d; setT([x, y, sim.target[2]]); };
  let down = null;
  mapCv.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; if (e.pointerType !== 'touch' || L.sec.classList.contains('interacting')) { mapDrag = true; mapCv.setPointerCapture(e.pointerId); mapPick(e); } });
  mapCv.addEventListener('pointermove', (e) => { if (mapDrag) mapPick(e); });
  mapCv.addEventListener('pointerup', (e) => { if (!mapDrag && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 10) mapPick(e); mapDrag = false; down = null; });
  mapCv.addEventListener('pointercancel', () => { mapDrag = false; down = null; });
  let interactive = false;
  L.interactBtn.addEventListener('click', () => { interactive = !interactive; L.sec.classList.toggle('interacting', interactive); L.view3d.classList.toggle('interacting', interactive); L.interactBtn.setAttribute('aria-pressed', String(interactive)); L.interactBtn.textContent = interactive ? 'Done' : 'Drag mode'; });

  // ---- UI update, throttled to ~12 Hz for the DOM; the 3D view renders every frame ----
  let lastUI = -1, view = null;
  function updateUI(st, force) {
    const now = performance.now(); if (!force && now - lastUI < 80) return; lastUI = now;
    const lt = c.tLimit;
    st.t.forEach((t, i) => { const b = barEls[i], col = tensionRGB(t, lt, st.slack[i] || st.relaxed); b.fill.style.width = `${Math.min(100, (100 * Math.max(0, t)) / (lt * 1.25))}%`; b.fill.style.background = css(col); b.val.textContent = st.relaxed ? 'relaxed' : st.slack[i] ? 'slack' : `${t.toFixed(1)} N`; b.val.style.color = css(col); b.len.textContent = `${st.L[i].toFixed(3)} m`; b.r.dataset.state = st.relaxed ? 'relaxed' : st.slack[i] ? 'slack' : t > lt ? 'over' : 'ok'; });
    bars.style.setProperty('--lim', `${100 / 1.25}%`);
    const deg = (st.swing * 180) / Math.PI;
    if (st.relaxed) setBadge(L.badge, st.onFloor ? 'RELAXED: ON THE FLOOR' : 'RELAXED: LINES PAY OUT', 'bad');
    else if (st.reason === 'slack') setBadge(L.badge, 'SLACK LINE', 'bad');
    else if (st.reason === 'over' || st.peak > lt) setBadge(L.badge, 'OVER THE LIMIT', 'bad');
    else if (deg > 4) setBadge(L.badge, 'SWINGING', 'warn');
    else if (st.speed > 0.02) setBadge(L.badge, 'MOVING');
    else setBadge(L.badge, 'HOLDING');
    L.readouts.innerHTML = `pivot <b>(${st.pivot.map((v) => v.toFixed(2)).join(', ')})</b> swing <b>${deg.toFixed(1)}°</b> speed <b>${st.speed.toFixed(2)} m/s</b> Σt·u<sub>z</sub> <b>${(st.relaxed ? 0 : st.t.reduce((s, t, i) => s + t * sim.u[i][2], 0)).toFixed(2)} N</b> mg <b>${(c.mass * G).toFixed(2)} N</b>`;
    Object.assign(L.sec.dataset, { state: L.badge.dataset.state, peak: st.peak.toFixed(3), swing: deg.toFixed(3), relaxed: String(st.relaxed), lengths: st.L.map((v) => v.toFixed(4)).join(','), tensions: st.t.map((v) => v.toFixed(4)).join(','), reason: st.reason });
    updateHeat() && view?.heatChanged(); drawMap(st);
  }
  // when paused (or with reduced motion) the robot is shown at rest at the target, so sliders still answer immediately
  function preview() { const rel = sim.relaxed; if (!rel) sim.reset(sim.target); for (let k = 0; k < 3; k++) sim.step(1 / 60); const st = sim.state; updateUI(st, true); view?.update(st, 0); }
  function changed(heatToo) { if (heatToo) heatKey = ''; if (item.paused) preview(); else updateUI(sim.state, true); }

  const item = {
    el: L.sec, visible: false, sim, paused: false,
    tick(dt) {
      if (auto && !sim.relaxed) { autoT += dt; const l = lim(); const a = autoT * 0.11; sim.target = [l.x[1] * 0.72 * Math.sin(a * 2.1), l.y[1] * 0.72 * Math.sin(a * 1.3 + 0.6), l.z[0] + (l.z[1] - l.z[0]) * (0.35 + 0.3 * Math.sin(a * 0.7))]; if ((autoT * 4 | 0) % 2 === 0) syncTarget(); }
      sim.step(dt);
      const st = sim.state;
      scope.push([...st.t.map((t) => (st.relaxed ? 0 : t)), Math.min(400, (st.swing * 1800) / Math.PI)]); scope.draw();
      updateUI(st);
      view?.update(st, dt);
    },
  };
  const setPaused = bindPause(L, item);
  L.pause.addEventListener('click', () => { if (item.paused) preview(); });

  if (preset === 'desk') applyRoom('desk'); else { syncRanges(); sim.reset(); }
  if (preset === 'tension') sim.reset([2.4, -1.1, 1.2]);
  if (preset === 'workspace') sim.reset([1.8, 1.2, 0.9]);
  if (preset === 'swing') { c.damping = false; tDamp.set(false); }
  if (preset === 'safety') sim.reset([0.8, 0.4, 0.9]);
  syncTarget(); updateUI(sim.state, true);

  // 3D view on demand
  import('./cable3d.js').then(({ cableView }) => {
    view = cableView(L.view3d, sim, { heat, getShowMap: () => showMap, onPick: (x, y) => setT([x, y, sim.target[2]]), onKey: (dx, dy, dz) => setT([sim.target[0] + dx, sim.target[1] + dy, sim.target[2] + dz]), isInteractive: () => interactive });
    view.update(sim.state, 0);
  }).catch((e) => console.warn('cable 3D view failed to load', e));

  register(item);
  if (embedded) { const iv = setInterval(() => { if (!L.sec.isConnected) { clearInterval(iv); item.unregister(); view?.dispose(); } }, 1500); }
  void setPaused; void reducedMotion;
  return item;
}
