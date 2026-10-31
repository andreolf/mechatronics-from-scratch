// Lab 06: take the cable robot apart. A procedural room-scale four-line robot (our own layout, sized with the numbers
// from Phase 21) in the take-apart viewer. Line lengths and tensions come from the same CableSim as Lab 05; the hardware
// is drawn 1.8x so the winches can be seen across a 7 x 7 x 3 m room.
import { takeApart } from './takeapart/engine.js';
import { CableSim, G } from '../sim/cable.js';
import { tensionRGB } from './cableLab.js';

const LIME = '#c6ff1a', CORAL = '#ff6b81', AMBER = '#ffb547';
const L = (n, t) => [`p21-l${String(n).padStart(2, '0')}`, t];
const LES = { hist: L(1, 'History'), ik: L(2, 'Geometry and IK'), ten: L(3, 'Tension distribution'), ws: L(4, 'Workspace and capacity'), spool: L(5, 'Motors, spools and encoders'), cal: L(6, 'Calibration'), swing: L(7, 'Swing control'), safe: L(8, 'Safety'), elec: L(9, 'Electronics and comms'), soft: L(10, 'Software and imitation'), bom: L(11, 'Build plan and BOM') };

// Every number here is quoted in a Phase 21 lesson; the lesson is linked on the card.
const INFO = {
  post: { name: 'Room frame', kicker: 'Anchors', what: 'The four anchors sit near the top corners of the room. The IK only works if the model knows where they really are.', spec: ['Stringman’s example room: 7 × 7 × 3 m (Lesson 1)', 'With the pivot in the middle at 1.5 m each line runs 5.172 m to its corner', 'Desk version: 0.8 × 0.6 m footprint, anchors 0.5 m up (Lesson 11)'], lessons: [LES.hist, LES.bom] },
  bracket: { name: 'Anchor bracket', kicker: 'Anchors', qty: 4, what: 'Holds a winch at a fixed, known point. If it flexes or sits somewhere else, every length the IK computes is wrong.', spec: ['Anchors 5 cm further out than the model raise a straight path by 18.5 cm in the middle (Lesson 6)', 'Desk frame: rigid to under 1 mm at the anchors under 4 × 5 N, square to 2 mm (Lesson 11)'], lessons: [LES.cal, LES.bom] },
  motor: { name: 'Winch motor', kicker: 'Anchors', qty: 4, what: 'Turns torque into line tension through the spool, T = τ / r, and shaft speed into line speed, v = ω r.', spec: ['Room scale (Lesson 5): 1 N·m rated on a 36 mm spool radius pulls 27.8 N; 0.4 m/s needs 106 rpm', 'Stringman uses the DM-H6215 direct-drive actuator, listed at $66 each', 'Desk build (Lesson 11): NEMA 17 stepper, 0.4 N·m holding torque on a 10 mm spool, 40 N, eight times the 5 N limit'], lessons: [LES.spool, LES.bom] },
  spool: { name: 'Spool', kicker: 'Spool + encoder', qty: 4, what: 'Stores the line. Its diameter grows as line piles on, so the length per turn changes with the fill.', spec: ['72 mm empty. 7.5 m of fishing line takes it to 73.1 mm, 7.5 m of power line to 86.1 mm (Lesson 5)', 'Ignore the pile and the power line is 65 cm out after 7.5 m', 'Desk: 10 mm radius, ≥ 12 mm wide, flanged, line clamped not tied; 1.5 m fits in one layer'], lessons: [LES.spool, LES.bom] },
  encoder: { name: 'Angle encoder (AS5600)', kicker: 'Spool + encoder', qty: 4, what: 'A 12-bit magnetic sensor that reads a magnet on the end of the motor shaft. Line out is the angle times the metres per turn.', spec: ['4096 positions per turn', '0.055 mm of line per count on a 72 mm spool (Lesson 5)', 'Turns have to be counted in firmware: the sensor only knows where it is within one turn'], lessons: [LES.spool] },
  pulley: { name: 'Exit pulley', kicker: 'Anchors', qty: 4, what: 'The point the line leaves from. The IK treats this point as the anchor, so it has to be known.', spec: ['Smooth, low friction, exit point known to 1 mm (Lesson 11)', 'Calibration fits what is left (Lesson 6)'], lessons: [LES.ik, LES.cal, LES.bom] },
  loadcell: { name: 'Load cell', kicker: 'Anchors', qty: 4, what: 'Measures line tension under the pulley. Steppers don’t report torque, so this is how the desk build knows what each line carries.', spec: ['Range ≥ 2 × 5 N, read at ≥ 50 Hz (Lesson 11)', 'Feeds the trip and the slack-line check (Lesson 8)', 'A zero reading at rest means a slack line'], lessons: [LES.safe, LES.bom] },
  line: { name: 'Support line', kicker: 'Cables', qty: 3, what: 'Carries load from an anchor to the pivot. Its length is the IK; its tension is one of the ways to split the weight across four lines.', spec: ['Desk: low-stretch braid rated ≥ 3 × the 5 N limit; 20 N passes (Lesson 11)', 'Room: all motors relax at 28 N, about a school backpack (Lesson 8)', 'Live length and tension in the telemetry panel'], lessons: [LES.ik, LES.ten, LES.safe] },
  power: { name: 'Line 1 · power line', kicker: 'Cables', what: 'In Stringman’s design one support line is a two-conductor FEP line that also powers the gripper, so the gripper needs no battery.', spec: ['Rated at 50 N tensile strength (Lesson 8)', 'Its thicker pile makes the spool model matter most on this line (Lesson 5)'], lessons: [LES.elec, LES.spool, LES.safe] },
  hub: { name: 'Pivot', kicker: 'Effector', what: 'Where the four lines meet. The lines control its three coordinates and nothing else, so the pole can still swing under it.', spec: ['Four lines, three force equations: a one-dimensional null space of tensions (Lesson 3)', 'Top speed 0.4 m/s (Stringman)'], lessons: [LES.ik, LES.ten] },
  pole: { name: 'Pole', kicker: 'Effector', what: 'Hangs the gripper below the pivot, which makes the gripper a pendulum.', spec: ['0.5 m: period 1.419 s (Lesson 7)', 'A dead stop from 0.4 m/s swings 9.0 cm', 'Desk build: 0.1 m, period 0.634 s'], lessons: [LES.swing] },
  shell: { name: 'Wrist housing', kicker: 'Effector', what: 'A matte shell around the IMU, the camera and the wrist servo.', spec: ['Desk build: hanging mass with payload ≤ 0.2 kg (Lesson 11)'], lessons: [LES.bom, LES.ws] },
  imu: { name: 'IMU', kicker: 'Effector', what: 'A gyro on the gripper. It measures the swing so the pivot can be moved under the gripper to damp it.', spec: ['Stringman fits its swing model to the gyro at 100 Hz (Lesson 7)', 'The swing state is four numbers at 100 Hz, 1.6 kB/s (Lesson 9)'], lessons: [LES.swing, LES.elec] },
  gcam: { name: 'Gripper camera', kicker: 'Effector', what: 'Looks down at what the gripper is about to grab. Its footage is what an imitation policy learns from.', spec: ['Stringman’s gripper camera: 684 × 384 at 60 fps (Lesson 9)'], lessons: [LES.elec, LES.soft] },
  wservo: { name: 'Wrist servo', kicker: 'Gripper', what: 'Turns the gripper about the pole.', spec: ['Stringman: STS3215 servos on a 1 Mbit/s serial bus (Lesson 9)'], lessons: [LES.elec] },
  palm: { name: 'Gripper palm', kicker: 'Gripper', what: 'Carries the finger servo and the fingers. Everything below the pivot counts towards the payload.', spec: ['Desk build: a small servo gripper; 0.2 kg hanging mass including the object (Lesson 11)', 'Room: the simulator hangs 1 kg including the gripper'], lessons: [LES.ws, LES.bom] },
  fservo: { name: 'Finger servo', kicker: 'Gripper', what: 'Opens and closes the fingers.', spec: ['Stringman: STS3215 servos on a 1 Mbit/s serial bus (Lesson 9)'], lessons: [LES.elec] },
  finger: { name: 'Finger', kicker: 'Gripper', qty: 2, what: 'Closes on the object. What the robot may carry depends on where the gripper is, not just on the fingers.', spec: ['Check the capacity map before you pick something up (Lesson 4)'], lessons: [LES.ws] },
  box: { name: 'Electronics enclosure', kicker: 'Electronics', what: 'Keeps the fast loops next to the motors. Heavy maths, calibration and learned policies run on the PC.', spec: ['Fast loops stay local; nothing that keeps a line taut waits for Wi-Fi (Lesson 9)'], lessons: [LES.elec] },
  lid: { name: 'Enclosure lid', kicker: 'Electronics', what: 'Matte cover. The stop switch sits on top where you can reach it.', spec: [], lessons: [LES.safe] },
  mcu: { name: 'Microcontroller', kicker: 'Electronics', what: 'Runs the steps, the load-cell reads and the trip, and talks to the PC over USB serial.', spec: ['Four step outputs, four load-cell inputs, USB serial to a PC (Lesson 11)', 'Stringman’s tension loop runs at 50 Hz on the anchor itself (Lesson 5)'], lessons: [LES.elec, LES.bom] },
  driver: { name: 'Stepper driver', kicker: 'Electronics', qty: 4, what: 'Turns step pulses into motor current.', spec: ['Microstepping ≥ 1/16: 3,200 steps per turn, 0.020 mm of line per step on a 10 mm spool (Lesson 11)', 'Current limit set below the motor rating'], lessons: [LES.spool, LES.bom] },
  amp: { name: 'Load-cell amplifier', kicker: 'Electronics', qty: 4, what: 'Reads a load cell for the microcontroller.', spec: ['Read at ≥ 50 Hz: at a 50 Hz loop the worst case is 20 ms to notice, 8 mm of travel at 0.4 m/s (Lesson 8)'], lessons: [LES.safe, LES.bom] },
  psu: { name: 'Power supply', kicker: 'Electronics', what: 'Feeds the motors through the stop switch.', spec: ['Paired with a physical stop switch in the parts list (Lesson 11)'], lessons: [LES.bom] },
  stop: { name: 'Stop switch', kicker: 'Electronics', what: 'A physical switch that cuts motor power, not just the software. It is a separate safety layer from the tension trip.', spec: ['Switch cuts motor power, not just the software (Lesson 11)', 'Independent of the 28 N relax and the 40 N firmware cut-off (Lesson 8)'], lessons: [LES.safe, LES.bom] },
  wcam: { name: 'Workspace camera (optional)', kicker: 'Electronics', what: 'A fixed camera that sees the whole workspace, for calibration and for recording training data.', spec: ['Used for calibration (Lesson 6) and datasets (Lesson 10)', 'Stringman’s anchor cameras: 1920 × 1080 at 30 fps (Lesson 9)'], lessons: [LES.cal, LES.soft] },
};

const ROOM = { w: 7, d: 7, h: 3 }, HW = 1.8;
// scripted run: positions in the sim frame (x, y, z up), metres
const HOME = [0, 0, 1.2], PICK = [1.6, -1.2, 0.45], LIFT = [1.6, -1.2, 0.95];
const CAL = [[0.35, 0.35, 1.2], [-0.35, 0.35, 1.2], [-0.35, -0.35, 1.2], [0.35, -0.35, 1.2]];
const SEQ = {
  duration: 40,
  events: [
    { t: 0, status: 'IDLE', text: 'Idle · holding at home' },
    { t: 3, status: 'CALIBRATING', text: 'Quick calibration · tighten lines' },
    { t: 5, status: 'CALIBRATING', text: 'Calibration poses 1 to 4' },
    { t: 12.5, status: 'MOVING', text: 'Move to pick point' },
    { t: 19, status: 'MOVING', text: 'Close gripper' },
    { t: 20, status: 'MOVING', text: 'Lift 0.5 m' },
    { t: 22.5, status: 'HOLDING', text: 'Holding the load' },
    { t: 26, status: 'TEARDOWN', text: 'Teardown · exploded view' },
    { t: 33, status: 'MOVING', text: 'Reassemble · return home' },
    { t: 38.5, status: 'IDLE', text: 'Open gripper · idle' },
  ],
};
function targetAt(t) {
  if (t < 5) return HOME;
  if (t < 12.5) { const k = Math.min(3, Math.floor((t - 5) / 1.875)); return CAL[k]; }
  if (t < 20) return PICK;
  if (t < 33) return LIFT;
  return HOME;
}
const gripClosedAt = (t) => t >= 19 && t < 38.5;
const explodedAt = (t) => t >= 26 && t < 33;

export function cableTeardown(root, opts = {}) {
  const sim = new CableSim(); sim.setRoom(ROOM.w, ROOM.d, ROOM.h); sim.reset(HOME);
  const c = sim.c; const CPC = (Math.PI * 0.072) / 4096; // metres of line per AS5600 count on a 72 mm spool
  let tripped = false, gripK = 0, lastStatus = '';
  const model = {}; // filled by build
  const spec = {
    id: opts.id || 'teardown', num: '06', embedded: !!opts.embedded, wide: !opts.embedded, code: 'CDPR-4 · REV 6',
    kicker: 'Cable robot · take-apart',
    title: 'Take the cable robot apart',
    blurb: 'Every part of a room-scale four-line robot, built from the Phase 21 parts list. Isolate an assembly, explode the whole thing, tap any part for what it does and the lesson behind it. The line lengths and tensions on the right are the same maths as Lab 05.',
    theme: { accent: LIME, danger: CORAL, warn: AMBER, panel: 0xcfd3c7, grid: 0x24291c, grid2: 0x12150d },
    lessons: [LES.spool, LES.bom, LES.ik, LES.ten, LES.safe],
    camera: { pos: [1.6, 5.0, 11.6], target: [0, 1.2, 0], dist: 13.8, fov: 36, minDist: 1.6, maxDist: 34, floor: 16, shadow: 6, aspectRef: 1.45 },
    assemblies: [
      { id: 'anchors', label: 'Anchors', focus: () => model.anchorFocus(0.9), dist: 4.6 },
      { id: 'spool', label: 'Spool + encoder', focus: () => model.anchorFocus(0.5), dist: 3.2 },
      { id: 'effector', label: 'Effector', focus: () => model.effFocus(0), dist: 4.2 },
      { id: 'gripper', label: 'Gripper', focus: () => model.effFocus(-1.05), dist: 3.0 },
      { id: 'electronics', label: 'Electronics', focus: () => model.boxFocus(), dist: 4.0 },
      { id: 'cables', label: 'Cables' },
    ],
    subsystems: [
      { id: 'anchors', name: 'Anchors ×4', sub: 'Motor · bracket · pulley · load cell', assembly: 'anchors' },
      { id: 'spool', name: 'Spool + encoder', sub: 'AS5600 · 0.055 mm per count', assembly: 'spool' },
      { id: 'effector', name: 'Effector', sub: 'Pivot · 0.5 m pole · IMU', assembly: 'effector' },
      { id: 'gripper', name: 'Gripper', sub: 'Two fingers · servo', assembly: 'gripper' },
      { id: 'electronics', name: 'Electronics', sub: 'MCU · 4 drivers · stop switch', assembly: 'electronics' },
      { id: 'cables', name: 'Cables ×4', sub: 'Relax at 28 N', assembly: 'cables' },
    ],
    graph: { title: 'Line tension · N · limit 28', range: [0, 32], limit: 28, series: [{ label: 'L1', color: LIME }, { label: 'L2', color: '#6fd3ff' }, { label: 'L3', color: AMBER }, { label: 'L4', color: '#eceee6' }] },
    sequence: SEQ,
    build: (ctx) => build(ctx, sim, model),
    onEvent(e, api) {
      if (tripped) return;
      if (e.t === 26) api.setExploded(true); if (e.t === 33) api.setExploded(false);
      if (e.t === 3) sim.reset(sim.state.target); // quick calibration: lines re-tensioned where the robot stands
    },
    onSeek(t, e, api) { if (tripped) return; const tg = targetAt(t); sim.setTarget(...tg); if (!api.state.playing) sim.reset(tg); gripK = gripClosedAt(t) ? 1 : 0; api.setExploded(explodedAt(t)); },
    onLoop() { sim.setTarget(...HOME); },
    onTick(dt, api) { tick(dt, api); },
    onPick(p, api) { api.onQuizPick?.(p); },
  };

  function tick(dt, api) {
    const S = api.state;
    if (!tripped && S.playing) { sim.setTarget(...targetAt(S.t)); }
    const gk = !tripped && (S.playing ? gripClosedAt(S.t) : gripK > 0.5) ? 1 : 0; gripK += (gk - gripK) * Math.min(1, dt * 5);
    sim.step(Math.min(dt, 1 / 30));
    const st = sim.state; model.state = st; model.grip = gripK;
    // status word
    let word = S.status, kind = '', sub = '';
    if (st.relaxed) { word = 'RELAXED'; kind = 'danger'; sub = st.onFloor ? 'Lines past 28 N · gripper on the floor' : 'Lines past 28 N · paying out at 0.3 m/s'; }
    else if (st.reason === 'slack' || st.reason === 'over') { word = st.reason === 'slack' ? 'SLACK LINE' : 'OVER LIMIT'; kind = 'warn'; }
    else { const ev = [...SEQ.events].reverse().find((e) => e.t <= S.t + 1e-6) || SEQ.events[0]; word = S.exploded ? 'TEARDOWN' : ev.status === 'TEARDOWN' ? 'HOLDING' : ev.status; if (!S.playing && !S.exploded && st.speed < 0.02) word = word === 'MOVING' ? 'HOLDING' : word; sub = `Payload ${c.mass.toFixed(2)} kg · limit ${c.tLimit} N · swing ${((st.swing * 180) / Math.PI).toFixed(1)}°`; }
    api.setStatus(word, kind, sub);
    if (word !== lastStatus) { if (kind === 'danger') api.log('Relax: every motor lets go', 'danger'); lastStatus = word; }
    // telemetry + badges, about 12 Hz
    tick.acc = (tick.acc || 0) + dt; if (tick.acc < 0.08) return; tick.acc = 0;
    const ex = S.exploded, lim = c.tLimit;
    const slackN = st.slack.filter(Boolean).length;
    api.badge('anchors', ex ? 'Detached' : st.relaxed ? 'Relaxed' : slackN ? `${slackN} slack` : '4 / 4 taut', ex ? 'detached' : st.relaxed ? 'danger' : slackN ? 'warn' : '');
    api.badge('spool', ex ? 'Detached' : st.speed > 0.02 ? 'Counting' : 'Tracking', ex ? 'detached' : st.speed > 0.02 ? '' : 'idle');
    api.badge('effector', ex ? 'Detached' : st.relaxed ? 'Lowering' : (st.swing * 180) / Math.PI > 4 ? 'Swinging' : st.speed > 0.02 ? 'Moving' : 'Holding', ex ? 'detached' : st.relaxed ? 'danger' : (st.swing * 180) / Math.PI > 4 ? 'warn' : '');
    api.badge('gripper', ex ? 'Detached' : gripK > 0.5 ? 'Closed' : 'Open', ex ? 'detached' : gripK > 0.5 ? '' : 'idle');
    api.badge('electronics', st.relaxed ? 'Tripped' : ex ? 'Detached' : '50 Hz loop', st.relaxed ? 'danger' : ex ? 'detached' : '');
    api.badge('cables', st.relaxed ? 'Relaxed' : `Peak ${st.peak.toFixed(1)} N`, st.relaxed ? 'danger' : st.peak > lim * 0.8 ? 'warn' : '');
    const tens = st.t.map((t) => (st.relaxed ? 0 : t));
    api.graphPush(tens);
    if (!tick.built) {
      tick.built = true;
      api.telemetry.innerHTML = `<div class="ta-big"><span class="ta-micro">Peak tension</span><b data-k="peak">0<small>N</small></b></div>
        <div class="ta-bars">${[0, 1, 2, 3].map((i) => `<div class="ta-bar" data-line="${i}"><span>L${i + 1}</span><span class="tr"><i></i><u style="left:${(100 * lim) / 32}%"></u></span><b></b><em></em></div>`).join('')}</div>
        <dl class="ta-kv"><div><dt>Spool turns · L1</dt><dd data-k="turns"></dd></div><div><dt>AS5600 counts · L1</dt><dd data-k="counts"></dd></div>
        <div><dt>Pivot x y z · m</dt><dd data-k="piv"></dd></div><div><dt>Speed</dt><dd data-k="spd"></dd></div><div><dt>Σ t·u<sub>z</sub> / mg</dt><dd data-k="bal"></dd></div><div><dt>Loop</dt><dd>50 Hz</dd></div></dl>`;
      tick.k = Object.fromEntries([...api.telemetry.querySelectorAll('[data-k]')].map((e) => [e.dataset.k, e]));
      tick.bars = [...api.telemetry.querySelectorAll('.ta-bar')].map((b) => ({ fill: b.querySelector('i'), val: b.querySelector('b'), len: b.querySelector('em') }));
    }
    tick.k.peak.innerHTML = `${(st.relaxed ? 0 : st.peak).toFixed(1)}<small>N</small>`;
    tick.k.peak.style.color = st.relaxed ? CORAL : st.peak > lim * 0.8 ? AMBER : '';
    st.t.forEach((t, i) => { const col = tensionRGB(t, lim, st.slack[i] || st.relaxed); const b = tick.bars[i]; b.fill.style.width = `${Math.min(100, (100 * Math.max(0, st.relaxed ? 0 : t)) / 32)}%`; b.fill.style.background = `rgb(${col})`; b.val.textContent = st.relaxed ? 'relaxed' : st.slack[i] ? 'slack' : `${t.toFixed(2)} N`; b.len.textContent = `${st.L[i].toFixed(3)} m`; });
    tick.k.turns.textContent = (st.L[0] / (Math.PI * 0.072)).toFixed(2);
    tick.k.counts.textContent = Math.round(st.L[0] / CPC).toLocaleString('en-US');
    tick.k.piv.textContent = st.pivot.map((v) => v.toFixed(2)).join(' ');
    tick.k.spd.textContent = `${st.speed.toFixed(2)} m/s`;
    tick.k.bal.textContent = st.relaxed ? '—' : (st.t.reduce((s, t, i) => s + t * sim.u[i][2], 0) / (c.mass * G)).toFixed(3);
    Object.assign(api.sec.dataset, { lengths: st.L.map((v) => v.toFixed(4)).join(','), tensions: st.t.map((v) => v.toFixed(4)).join(','), relaxed: String(st.relaxed), grip: gripK.toFixed(2) });
  }

  const api = takeApart(root, spec);
  // safety: push the gripper until a line passes 28 N and every motor relaxes (Lesson 8), then re-arm
  const trip = document.createElement('div'); trip.className = 'ta-chips';
  const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'ta-chip danger'; tb.setAttribute('aria-pressed', 'false'); tb.dataset.testid = ''; tb.setAttribute('data-testid', `ta-${spec.id}-trip`); tb.textContent = 'Push 40 N · trip';
  tb.addEventListener('click', () => {
    api.act(); tripped = !tripped; tb.setAttribute('aria-pressed', String(tripped));
    if (tripped) { c.push = 40; api.log('Operator pushes the gripper with 40 N', 'warn'); tb.textContent = 'Re-arm'; }
    else { c.push = 0; sim.rearm(); sim.reset(sim.state.gripper[2] < 0.1 ? HOME : sim.state.target); api.log('Re-armed · lines tensioned', 'op'); tb.textContent = 'Push 40 N · trip'; }
  });
  trip.append(tb);
  const head = document.createElement('h4'); head.className = 'ta-ph'; head.innerHTML = '<span>Safety</span><small>28 N</small>';
  const note = document.createElement('p'); note.className = 'ta-note'; note.textContent = 'A 40 N push on the gripper loads the lines past 28 N. Every motor relaxes and the gripper is lowered at 0.3 m/s, as in Lesson 8.';
  api.extra.append(head, trip, note, challenge(api));
  api.sim = sim;
  if (window.__mfs) window.__mfs.labs[spec.id] = api;
  return api;
}

// A three-question hunt: find the part the question describes. Purely local; no points.
function challenge(api) {
  const Q = [
    ['Which part turns 4096 counts per turn into line length?', 'encoder'],
    ['Which part does the IK treat as the anchor point?', 'pulley'],
    ['Which part cuts motor power without asking the software?', 'stop'],
  ];
  let k = 0, solved = 0;
  const box = document.createElement('div'); box.className = 'ta-quiz'; box.dataset.testid = 'quiz';
  box.setAttribute('data-testid', `ta-${api.sec.id.replace('lab-', '')}-quiz`);
  const render = (msg = '', ok = null) => {
    box.innerHTML = `<h4 class="ta-ph"><span>Find the part</span><small>${solved} / ${Q.length}</small></h4>${k < Q.length ? `<p class="ta-q">${Q[k][0]}</p><p class="ta-qhint">Tap it in the model or its label.</p>` : '<p class="ta-q">All three found. Open a card’s lesson link to see where each number comes from.</p>'}${msg ? `<p class="ta-qmsg" data-ok="${ok}">${msg}</p>` : ''}`;
  };
  api.sec.addEventListener('ta-pick', () => {});
  const orig = api.openCard;
  // listen through the part-card hook
  api.onQuizPick = (p) => {
    if (k >= Q.length) return;
    const kind = p.id.split('-')[0];
    if (kind === Q[k][1]) { solved++; k++; render(`Right: ${p.info.name}.`, true); }
    else render(`That’s the ${p.info.name.toLowerCase()}. Try again.`, false);
  };
  void orig;
  render();
  return box;
}

// ---------- the model ----------
function build(ctx, sim, model) {
  const cards = [];
  if (!ctx) { // no WebGL: still list the parts for the card text
    return { partsList: Object.entries(INFO).map(([k, info]) => ({ id: k, name: info.name, assembly: (info.kicker || '').toLowerCase(), info })) };
  }
  const { THREE, scene, M, part, contact } = ctx;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = (v) => V(v[0], v[2], -v[1]);
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
  const grp = (x = 0, y = 0, z = 0, ...kids) => { const g = new THREE.Group(); g.position.set(x, y, z); kids.forEach((k) => g.add(k)); return g; };
  const rotZ = (o) => { o.rotation.z = Math.PI / 2; return o; };
  const world = new THREE.Group(); scene.add(world);
  const mat = { panel: M.panel(), dark: M.dark(), metal: M.metal(), steel: M.steel(), rubber: M.rubber(), pcb: M.pcb(), chip: M.chip(), accent: M.accent(), glass: M.glass(), copper: M.copper(), panelDark: M.panelDark() };
  const wound = new THREE.MeshPhysicalMaterial({ color: 0x9aa58a, roughness: 0.6, metalness: 0.1 });
  const P = (id, assembly, obj, o = {}) => part(Object.assign({ id, name: INFO[id.split('-')[0]].name, assembly, obj, info: INFO[id.split('-')[0]] }, o));

  // room frame: thin posts and rails
  const { w, d, h } = sim.c;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b2f26, roughness: 0.6, metalness: 0.5 });
  const railMat = new THREE.LineBasicMaterial({ color: 0x3a4030, transparent: true, opacity: 0.9 });
  const anchorsW = sim.anchors.map(T);
  const outward = anchorsW.map((a) => V(a.x, 0, a.z).normalize());
  anchorsW.forEach((a, i) => {
    const pos = a.clone().addScaledVector(outward[i], 0.4 * HW);
    const post = mesh(new THREE.BoxGeometry(0.05, h + 0.45, 0.05), frameMat, pos.x, (h + 0.45) / 2, pos.z);
    world.add(post); P(`post-${i}`, 'anchors', post, { explode: [outward[i].x * 0.6, 0, outward[i].z * 0.6], labelAt: [0, -0.9, 0], label: i === 1 ? 2 : 0, glide: [0, 0, 0] });
  });
  const tops = anchorsW.map((a, i) => a.clone().addScaledVector(outward[i], 0.4 * HW).setY(h + 0.45));
  const railG = new THREE.BufferGeometry().setFromPoints([0, 1, 1, 2, 2, 3, 3, 0].map((k) => tops[k]));
  world.add(new THREE.LineSegments(railG, railMat));
  const floorG = new THREE.BufferGeometry().setFromPoints([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]].map(([x, y]) => T([x, y, 0.005])));
  world.add(new THREE.LineSegments(floorG, new THREE.LineBasicMaterial({ color: 0x4a5236 })));

  // ---- four anchor winch units ----
  // local frame: origin at the pulley (the anchor point), +z towards the room centre, +y up, motor axis along x
  const anchors = [], pulleys = [], spoolsSpin = [];
  const geo = {
    plate: new THREE.BoxGeometry(0.34, 0.5, 0.03), arm: new THREE.BoxGeometry(0.05, 0.05, 0.3),
    motor: new THREE.CylinderGeometry(0.11, 0.11, 0.2, 40), cap: new THREE.CylinderGeometry(0.113, 0.113, 0.035, 40), ring: new THREE.TorusGeometry(0.112, 0.006, 8, 48), shaft: new THREE.CylinderGeometry(0.014, 0.014, 0.5, 12),
    drum: new THREE.CylinderGeometry(0.072, 0.072, 0.12, 40), flange: new THREE.CylinderGeometry(0.125, 0.125, 0.012, 48), wound: new THREE.CylinderGeometry(0.088, 0.088, 0.104, 40), spoke: new THREE.BoxGeometry(0.014, 0.2, 0.02),
    board: new THREE.BoxGeometry(0.012, 0.13, 0.13), ic: new THREE.BoxGeometry(0.008, 0.036, 0.036), magnet: new THREE.CylinderGeometry(0.022, 0.022, 0.014, 24), pin: new THREE.BoxGeometry(0.01, 0.01, 0.02),
    wheel: new THREE.TorusGeometry(0.05, 0.014, 12, 36), hubw: new THREE.CylinderGeometry(0.022, 0.022, 0.04, 16), fork: new THREE.BoxGeometry(0.008, 0.11, 0.07),
    cell: new THREE.BoxGeometry(0.05, 0.05, 0.27), gauge: new THREE.BoxGeometry(0.052, 0.02, 0.06), lead: new THREE.BoxGeometry(0.33, 0.006, 0.006),
  };
  anchorsW.forEach((a, i) => {
    const g = new THREE.Group(); g.position.copy(a); g.rotation.y = Math.atan2(-a.x, -a.z); g.scale.setScalar(HW); world.add(g);
    const out = [0, -0.15, 0.55]; // shared drift into the room in the exploded view, so parts stay in frame
    const X = (dx, dy, dz) => [out[0] + dx, out[1] + dy, out[2] + dz];
    const lb = (k) => k; // label one anchor; labelWhen below moves the labels to the one nearest the camera
    const when = (S) => model.nearAnchor === i;
    const AG = [0, -0.5, 0.75]; // anchors glide: towards the room and down
    // bracket
    const br = grp(0, 0.3, -0.36, mesh(geo.plate, mat.panelDark), mesh(geo.arm, mat.dark, -0.14, 0.12, 0.15), mesh(geo.arm, mat.dark, 0.14, 0.12, 0.15), mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), mat.accent, 0, -0.22, 0.02));
    g.add(br); P(`bracket-${i}`, 'anchors', br, { explode: X(0, 0.1, -0.35), glide: { anchors: AG, spool: [0, 0, 0] }, label: lb(2), labelWhen: when, labelAt: [0.26, 0.2, 0] });
    // motor
    const mo = grp(-0.21, 0.4, -0.15, rotZ(mesh(geo.motor, mat.dark)), rotZ(mesh(geo.cap, mat.panel, -0.1, 0, 0)), rotZ(mesh(geo.cap, mat.panel, 0.1, 0, 0)));
    const ring = mesh(geo.ring, mat.accent, 0.08, 0, 0); ring.rotation.y = Math.PI / 2; mo.add(ring);
    for (let k = 0; k < 6; k++) { const fin = mesh(new THREE.BoxGeometry(0.16, 0.01, 0.02), mat.steel); const ang = (k / 6) * Math.PI * 2; fin.position.set(0, Math.cos(ang) * 0.112, Math.sin(ang) * 0.112); fin.rotation.x = ang; mo.add(fin); }
    g.add(mo); P(`motor-${i}`, 'anchors', mo, { explode: X(-0.55, 0.12, 0.1), glide: { anchors: AG, spool: [0, 0, 0] }, label: lb(1), labelWhen: when, labelAt: [-0.05, 0.12, 0] });
    // spool on the shaft (direct drive)
    const sp = grp(0.02, 0.4, -0.15); const spin = new THREE.Group(); sp.add(spin);
    spin.add(rotZ(mesh(geo.drum, mat.steel)), rotZ(mesh(geo.wound, wound)), rotZ(mesh(geo.flange, mat.panel, -0.062, 0, 0)), rotZ(mesh(geo.flange, mat.panel, 0.062, 0, 0)), rotZ(mesh(geo.shaft, mat.metal, -0.1, 0, 0)));
    for (let k = 0; k < 3; k++) { const s = mesh(geo.spoke, mat.dark, 0.07, 0, 0); s.rotation.x = (k / 3) * Math.PI; spin.add(s); }
    const lead = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 6), new THREE.MeshBasicMaterial({ color: 0xc6ff1a }), 0, 0, 0); // line from spool to pulley
    g.add(lead); model.leads = model.leads || []; model.leads.push({ lead, sp, g });
    g.add(sp); spoolsSpin.push(spin); P(`spool-${i}`, 'spool', sp, { explode: X(0.5, 0.35, 0.15), glide: { spool: [0.42, 0.12, 0.42], anchors: AG }, label: lb(1), labelWhen: when, labelAt: [0.07, 0.12, 0] });
    // AS5600 encoder board on the back of the motor, magnet on the shaft end
    const en = grp(-0.345, 0.4, -0.15, mesh(geo.board, mat.pcb), mesh(geo.ic, mat.chip, -0.009, 0, 0), mesh(geo.magnet, mat.copper, 0.02, 0, 0));
    en.children[2].rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) en.add(mesh(geo.pin, mat.brass ?? mat.copper, -0.01, -0.05 + k * 0.03, 0.06));
    g.add(en); P(`encoder-${i}`, 'spool', en, { explode: X(-1.05, 0.15, 0.1), glide: { spool: [-0.42, 0.12, 0.42], anchors: AG }, label: lb(1), labelWhen: when, labelAt: [0, 0.07, 0] });
    // exit pulley in a fork
    const pu = grp(0, 0, 0); const wh = mesh(geo.wheel, mat.metal); wh.rotation.y = Math.PI / 2; pu.add(wh); const hb = rotZ(mesh(geo.hubw, mat.dark)); pu.add(hb);
    pu.add(mesh(geo.fork, mat.panelDark, -0.03, 0.02, 0), mesh(geo.fork, mat.panelDark, 0.03, 0.02, 0));
    g.add(pu); pulleys.push(pu); P(`pulley-${i}`, 'anchors', pu, { explode: X(0, -0.45, 0.5), glide: { anchors: AG, cables: [0, 0, 0] }, label: lb(1), labelWhen: when, labelAt: [0, -0.06, 0] });
    // load cell between the pulley fork and the bracket
    const lc = grp(0, 0.075, -0.2, mesh(geo.cell, mat.metal), mesh(geo.gauge, mat.dark, 0, 0, 0.02), mesh(geo.lead, mat.accent, 0, 0.03, 0));
    lc.children[2].rotation.y = Math.PI / 2;
    g.add(lc); P(`loadcell-${i}`, 'anchors', lc, { explode: X(0.35, -0.2, 0.2), glide: { anchors: AG }, label: lb(2), labelWhen: when, labelAt: [0, 0.03, 0] });
    anchors.push(g);
  });
  // workspace camera on anchor 4's bracket
  {
    const g = anchors[3]; const cam = grp(0.25, 0.12, -0.18, mesh(new THREE.BoxGeometry(0.09, 0.07, 0.11), mat.panel), rotZ(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 20), mat.glass, 0, 0, 0)));
    cam.children[1].rotation.set(Math.PI / 2 + 0.6, 0, 0); cam.children[1].position.set(0, -0.03, 0.07);
    g.add(cam); P('wcam-0', 'electronics', cam, { explode: [0.5, 0.5, 0.2], glide: [0, -0.2, 0.3], label: 2, labelAt: [0, 0.05, 0] });
  }

  // ---- effector: pivot, pole, wrist, gripper ----
  const eff = new THREE.Group(); world.add(eff);
  const hub = grp(0, 0, 0, mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), mat.panel), mesh(new THREE.CylinderGeometry(0.123, 0.123, 0.012, 8), mat.accent, 0, -0.02, 0), mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), mat.dark));
  const eyes = [];
  sim.anchors.forEach((A) => { const dir = V(A[0], 0, -A[1]).normalize(); const e = mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 20), mat.metal, dir.x * 0.12, 0.03, dir.z * 0.12); e.lookAt(dir.x * 2, 0.03, dir.z * 2); hub.add(e); eyes.push(e); });
  hub.scale.setScalar(1.7); eff.add(hub); P('hub-0', 'effector', hub, { explode: [0, 0.75, 0], glide: [0, 0.35, 0], alsoIn: ['cables'], label: 1, labelAt: [0.12, 0.05, 0] });
  const sw = new THREE.Group(); eff.add(sw); // swings with the pole: its -y points from the pivot to the gripper
  const pole = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 14), mat.metal, 0, -0.25, 0);
  sw.add(pole); P('pole-0', 'effector', pole, { explode: [0.55, -0.1, 0], glide: [0.2, 0, 0], label: 2, labelAt: [0, 0.05, 0] });
  const wrist = new THREE.Group(); wrist.position.y = -0.5; wrist.scale.setScalar(1.7); sw.add(wrist);
  const half = new THREE.CylinderGeometry(0.1, 0.1, 0.18, 28, 1, false, 0, Math.PI);
  const shL = mesh(half, mat.panel, 0, -0.09, 0); shL.rotation.y = Math.PI / 2; const shR = mesh(half, mat.panel, 0, -0.09, 0); shR.rotation.y = -Math.PI / 2;
  const shLg = grp(0, 0, 0, shL, mesh(new THREE.BoxGeometry(0.01, 0.12, 0.02), mat.accent, -0.1, -0.09, 0)); const shRg = grp(0, 0, 0, shR);
  wrist.add(shLg, shRg);
  P('shell-0', 'effector', shLg, { explode: [-0.55, 0, 0], glide: [-0.32, 0, 0], label: 0, labelAt: [-0.1, -0.09, 0] });
  P('shell-1', 'effector', shRg, { explode: [0.55, 0, 0], glide: [0.32, 0, 0], label: 0 });
  const imu = grp(0, -0.06, 0, mesh(new THREE.BoxGeometry(0.1, 0.01, 0.08), mat.pcb), mesh(new THREE.BoxGeometry(0.03, 0.008, 0.03), mat.chip, 0, 0.008, 0));
  wrist.add(imu); P('imu-0', 'effector', imu, { explode: [0, 0.2, -0.6], glide: [0, 0.12, -0.32], label: 2, labelAt: [0.05, 0, 0] });
  const gcam = grp(0, -0.12, 0.03, mesh(new THREE.BoxGeometry(0.07, 0.05, 0.05), mat.dark), mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.03, 18), mat.glass, 0, -0.035, 0.0));
  wrist.add(gcam); P('gcam-0', 'effector', gcam, { explode: [0, -0.05, 0.65], glide: [0, 0, 0.35], label: 2, labelAt: [0, 0, 0.03] });
  const wsv = grp(0, -0.2, 0, mesh(new THREE.BoxGeometry(0.09, 0.05, 0.06), mat.dark), mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16), mat.accent, 0, -0.03, 0));
  wrist.add(wsv); P('wservo-0', 'gripper', wsv, { explode: [0, -0.35, -0.4], glide: [0, -0.12, -0.25], glideAlso: true, label: 0, alsoIn: ['effector'] });
  const grip = new THREE.Group(); grip.position.y = -0.5 - 0.24 * 1.7; grip.scale.setScalar(1.7); sw.add(grip);
  const palm = grp(0, 0, 0, mesh(new THREE.BoxGeometry(0.2, 0.045, 0.11), mat.panel), mesh(new THREE.BoxGeometry(0.2, 0.008, 0.112), mat.accent, 0, -0.024, 0));
  grip.add(palm); P('palm-0', 'gripper', palm, { explode: [0, -0.75, 0], glide: { gripper: [0, -0.35, 0], effector: [0, -0.2, 0] }, label: 1, labelAt: [0.1, 0, 0] });
  const fsv = grp(0, 0.04, -0.035, mesh(new THREE.BoxGeometry(0.07, 0.04, 0.04), mat.dark));
  grip.add(fsv); P('fservo-0', 'gripper', fsv, { explode: [0, -0.5, -0.55], glide: { gripper: [0, -0.2, -0.3], effector: [0, -0.2, 0] }, label: 2, labelAt: [0.035, 0, 0] });
  const fingers = [-1, 1].map((s, k) => {
    const f = new THREE.Group(); f.position.set(s * 0.075, -0.02, 0);
    const blade = mesh(new THREE.BoxGeometry(0.024, 0.16, 0.08), mat.panel, 0, -0.08, 0); const tip = mesh(new THREE.BoxGeometry(0.026, 0.03, 0.082), mat.rubber, -s * 0.004, -0.15, 0);
    f.add(blade, tip); grip.add(f);
    P(`finger-${k}`, 'gripper', f, { explode: [s * 0.45, -1.0, 0], glide: { gripper: [s * 0.18, -0.45, 0], effector: [0, -0.2, 0] }, label: k ? 0 : 2, labelAt: [0, -0.12, 0] });
    return { f, s };
  });

  // ---- cables ----
  const cableGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); const hitGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const cables = [0, 1, 2, 3].map((i) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xc6ff1a });
    const c = new THREE.Mesh(cableGeo, m); c.userData.noShadow = true; world.add(c);
    const hit = new THREE.Mesh(hitGeo, M.hit()); c.add(hit); hit.scale.set(5, 1, 5);
    const p = part({ id: `${i === 0 ? 'power' : 'line'}-${i}`, assembly: 'cables', obj: c, info: i === 0 ? INFO.power : INFO.line, label: i === 0 ? 1 : 2, labelText: i === 0 ? 'Line 1 · power' : `Line ${i + 1}`, labelAt: [0, 0.18, 0] });
    p.isCable = true; return { c, m: c.material, r: i === 0 ? 0.017 : 0.011 };
  });

  // ---- electronics enclosure on the floor by the back wall ----
  const bx = new THREE.Group(); const bpos = T([-2.3, 3.0, 0]); bx.position.copy(bpos); bx.rotation.y = Math.atan2(-bpos.x, -bpos.z); bx.scale.setScalar(1.25); world.add(bx);
  const base = new THREE.Group(); base.position.y = 0;
  const wallT = 0.02, BW = 0.9, BD = 0.6, BH = 0.22;
  base.add(mesh(new THREE.BoxGeometry(BW, 0.02, BD), mat.panelDark, 0, 0.01, 0));
  base.add(mesh(new THREE.BoxGeometry(BW, BH, wallT), mat.panelDark, 0, BH / 2, -BD / 2), mesh(new THREE.BoxGeometry(BW, BH, wallT), mat.panelDark, 0, BH / 2, BD / 2));
  base.add(mesh(new THREE.BoxGeometry(wallT, BH, BD), mat.panelDark, -BW / 2, BH / 2, 0), mesh(new THREE.BoxGeometry(wallT, BH, BD), mat.panelDark, BW / 2, BH / 2, 0));
  bx.add(base); P('box-0', 'electronics', base, { explode: [0, 0, 0], glide: [0, 0, 0], label: 2, labelAt: [BW / 2, 0.1, 0] });
  const lid = grp(0, BH + 0.015, 0, mesh(new THREE.BoxGeometry(BW + 0.02, 0.03, BD + 0.02), mat.panel), mesh(new THREE.BoxGeometry(0.3, 0.004, 0.02), mat.accent, -0.25, 0.017, BD / 2 - 0.05));
  bx.add(lid); P('lid-0', 'electronics', lid, { explode: [0, 1.0, 0], glide: [0, 0.55, -0.1], label: 0 });
  const stopMat0 = new THREE.MeshPhysicalMaterial({ color: 0x1b1d18, roughness: 0.4, metalness: 0.3, clearcoat: 0.6, emissive: new THREE.Color(0x000000) });
  const stop = grp(0.28, BH + 0.03, 0.1, mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.04, 28), mat.dark, 0, 0.02, 0), mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 32), stopMat0, 0, 0.055, 0), mesh(new THREE.TorusGeometry(0.07, 0.005, 8, 40), mat.accent, 0, 0.055, 0));
  stop.children[2].rotation.x = Math.PI / 2;
  bx.add(stop); const stopP = P('stop-0', 'electronics', stop, { explode: [0, 1.45, 0.1], glide: [0, 0.75, -0.1], label: 1, labelAt: [0, 0.07, 0] });
  const mcu = grp(-0.24, 0.04, -0.12, mesh(new THREE.BoxGeometry(0.26, 0.014, 0.16), mat.pcb), mesh(new THREE.BoxGeometry(0.06, 0.01, 0.06), mat.chip, 0.02, 0.012, 0), mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), mat.metal, -0.12, 0.016, 0.0));
  bx.add(mcu); P('mcu-0', 'electronics', mcu, { explode: [-0.25, 0.6, -0.1], glide: [0, 0.2, 0], label: 2, labelAt: [0, 0.02, 0] });
  for (let k = 0; k < 4; k++) {
    const dr = grp(0.06 + k * 0.1, 0.04, -0.14, mesh(new THREE.BoxGeometry(0.075, 0.012, 0.1), mat.pcb));
    for (let f = 0; f < 5; f++) dr.add(mesh(new THREE.BoxGeometry(0.05, 0.03, 0.006), mat.metal, 0, 0.02, -0.03 + f * 0.015));
    bx.add(dr); P(`driver-${k}`, 'electronics', dr, { explode: [0.1 + k * 0.08, 0.55 + k * 0.1, -0.2], glide: [0, 0.2, 0], label: k === 0 ? 2 : 0, labelAt: [0, 0.03, 0] });
    const am = grp(0.06 + k * 0.1, 0.035, 0.12, mesh(new THREE.BoxGeometry(0.06, 0.01, 0.05), mat.pcb), mesh(new THREE.BoxGeometry(0.02, 0.008, 0.02), mat.chip, 0, 0.008, 0));
    bx.add(am); P(`amp-${k}`, 'electronics', am, { explode: [0.1 + k * 0.08, 0.4 + k * 0.06, 0.3], glide: [0, 0.15, 0], label: k === 3 ? 2 : 0, labelAt: [0, 0.01, 0] });
  }
  const psu = grp(-0.24, 0.07, 0.14, mesh(new THREE.BoxGeometry(0.3, 0.11, 0.18), mat.metal));
  for (let k = 0; k < 7; k++) psu.add(mesh(new THREE.BoxGeometry(0.2, 0.004, 0.012), mat.dark, 0, 0.056, -0.07 + k * 0.022));
  bx.add(psu); P('psu-0', 'electronics', psu, { explode: [-0.55, 0.3, 0.45], glide: [0, 0.1, 0.1], label: 2, labelAt: [0, 0.06, 0] });

  // ---- per-frame: follow the sim, route the lines, spin the spools ----
  const up = V(0, 1, 0), tmp = V(0, 0, 0), q = new THREE.Quaternion(), a = V(0, 0, 0), b = V(0, 0, 0), cam = V(0, 0, 0), lastL = [0, 0, 0, 0];
  model.nearAnchor = 1;
  model.anchorFocus = (k) => { const i = model.nearAnchor; const p = anchorsW[i].clone(); const dir = V(-p.x, 0, -p.z).normalize(); return p.addScaledVector(dir, k * HW).add(V(0, -0.15, 0)).toArray(); };
  model.effFocus = (dy) => { eff.updateMatrixWorld(); const p = eff.position.clone(); p.y += -0.45 + dy * 0.35; return p.toArray(); };
  model.boxFocus = () => bx.position.clone().add(V(0, 0.6, 0)).toArray();
  model.update = (dt, api) => {
    const st = model.state; if (!st) return;
    const Pv = T(st.pivot), Gv = T(st.gripper);
    eff.position.copy(Pv);
    tmp.subVectors(Gv, Pv); if (tmp.lengthSq() > 1e-8) { q.setFromUnitVectors(V(0, -1, 0), tmp.clone().normalize()); sw.quaternion.copy(q); }
    contact.position.set(Gv.x, 0.004, Gv.z); const hgt = Math.max(0.05, Gv.y - 0.25); contact.scale.setScalar(0.5 + hgt * 0.35); contact.material.opacity = Math.max(0.15, 0.85 - hgt * 0.22);
    // fingers
    fingers.forEach(({ f, s }) => { f.rotation.z = s * (0.32 - 0.3 * model.grip); });
    // the anchor nearest the camera carries the labels
    if (api.camera) { let best = 1e9; anchorsW.forEach((p, i) => { const dd = p.distanceToSquared(api.camera.position); if (dd < best) { best = dd; model.nearAnchor = i; } }); }
    // lines: from each pulley to its eyelet on the hub
    const S = api.state, lim = sim.c.tLimit;
    world.updateMatrixWorld(true);
    cables.forEach((cb, i) => {
      pulleys[i].getWorldPosition(a); eyes[i].getWorldPosition(b);
      tmp.subVectors(b, a); const len = tmp.length();
      cb.c.position.copy(a).addScaledVector(tmp, 0.5); cb.c.scale.set(cb.r, len, cb.r); cb.c.quaternion.setFromUnitVectors(up, tmp.normalize());
      const col = tensionRGB(st.t[i], lim, st.slack[i] || st.relaxed); cb.m.color.setRGB(col[0] / 255, col[1] / 255, col[2] / 255, THREE.SRGBColorSpace);
      // spool turns with the line: dθ = dL / r, r = 36 mm
      const dl = st.L[i] - lastL[i]; lastL[i] = st.L[i]; if (Math.abs(dl) < 0.5) spoolsSpin[i].rotation.x += dl / 0.036;
    });
    // short lead from spool to pulley, only while the unit is assembled
    for (const { lead, sp, g } of model.leads) {
      const vis = sp.position.distanceTo(V(0.02, 0.4, -0.15)) < 0.02; lead.visible = vis && !S.assembly;
      if (vis) { a.set(0.02, 0.4 - 0.088, -0.15 + 0.03); b.set(0, 0.05, -0.02); tmp.subVectors(b, a); lead.position.copy(a).addScaledVector(tmp, 0.5); lead.scale.set(1, tmp.length(), 1); lead.quaternion.setFromUnitVectors(up, tmp.normalize()); }
      void g;
    }
    // status strip on the lid: coral while the lines are relaxed
    const strip = lid.children[1].material; strip.color.set(st.relaxed ? 0xff6b81 : 0xc6ff1a); if (strip.emissive) strip.emissive.set(st.relaxed ? 0x4a0a14 : 0x161e00);
  };
  void cards; void stopP;
  return model;
}
