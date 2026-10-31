// Take-apart viewer: a procedural three.js model in the middle, assemblies that glide out, an exploded view with
// leader-line labels, part cards, subsystem badges, a telemetry slot, a graph and a scripted operation log.
// Self-contained (three.js + OrbitControls + its own CSS) so other sites can copy this folder as is.
// A lab passes a spec: { id, num, title, blurb, code, assemblies, subsystems, graph, sequence, build, onTick, onEvent, onSeek }.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import './takeapart.css';

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const k of kids) if (k != null) e.append(k);
  return e;
};
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n, w = 2) => String(n).padStart(w, '0');
const clock = (t) => `${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}`;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 760px)').matches;

export function webglOk() {
  if (new URLSearchParams(location.search).has('nowebgl')) return false;
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}

// Materials: matte panels over dark metallic internals. Colours come from the spec's theme so each site can match its tokens.
export function materials(theme) {
  const accent = new THREE.Color(theme.accent);
  return {
    panel: () => new THREE.MeshPhysicalMaterial({ color: theme.panel ?? 0xd9dcd2, roughness: 0.62, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.6 }),
    panelDark: () => new THREE.MeshPhysicalMaterial({ color: 0x2a2d27, roughness: 0.7, metalness: 0.1, clearcoat: 0.2, clearcoatRoughness: 0.7 }),
    metal: () => new THREE.MeshPhysicalMaterial({ color: 0xa9ada4, roughness: 0.28, metalness: 1.0, clearcoat: 0.15 }),
    steel: () => new THREE.MeshPhysicalMaterial({ color: 0x6d716a, roughness: 0.35, metalness: 1.0 }),
    dark: () => new THREE.MeshPhysicalMaterial({ color: 0x1a1c18, roughness: 0.45, metalness: 0.75, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    rubber: () => new THREE.MeshStandardMaterial({ color: 0x0b0c0a, roughness: 0.92, metalness: 0 }),
    pcb: () => new THREE.MeshStandardMaterial({ color: 0x14301f, roughness: 0.55, metalness: 0.2 }),
    chip: () => new THREE.MeshStandardMaterial({ color: 0x090a09, roughness: 0.35, metalness: 0.4 }),
    copper: () => new THREE.MeshPhysicalMaterial({ color: 0xc98a52, roughness: 0.3, metalness: 1.0 }),
    brass: () => new THREE.MeshPhysicalMaterial({ color: 0xc7a65a, roughness: 0.3, metalness: 1.0 }),
    accent: () => new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent.clone().multiplyScalar(0.12), roughness: 0.35, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    glass: () => new THREE.MeshPhysicalMaterial({ color: 0x0c1418, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    line: () => new THREE.MeshBasicMaterial({ color: accent }),
    hit: () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  };
}

const LOOP = new Set(); let looping = false, lastT = 0;
function frame(now) {
  const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now;
  if (!document.hidden) for (const it of LOOP) if (it.visible) { try { it.tick(dt); } catch (e) { console.warn('take-apart tick failed', e); LOOP.delete(it); } }
  requestAnimationFrame(frame);
}

export function takeApart(root, spec) {
  const id = spec.id;
  const href = spec.lessonHref || ((lid) => `#/learn/${lid}`); // how this site links to a lesson
  const theme = Object.assign({ accent: '#c6ff1a', danger: '#ff6b81', warn: '#ffb547', panel: 0xd9dcd2 }, spec.theme || {});
  const S = { exploded: false, explodeK: 1, labels: true, turntable: !reduced(), spin: 0.6, assembly: null, card: null, playing: !reduced(), t: 0, actions: 0, status: '', statusKind: '' };

  // ---------- DOM shell ----------
  const statusWord = h('b', { class: 'ta-status-word', 'data-testid': `ta-${id}-status`, role: 'status' }, '');
  const statusSub = h('span', { class: 'ta-status-sub' });
  const view = h('div', { class: 'ta-view', 'data-testid': `ta-${id}-3d` });
  const svg = svgEl('svg', { class: 'ta-leaders', 'aria-hidden': 'true' });
  const labelsEl = h('div', { class: 'ta-labels', 'aria-hidden': 'true' });
  const card = h('aside', { class: 'ta-card', hidden: '', 'data-testid': `ta-${id}-card`, 'aria-live': 'polite' });
  const azEl = h('span', { class: 'ta-az' });
  const hud = h('div', { class: 'ta-hud', 'aria-hidden': 'true' },
    h('i', { class: 'ta-reg tl' }), h('i', { class: 'ta-reg tr' }), h('i', { class: 'ta-reg bl' }), h('i', { class: 'ta-reg br' }), h('i', { class: 'ta-cross' }),
    h('span', { class: 'ta-hud-tl', text: `MODEL ${spec.code || id.toUpperCase()}` }), h('span', { class: 'ta-hud-tr', 'data-iso': '' }, 'ISOLATE · ALL'), azEl);
  const hint = h('span', { class: 'ta-hint', text: matchMedia('(pointer: coarse)').matches ? 'Drag to orbit · pinch to zoom · tap a part' : 'Drag to orbit · scroll to zoom · click a part' });
  const statusBox = h('div', { class: 'ta-status' }, h('span', { class: 'ta-micro', text: 'Operating mode' }), statusWord, statusSub);
  view.append(svg, labelsEl, hud, statusBox, hint, card);

  // left: assemblies + display
  const asmBtns = new Map();
  const asmWrap = h('div', { class: 'ta-chips' });
  const allBtn = h('button', { class: 'ta-chip', type: 'button', 'aria-pressed': 'true', 'data-testid': `ta-${id}-asm-all` }, 'All');
  allBtn.addEventListener('click', () => { act(); setAssembly(null); });
  asmWrap.append(allBtn);
  for (const a of spec.assemblies) {
    const b = h('button', { class: 'ta-chip', type: 'button', 'aria-pressed': 'false', 'data-testid': `ta-${id}-asm-${a.id}` }, a.label);
    b.addEventListener('click', () => { act(); setAssembly(S.assembly === a.id ? null : a.id); });
    asmBtns.set(a.id, b); asmWrap.append(b);
  }
  const tog = (label, on, key, fn) => { const b = h('button', { class: 'ta-chip', type: 'button', 'aria-pressed': String(on), 'data-testid': `ta-${id}-${key}` }, label); b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); fn(v); }); b.set = (v) => b.setAttribute('aria-pressed', String(v)); return b; };
  const tLabels = tog('Labels', S.labels, 'labels', (v) => { act(); S.labels = v; sec.dataset.labels = String(v); log(`Labels ${v ? 'on' : 'off'}`, 'op'); });
  const tExplode = tog('Exploded', S.exploded, 'explode', (v) => { act(); setExploded(v, true); });
  const tTurn = tog('Turntable', S.turntable, 'turntable', (v) => { S.turntable = v; if (controls) controls.autoRotate = v; });
  const rng = (label, min, max, step, value, key, fmt, fn) => {
    const out = h('output', { text: fmt(value) }); const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, 'data-testid': `ta-${id}-${key}` });
    inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); fn(+inp.value); });
    return h('label', { class: 'ta-range' }, h('span', { text: label }), out, inp);
  };
  const rExplode = rng('Explode distance', 0.3, 1.8, 0.01, S.explodeK, 'explode-k', (v) => `${Math.round(v * 100)} %`, (v) => { S.explodeK = v; if (!S.exploded) { S.exploded = true; tExplode.set(true); syncFlags(); } retarget(); });
  const rSpin = rng('Turntable speed', 0, 2, 0.05, S.spin, 'spin', (v) => `${v.toFixed(2)}×`, (v) => { S.spin = v; if (controls) controls.autoRotateSpeed = v; if (v > 0 && !S.turntable) { S.turntable = true; tTurn.set(true); if (controls) controls.autoRotate = true; } });
  const extra = h('div', { class: 'ta-extra' });
  const paneParts = h('section', { class: 'ta-pane', 'data-pane': 'parts', 'aria-label': 'Assemblies and display' },
    panelHead('Assemblies', pad(spec.assemblies.length)), asmWrap,
    panelHead('Display', '03'), h('div', { class: 'ta-chips' }, tLabels, tExplode, tTurn), rExplode, rSpin, extra);

  // right: subsystems + telemetry + graph + log
  const subRows = new Map();
  const subList = h('ol', { class: 'ta-subs' });
  spec.subsystems.forEach((s, i) => {
    const badge = h('span', { class: 'ta-badge', 'data-testid': `ta-${id}-badge-${s.id}` }, '…');
    const li = h('li', { 'data-sub': s.id }, h('span', { class: 'n', text: pad(i + 1) }), h('span', { class: 't' }, h('b', { text: s.name }), h('small', { text: s.sub || '' })), badge);
    li.addEventListener('click', () => { if (s.assembly) { act(); setAssembly(S.assembly === s.assembly ? null : s.assembly); } });
    subRows.set(s.id, { li, badge }); subList.append(li);
  });
  const telemetry = h('div', { class: 'ta-tele', 'data-testid': `ta-${id}-telemetry` });
  const graphCv = h('canvas', { class: 'ta-graph', 'aria-hidden': 'true' });
  const graphKey = h('div', { class: 'ta-graph-key' }, ...(spec.graph?.series || []).map((s) => h('span', {}, h('i', { style: `background:${s.color}` }), s.label)));
  const logList = h('ol', { class: 'ta-log', 'data-testid': `ta-${id}-log`, 'aria-live': 'off' });
  const paneSubs = h('section', { class: 'ta-pane', 'data-pane': 'subs', 'aria-label': 'Subsystems' }, panelHead('Subsystems', pad(spec.subsystems.length)), subList);
  const paneTele = h('section', { class: 'ta-pane', 'data-pane': 'tele', 'aria-label': 'Telemetry' }, panelHead(spec.telemetryTitle || 'Telemetry', 'LIVE'), telemetry,
    spec.graph ? h('div', { class: 'ta-graph-box' }, h('div', { class: 'ta-micro ta-graph-title', text: spec.graph.title }), graphCv, graphKey) : null, panelHead('Log', ''), logList);

  // bottom: operation log timeline
  const seq = spec.sequence;
  const playBtn = h('button', { class: 'ta-play', type: 'button', 'aria-label': 'Pause the sequence', 'data-testid': `ta-${id}-play`, 'aria-pressed': String(S.playing) });
  const scrub = h('input', { type: 'range', min: 0, max: seq.duration, step: 0.05, value: 0, 'aria-label': 'Operation log position', 'data-testid': `ta-${id}-scrub` });
  const ticks = h('div', { class: 'ta-ticks', 'aria-hidden': 'true' });
  seq.events.forEach((e) => { const k = h('i', { style: `left:${(100 * e.t) / seq.duration}%`, title: e.text }); ticks.append(k); });
  const evText = h('span', { class: 'ta-ev', 'data-testid': `ta-${id}-event` });
  const timeEl = h('span', { class: 'ta-time tnum' });
  const actEl = h('span', { class: 'ta-acts' });
  const oplog = h('div', { class: 'ta-oplog' },
    h('div', { class: 'ta-oplog-head' }, h('span', { class: 'ta-micro', html: '<i class="ta-dot"></i>Operation log' }), evText, h('span', { class: 'ta-micro', text: pad(seq.events.length) })),
    h('div', { class: 'ta-oplog-row' }, playBtn, h('div', { class: 'ta-scrub' }, ticks, scrub)),
    h('div', { class: 'ta-oplog-foot' }, timeEl, actEl));

  const tabs = h('div', { class: 'ta-tabs', role: 'tablist', 'aria-label': 'Panels' });
  const panes = [['parts', 'Parts', paneParts], ['subs', 'Systems', paneSubs], ['tele', 'Telemetry', paneTele]];
  panes.forEach(([k, label], i) => { const b = h('button', { class: 'ta-tab', type: 'button', role: 'tab', 'aria-selected': String(i === 0), 'data-testid': `ta-${id}-tab-${k}` }, label); b.addEventListener('click', () => selectTab(k)); tabs.append(b); });
  function selectTab(k) { tabs.querySelectorAll('.ta-tab').forEach((b, i) => b.setAttribute('aria-selected', String(panes[i][0] === k))); body.dataset.tab = k; }

  const left = h('div', { class: 'ta-col ta-left' }, paneParts);
  const right = h('div', { class: 'ta-col ta-right' }, paneSubs, paneTele);
  const center = h('div', { class: 'ta-center' }, view, oplog);
  const body = h('div', { class: 'ta-body', 'data-tab': 'parts' }, left, center, tabs, right);
  const links = h('div', { class: 'ta-links' }, h('span', { text: 'Lessons:' }), ...(spec.lessons || []).map(([lid, t]) => h('a', { href: href(lid), 'data-lesson': lid, text: t })));
  const sec = h('article', { class: `ta ${spec.cls ?? 'lab'} ta-${id}${spec.wide ? ' ta-wide' : ''}`, id: `lab-${id}`, 'data-testid': `lab-${id}`, 'aria-labelledby': `lab-${id}-title` },
    h('div', { class: 'lab-head' }, h('span', { class: 'lab-num', text: spec.numLabel || `Lab ${spec.num}` }), h('h3', { id: `lab-${id}-title`, text: spec.title }), h('p', { text: spec.blurb })),
    h('div', { class: 'ta-frame' },
      h('header', { class: 'ta-top' }, h('span', { class: 'ta-micro', text: spec.kicker || 'Take-apart · procedural model' }), h('span', { class: 'ta-micro ta-top-r', html: `<span>SIM <b class="tnum" data-clock>00:00</b></span><span>PARTS <b class="tnum" data-parts>0</b></span>` })),
      body),
    links);
  sec.style.setProperty('--ta-accent', theme.accent); sec.style.setProperty('--ta-danger', theme.danger); sec.style.setProperty('--ta-warn', theme.warn);
  if (spec.embedded) sec.classList.add('ta-embedded');
  root.append(sec);
  const clockEl = sec.querySelector('[data-clock]');
  function panelHead(t, n) { return h('h4', { class: 'ta-ph' }, h('span', { text: t }), h('small', { text: n })); }

  // ---------- log + status ----------
  const LOGMAX = 7;
  function log(text, kind = '') {
    const li = h('li', { class: kind ? 'k-' + kind : '' }, h('span', { class: 'tnum', text: clock(S.t) }), h('span', { text }));
    logList.prepend(li); while (logList.children.length > LOGMAX) logList.lastChild.remove();
  }
  function setStatus(word, kind = '', sub = '') {
    if (S.status === word && S.statusKind === kind && statusSub.textContent === sub) return;
    S.status = word; S.statusKind = kind; statusWord.textContent = word; statusSub.textContent = sub;
    statusBox.dataset.kind = kind; sec.dataset.status = word; statusWord.dataset.state = word;
  }
  function badge(sid, text, kind = '') { const r = subRows.get(sid); if (!r || (r.badge.textContent === text && r.badge.dataset.kind === kind)) return; r.badge.textContent = text; r.badge.dataset.kind = kind; }
  function act() { S.actions++; actEl.textContent = `${S.actions} operator action${S.actions === 1 ? '' : 's'}`; if (S.playing && spec.pauseOnAct !== false) setPlaying(false, 'Operator took over'); }

  // ---------- three.js ----------
  const parts = [], byMesh = new Map();
  const ok = webglOk();
  let renderer, scene, camera, controls, model = null, contact = null;
  const api = { THREE, sec, view, log, setStatus, badge, telemetry, extra, state: S, parts, setExploded, setAssembly, act, theme, graphPush, setPlaying };
  sec.dataset.exploded = 'false'; sec.dataset.assembly = 'all'; sec.dataset.labels = 'true';

  if (ok) {
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch { renderer = null; }
  }
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow() ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    view.prepend(renderer.domElement); view.dataset.webgl = 'on';
    scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5; pm.dispose();
    const cam = spec.camera;
    camera = new THREE.PerspectiveCamera(cam.fov || 38, 1, cam.near || 0.05, cam.far || 200);
    camera.position.set(...cam.pos); api.camera = camera;
    scene.add(new THREE.HemisphereLight(0xf4f6ee, 0x0a0b09, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.castShadow = true;
    const sm = narrow() ? 1024 : 2048; key.shadow.mapSize.set(sm, sm); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 5;
    const sb = cam.shadow || 6; Object.assign(key.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 0.1, far: sb * 6 });
    key.position.set(sb * 0.5, sb * 2, sb * 0.8); scene.add(key); scene.add(key.target);
    const rim = new THREE.DirectionalLight(new THREE.Color(theme.accent), 0.5); rim.position.set(-sb, sb * 0.6, -sb); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5); fill.position.set(-sb, sb * 0.4, sb); scene.add(fill);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...cam.target); controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = cam.minDist || 1; controls.maxDistance = cam.maxDist || 50; controls.maxPolarAngle = cam.maxPolar ?? Math.PI * 0.49; controls.enablePan = cam.pan ?? false;
    controls.autoRotate = S.turntable; controls.autoRotateSpeed = S.spin; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8;
    let idleT = 0; controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idleT); hint.classList.add('gone'); });
    controls.addEventListener('end', () => { clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = S.turntable; }, 2500); });
    // floor: contact shadow + drafting grid
    const fs = cam.floor || 16;
    const floorSh = new THREE.Mesh(new THREE.PlaneGeometry(fs, fs), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.5 })); floorSh.rotation.x = -Math.PI / 2; floorSh.position.y = 0.001; floorSh.receiveShadow = true; scene.add(floorSh);
    const grid = new THREE.GridHelper(fs, Math.round(fs * 2), new THREE.Color(theme.grid || 0x2a2f22), new THREE.Color(theme.grid2 || 0x141710)); grid.material.transparent = true; grid.material.opacity = 0.65; scene.add(grid);
    contact = contactShadow(); scene.add(contact);
    const M = materials(theme);
    model = spec.build({ THREE, scene, M, part, contact, theme });
    scene.traverse((o) => { if (o.isMesh && !o.material.isShadowMaterial && !o.userData.noShadow && !(o.material.transparent && o.material.opacity < 0.9)) { o.castShadow = true; o.receiveShadow = true; } });
    floorSh.castShadow = false;
    new ResizeObserver(resize).observe(view); resize();
    setupPicking();
  } else {
    view.dataset.webgl = 'off';
    view.append(h('div', { class: 'nogl' }, h('div', { html: '<b>3D view unavailable</b>WebGL is turned off or unsupported in this browser. The part list, panels and log below still work.' })));
    model = spec.build(null);
    if (model?.partsList) for (const p of model.partsList) part(p);
  }
  sec.querySelector('[data-parts]').textContent = String(new Set(parts.map((p) => p.info?.name || p.name)).size);

  function contactShadow() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.003; m.userData.noShadow = true; m.renderOrder = -1; return m;
  }

  // ---------- parts ----------
  // def: { id, name, assembly, obj, explode:[x,y,z], glide:[x,y,z], label: 0|1|2, labelAt:[x,y,z], info:{ name, what, spec:[], lessons:[[id,title]] }, pickable }
  function part(def) {
    const p = Object.assign({ explode: [0, 0, 0], glide: [0, 0, 0], label: 0, pickable: true }, def);
    p.info = p.info || { name: p.name };
    if (p.obj) {
      p.base = p.obj.position.clone();
      p.cur = new THREE.Vector3(); p.vel = new THREE.Vector3(); p.tgt = new THREE.Vector3(); p.delay = 0;
      p.ex = new THREE.Vector3(...p.explode);
      if (Array.isArray(p.glide)) p.gl = new THREE.Vector3(...p.glide); else { p.gl = new THREE.Vector3(); p.glMap = Object.fromEntries(Object.entries(p.glide).map(([k, v]) => [k, new THREE.Vector3(...v)])); }
      p.mats = []; p.ghost = 0; p.ghostT = 0; p.hl = 0; p.hlT = 0;
      p.obj.traverse((o) => {
        if (!o.isMesh) return;
        if (o.material.colorWrite === false) { byMesh.set(o, p); return; }
        o.material = o.material.clone(); o.material.userData.e0 = o.material.emissive ? o.material.emissive.clone() : null; o.material.userData.o0 = o.material.opacity; o.material.userData.t0 = o.material.transparent;
        p.mats.push(o.material); if (p.pickable) byMesh.set(o, p);
      });
      p.labelAt = new THREE.Vector3(...(p.labelAt || [0, 0, 0]));
    }
    p.index = parts.length; parts.push(p);
    if (p.label && p.obj) {
      p.lab = h('div', { class: 'ta-label' + (p.label > 1 ? ' p2' : ''), 'data-part': p.id }, h('b', { text: p.labelText || p.info.name }), p.labelSub ? h('span', { text: p.labelSub }) : null);
      p.line = svgEl('polyline', { class: 'ta-leader' }); p.dot = svgEl('circle', { r: 2.2, class: 'ta-leader-dot' });
      svg.append(p.line, p.dot); labelsEl.append(p.lab);
      p.lab.addEventListener('click', () => openCard(p));
    }
    return p;
  }
  function retarget() {
    const order = S.exploded ? 1 : -1; const n = parts.length;
    for (const p of parts) {
      if (!p.obj) continue;
      p.tgt.set(0, 0, 0);
      if (S.exploded) p.tgt.addScaledVector(p.ex, S.explodeK);
      const g = glideFor(p); if (g) p.tgt.add(g);
      p.delay = reduced() ? 0 : ((order > 0 ? p.index : n - p.index) / n) * 0.35;
      p.ghostT = S.assembly && !inAssembly(p, S.assembly) ? 1 : 0;
    }
  }
  // glide: [x,y,z] for the part's own assembly, or { assemblyId: [x,y,z] } to move with several
  function glideFor(p) { if (!S.assembly) return null; if (p.glMap) return p.glMap[S.assembly] || null; return p.assembly === S.assembly ? p.gl : null; }
  function inAssembly(p, a) { return p.assembly === a || !!p.glMap?.[a] || (p.alsoIn || []).includes(a); }
  function syncFlags() {
    sec.dataset.exploded = String(S.exploded); sec.dataset.assembly = S.assembly || 'all';
    allBtn.setAttribute('aria-pressed', String(!S.assembly)); asmBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === S.assembly)));
    subRows.forEach((r, k) => r.li.classList.toggle('on', spec.subsystems.find((s) => s.id === k)?.assembly === S.assembly && !!S.assembly));
    const iso = sec.querySelector('[data-iso]'); iso.textContent = `ISOLATE · ${S.assembly ? (spec.assemblies.find((a) => a.id === S.assembly)?.label || S.assembly).toUpperCase() : 'ALL'}`;
  }
  function setExploded(v, byUser = false) {
    if (S.exploded === v) return; S.exploded = v; tExplode.set(v); retarget(); syncFlags();
    if (byUser) log(`Exploded ${v ? 'on' : 'off'}`, 'op');
    spec.onExplode?.(v, api);
  }
  // camera focus: an assembly may name a point (a function, so moving parts can be followed) and a viewing distance
  const F = { fn: null, t: 0, dist: 0 };
  function focus(fn, dist) { if (!controls) return; F.fn = fn; F.t = reduced() ? 0.01 : 1.3; F.dist = dist; }
  api.focus = focus;
  function setAssembly(a) {
    S.assembly = a; retarget(); syncFlags();
    const as = spec.assemblies.find((x) => x.id === a);
    if (as?.focus) focus(as.focus, as.dist); else focus(() => spec.camera.target, homeDist());
    if (a) log(`Isolate ${spec.assemblies.find((x) => x.id === a)?.label}`, 'op'); else log('Show all assemblies', 'op');
    spec.onAssembly?.(a, api);
  }

  // ---------- part card ----------
  function openCard(p) {
    if (!p) return closeCard();
    const i = p.info; S.card = p;
    card.innerHTML = `<div class="ta-card-head"><span class="ta-micro">${esc(i.kicker || spec.assemblies.find((a) => a.id === p.assembly)?.label || '')}${i.qty ? ` · ×${i.qty}` : ''}</span><button type="button" class="ta-x" aria-label="Close" data-testid="ta-${id}-card-close">×</button></div>
      <h5>${esc(i.name)}</h5><p>${esc(i.what || '')}</p>
      ${i.spec?.length ? `<ul>${i.spec.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${i.lessons?.length ? `<div class="ta-card-links">${i.lessons.map(([lid, t]) => `<a href="${href(lid)}" data-lesson="${lid}">${esc(t)} →</a>`).join('')}</div>` : ''}`;
    card.hidden = false; card.dataset.part = p.id; sec.dataset.card = p.id; view.classList.add('carded');
    card.querySelector('.ta-x').addEventListener('click', closeCard);
    for (const q of parts) q.hlT = q.info === p.info ? 1 : 0;
    spec.onPick?.(p, api);
  }
  function closeCard() { view.classList.remove('carded'); card.hidden = true; S.card = null; sec.dataset.card = ''; for (const q of parts) q.hlT = 0; }
  api.openCard = (pid) => openCard(parts.find((p) => p.id === pid)); api.closeCard = closeCard;

  // ---------- picking ----------
  function setupPicking() {
    const cv = renderer.domElement; cv.setAttribute('aria-label', `${spec.title}. Drag to orbit, pinch or scroll to zoom, tap a part for its card.`); cv.tabIndex = 0;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); const meshes = [...byMesh.keys()];
    const hit = (x, y) => { const r = cv.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const hs = ray.intersectObjects(meshes, false); for (const it of hs) { const p = byMesh.get(it.object); if (p && (p.ghost < 0.5)) return p; } return null; };
    let down = null;
    cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener('pointerup', (e) => {
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (moved > 8 || dt > 600) return;
      const p = hit(e.clientX, e.clientY); if (p) { openCard(p); spec.onTap?.(p, api); } else closeCard();
    });
    let hoverRaf = 0;
    cv.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || e.buttons) return; cancelAnimationFrame(hoverRaf); hoverRaf = requestAnimationFrame(() => { cv.style.cursor = hit(e.clientX, e.clientY) ? 'pointer' : 'grab'; }); });
    api.pickAt = (x, y) => hit(x, y);
    // screen position of a part (for tests and for keyboard users' focus): returns client coords
    api.screenOf = (pid) => { const p = parts.find((q) => q.id === pid); if (!p?.obj) return null; const v = p.obj.localToWorld(p.labelAt.clone()).project(camera); const r = cv.getBoundingClientRect(); return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }; };
  }

  function homeDist() { return (spec.camera.dist || 10) * aspectK(); }
  function aspectK() { return Math.min(1.9, Math.max(1, (spec.camera.aspectRef || 1.6) / Math.max(0.45, camera.aspect)) ** 0.8); }
  function resize() {
    const w = Math.max(1, view.clientWidth), hh = Math.max(1, view.clientHeight);
    renderer.setSize(w, hh, false); camera.aspect = w / hh;
    // keep the model framed on tall phone screens: back off with the aspect ratio
    if (!resize.user && !S.assembly) { const dir = camera.position.clone().sub(controls.target).normalize(); camera.position.copy(controls.target).addScaledVector(dir, homeDist()); }
    camera.updateProjectionMatrix(); svg.setAttribute('viewBox', `0 0 ${w} ${hh}`); S.w = w; S.h = hh;
  }

  // ---------- graph ----------
  const GN = 160; const series = (spec.graph?.series || []).map(() => new Float32Array(GN)); let gi = 0, gLast = 0;
  function graphPush(vals) { const now = performance.now(); if (now - gLast < 60) return; gLast = now; vals.forEach((v, i) => { if (series[i]) series[i][gi % GN] = v; }); gi++; drawGraph(); }
  function drawGraph() {
    if (!spec.graph || !graphCv.isConnected || !graphCv.offsetParent) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = graphCv.clientWidth || 200, H = graphCv.clientHeight || 64;
    if (graphCv.width !== Math.round(W * dpr)) { graphCv.width = Math.round(W * dpr); graphCv.height = Math.round(H * dpr); }
    const g = graphCv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const [lo, hi] = spec.graph.range; const y = (v) => H - 2 - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 4);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, (H * k) / 4 + 0.5); g.lineTo(W, (H * k) / 4 + 0.5); g.stroke(); }
    if (spec.graph.limit != null) { g.strokeStyle = theme.danger; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(0, y(spec.graph.limit) + 0.5); g.lineTo(W, y(spec.graph.limit) + 0.5); g.stroke(); g.setLineDash([]); }
    const n = Math.min(gi, GN);
    series.forEach((s, si) => { g.strokeStyle = spec.graph.series[si].color; g.lineWidth = 1.25; g.beginPath(); for (let k = 0; k < n; k++) { const v = s[(gi - n + k + GN) % GN]; const x = (k / (GN - 1)) * W; k ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)); } g.stroke(); });
  }

  // ---------- sequence ----------
  let evIdx = -1;
  function eventAt(t) { let k = -1; seq.events.forEach((e, i) => { if (e.t <= t + 1e-6) k = i; }); return k; }
  function fire(i) { const e = seq.events[i]; if (!e) return; evText.textContent = e.text; evText.dataset.kind = e.kind || ''; log(e.text, e.kind || ''); spec.onEvent?.(e, api); }
  function seek(t, byUser) {
    S.t = Math.max(0, Math.min(seq.duration, t)); scrub.value = S.t;
    const k = eventAt(S.t); evIdx = k; const e = seq.events[k];
    if (e) { evText.textContent = e.text; evText.dataset.kind = e.kind || ''; }
    spec.onSeek?.(S.t, e, api); if (byUser) log(`Scrubbed to ${clock(S.t)}`, 'op');
  }
  function setPlaying(v, why) {
    S.playing = v; playBtn.setAttribute('aria-pressed', String(v)); playBtn.setAttribute('aria-label', v ? 'Pause the sequence' : 'Play the sequence'); playBtn.classList.toggle('paused', !v);
    sec.dataset.playing = String(v); if (why) log(why, 'op');
  }
  playBtn.addEventListener('click', () => { S.actions++; actEl.textContent = `${S.actions} operator action${S.actions === 1 ? '' : 's'}`; if (!S.playing && S.t >= seq.duration - 0.05) seek(0); setPlaying(!S.playing); });
  scrub.addEventListener('input', () => { if (S.playing) setPlaying(false); seek(+scrub.value, false); });
  scrub.addEventListener('change', () => { S.actions++; actEl.textContent = `${S.actions} operator actions`; log(`Scrubbed to ${clock(S.t)}`, 'op'); });

  // ---------- per-frame ----------
  const tmpV = new THREE.Vector3(); const W0 = 7.5; let simClock = 0;
  const lblPos = [];
  function updateParts(dt) {
    const snap = reduced();
    for (const p of parts) {
      if (!p.obj) continue;
      if (p.delay > 0) p.delay -= dt; else if (snap) p.cur.copy(p.tgt); else {
        // critically damped spring: the parts have weight and settle without overshoot
        tmpV.subVectors(p.tgt, p.cur).multiplyScalar(W0 * W0).addScaledVector(p.vel, -2 * W0);
        p.vel.addScaledVector(tmpV, dt); p.cur.addScaledVector(p.vel, dt);
      }
      p.obj.position.copy(p.base).add(p.cur);
      const gk = snap ? 1 : Math.min(1, dt * 8);
      if (Math.abs(p.ghost - p.ghostT) > 0.002 || Math.abs(p.hl - p.hlT) > 0.002) {
        p.ghost += (p.ghostT - p.ghost) * gk; p.hl += (p.hlT - p.hl) * gk;
        for (const m of p.mats) {
          const o = (m.userData.o0 ?? 1) * (1 - 0.86 * p.ghost);
          m.opacity = o; const tr = m.userData.t0 || o < 0.99; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = o > 0.5;
          if (m.emissive && m.userData.e0) m.emissive.copy(m.userData.e0).lerp(ACC, 0.32 * p.hl);
        }
      }
    }
  }
  const ACC = new THREE.Color(theme.accent);
  document.fonts?.ready?.then(() => { for (const p of parts) { p.lw = 0; p.lh = 0; } }); // re-measure label boxes once the web fonts are in
  function hideLabel(p) { if (p.lab.dataset.on !== '0') { p.lab.dataset.on = '0'; p.line.setAttribute('opacity', 0); p.dot.setAttribute('opacity', 0); } }
  function updateLabels() {
    const show = S.labels; const w = S.w, hh = S.h; lblPos.length = 0;
    const mob = narrow();
    let cardBox = null;
    if (!card.hidden && !mob) { const v = view.getBoundingClientRect(), c = card.getBoundingClientRect(); cardBox = { l: c.left - v.left - 8, r: c.right - v.left + 8, t: c.top - v.top - 8, b: c.bottom - v.top + 8 }; }
    for (const p of parts) {
      if (!p.lab) continue;
      const iso = S.assembly && inAssembly(p, S.assembly);
      const vis = show && p.ghost < 0.5 && (p.label === 1 || iso || (S.exploded && !mob)) && (!p.labelWhen || p.labelWhen(S));
      if (!vis) { hideLabel(p); continue; }
      tmpV.copy(p.labelAt); p.obj.localToWorld(tmpV); tmpV.project(camera);
      if (tmpV.z > 1 || tmpV.z < -1) { hideLabel(p); continue; }
      const x = ((tmpV.x + 1) / 2) * w, y = ((1 - tmpV.y) / 2) * hh;
      // pick the side first (flip rather than run off the edge); then the label box is fixed in x and only moves in y
      const reach = mob ? 26 : 44, lw = p.lw || (p.lw = p.lab.offsetWidth) || 90, lh = p.lh || (p.lh = p.lab.offsetHeight) || 18;
      let side = x < w / 2 ? -1 : 1;
      if (side < 0 && x - reach - 16 - lw < 4) side = 1; else if (side > 0 && x + reach + 16 + lw > w - 4) side = -1;
      const ex = Math.max(8, Math.min(w - 8, x + side * reach));
      let tx = ex + side * (mob ? 10 : 16);
      if (side < 0) tx = Math.max(lw + 8, tx); else tx = Math.min(w - lw - 8, tx);
      const x0 = side < 0 ? tx - 4 - lw : tx + 4;
      lblPos.push({ p, x, y, side, ex, tx, lw, lh, x0, x1: x0 + lw, ly: y - (mob ? 22 : 30) * (y < hh / 2 ? 1 : -0.4) });
    }
    // de-overlap: each label takes the free slot nearest where it wants to be, clear of every placed label it shares x with
    // and of the open part card; a label with no free slot nearby is hidden rather than drawn over another
    const top = 30, bot = hh - 64, placed = [];
    lblPos.sort((a, b) => a.p.label - b.p.label || a.ly - b.ly);
    const clash = (l, ly) => placed.some((q) => l.x1 + 6 > q.x0 && l.x0 - 6 < q.x1 && Math.abs(ly - q.ly) < (l.lh + q.lh) / 2 + 3);
    const underCard = (l, ly) => !!cardBox && ((l.x1 > cardBox.l && l.x0 < cardBox.r && ly + l.lh / 2 > cardBox.t && ly - l.lh / 2 < cardBox.b) || (l.x > cardBox.l && l.x < cardBox.r && l.y > cardBox.t && l.y < cardBox.b));
    for (const l of lblPos) {
      const want = Math.max(top, Math.min(bot, l.ly)); let best = null;
      const cands = [want]; for (const q of placed) { const d = (l.lh + q.lh) / 2 + 3.5; cands.push(q.ly - d, q.ly + d); }
      for (const c of cands) { if (c < top || c > bot || clash(l, c) || underCard(l, c)) continue; if (best === null || Math.abs(c - want) < Math.abs(best - want)) best = c; }
      if (best === null || Math.abs(best - want) > hh * 0.3) { l.hide = true; continue; }
      l.ly = best; placed.push(l);
    }
    for (const l of lblPos) {
      const { p, x, y, side, ly, ex, tx } = l;
      if (l.hide) { hideLabel(p); continue; }
      p.line.setAttribute('points', `${x.toFixed(1)},${y.toFixed(1)} ${ex.toFixed(1)},${ly.toFixed(1)} ${tx.toFixed(1)},${ly.toFixed(1)}`);
      p.dot.setAttribute('cx', x.toFixed(1)); p.dot.setAttribute('cy', y.toFixed(1));
      p.line.setAttribute('opacity', 1); p.dot.setAttribute('opacity', 1);
      p.lab.dataset.on = '1'; p.lab.dataset.side = side < 0 ? 'l' : 'r';
      p.lab.style.transform = `translate(${(side < 0 ? tx - 4 : tx + 4).toFixed(1)}px, ${ly.toFixed(1)}px) translate(${side < 0 ? '-100%' : '0'}, -50%)`;
    }
  }
  const item = {
    visible: false,
    tick(dt) {
      if (S.playing) {
        S.t += dt; if (S.t >= seq.duration) { if (seq.loop !== false) { S.t = 0; evIdx = -1; spec.onLoop?.(api); } else { S.t = seq.duration; setPlaying(false); } }
        const k = eventAt(S.t); while (evIdx < k) { evIdx++; fire(evIdx); }
        scrub.value = S.t;
      }
      simClock += dt; clockEl.textContent = clock(simClock);
      timeEl.textContent = `${clock(S.t)} / ${clock(seq.duration)}`;
      spec.onTick?.(dt, api, model);
      if (!renderer) return;
      updateParts(dt);
      model?.update?.(dt, api);
      if (F.fn) {
        const tg = F.fn(); const k = F.t > 0 ? Math.min(1, dt * 3.2) : Math.min(1, dt * 6);
        tmpV.set(...tg).sub(controls.target).multiplyScalar(k); controls.target.add(tmpV); camera.position.add(tmpV);
        if (F.t > 0) { F.t -= dt; const off = camera.position.clone().sub(controls.target); const d = off.length(); off.multiplyScalar((d + (F.dist - d) * Math.min(1, dt * 3.2)) / d); camera.position.copy(controls.target).add(off); }
        if (!S.assembly && F.t <= 0) F.fn = null;
      }
      controls.update(dt);
      const az = (Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z) * 180) / Math.PI;
      azEl.textContent = `AZ ${pad(Math.round((az + 360) % 360), 3)}° · EXP ${S.exploded ? Math.round(S.explodeK * 100) : 0}%`;
      renderer.render(scene, camera);
      updateLabels();
    },
  };
  renderer && renderer.domElement.addEventListener('wheel', () => { resize.user = true; }, { passive: true });
  renderer && renderer.domElement.addEventListener('touchstart', (e) => { if (e.touches.length > 1) resize.user = true; }, { passive: true });
  const io = new IntersectionObserver((es) => { for (const e of es) item.visible = e.isIntersecting; }, { rootMargin: '80px' }); io.observe(sec);
  LOOP.add(item); if (!looping) { looping = true; requestAnimationFrame(frame); }
  api.dispose = () => { io.disconnect(); LOOP.delete(item); if (renderer) { scene.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); }); renderer.dispose(); renderer.forceContextLoss?.(); } };
  if (spec.embedded) { const iv = setInterval(() => { if (!sec.isConnected) { clearInterval(iv); api.dispose(); } }, 1500); }

  // first state
  actEl.textContent = '0 operator actions';
  setPlaying(S.playing); retarget(); syncFlags(); seek(0); if (seq.events[0]) { evIdx = 0; fire(0); }
  // a frame when not yet visible, so a paused lab is not blank
  requestAnimationFrame(() => { if (renderer) { const v = item.visible; item.visible = true; item.tick(0); item.visible = v; } });
  return api;
}
