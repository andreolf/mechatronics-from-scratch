// Widgets for Phase 10 (embedded systems). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const row = (...k) => h('div', { class: 'btn-row' }, ...k);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = (v, n = 8) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
function rect(P, x0, y0, x1, y1, fill, stroke) { P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke); }
function box(P, x0, y0, x1, y1, label, on, sub) {
  rect(P, x0, y0, x1, y1, on ? 'rgba(198,255,26,.16)' : '#15170f', on ? C.lime : C.rule2);
  const mid = (y0 + y1) / 2, dy = (y1 - y0) * 0.22;
  P.text(label, (x0 + x1) / 2, sub ? mid + dy * 0.3 : mid - dy * 0.35, on ? C.bone : C.fog, 'center');
  if (sub) P.text(sub, (x0 + x1) / 2, mid - dy * 1.25, C.dim, 'center');
}
function stepper(ctrls, n, get, set, id) {
  const lab = h('span', { class: 'widget-read', style: 'padding:0 8px' });
  const upd = () => { lab.textContent = `step ${get() + 1} / ${n}`; };
  ctrls.append(row(btn('Back', () => { set(Math.max(0, get() - 1)); upd(); }, id + '-back'), btn('Next', () => { set(Math.min(n - 1, get() + 1)); upd(); }, id + '-next'), btn('Reset', () => { set(0); upd(); }, id + '-reset'), lab));
  upd();
}

// p10-l01: MCU block diagram with bus paths
const OPS = {
  fetch: { path: ['core', 'icode', 'flash'], txt: 'instruction fetch over the I-code bus from flash; with wait states the prefetch buffer / ART cache hides most of the stall' },
  load: { path: ['core', 'sys', 'sram'], txt: 'LDR from SRAM over the system bus: 2 cycles, and it can overlap an instruction fetch (Harvard)' },
  gpio: { path: ['core', 'sys', 'bridge', 'periph'], txt: 'STR to GPIOA->BSRR: through the bus matrix and the AHB/APB bridge to the peripheral' },
  dma: { path: ['dma', 'sys', 'bridge', 'periph', 'sram'], txt: 'DMA moves ADC results to SRAM on its own bus master: the core keeps running' },
  irq: { path: ['periph', 'nvic', 'core'], txt: 'a timer raises an interrupt; the NVIC stacks 8 registers and jumps to the vector in about 12 cycles' },
};
W.mcuarch = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { op: 'fetch', ws: 5, art: true };
  const p = new Plot(body, { aspect: 0.95, maxH: 380, x: [0, 4], y: [0, 2.9], label: 'Block diagram of a Cortex-M microcontroller' });
  p.draw = (P) => {
    const on = new Set(OPS[s.op].path);
    const ln = (k, xs, ys) => P.line(xs, ys, on.has(k) ? C.lime : C.rule2, on.has(k) ? 3 : 1.5);
    ln('icode', [1.0, 1.0], [1.95, 1.45]); ln('sys', [1.55, 1.55], [1.95, 1.0]); ln('sys', [0.3, 3.7], [1.0, 1.0]);
    ln('sram', [2.2, 2.2], [1.0, 1.45]); ln('bridge', [3.2, 3.2], [1.0, 0.75]); ln('periph', [3.2, 3.2], [0.45, 0.35]); ln('dma', [0.55, 0.55], [0.75, 1.0]);
    ln('nvic', [1.95, 1.95], [2.25, 2.0]); ln('icode', [0.3, 1.0], [1.45, 1.45]);
    box(P, 0.15, 1.95, 1.75, 2.75, 'Core', on.has('core'), 'r0-r15, ALU');
    box(P, 1.85, 2.25, 3.85, 2.75, 'NVIC, SysTick', on.has('nvic'));
    box(P, 0.15, 1.45, 1.35, 1.85, 'Flash', on.has('flash'), s.ws + ' WS');
    box(P, 1.85, 1.45, 3.0, 1.85, 'SRAM', on.has('sram'));
    box(P, 0.15, 0.35, 1.05, 0.75, 'DMA', on.has('dma'));
    box(P, 2.55, 0.45, 3.85, 0.75, 'APB bridge', on.has('bridge'));
    box(P, 1.3, 0.02, 3.85, 0.35, 'GPIO TIM ADC UART', on.has('periph'));
    P.text('bus matrix', 2.7, 1.07, C.dim);
    const cpiLoop = s.art ? 1 : 1 + s.ws * 0.5; const cyc = 2 * cpiLoop + 2;
    read.innerHTML = `${OPS[s.op].txt} · a 2-instruction loop costs about <b>${cyc.toFixed(1)} cycles</b> per iteration with ${s.ws} wait states ${s.art ? 'and the ART accelerator on' : 'and no prefetch or cache'} (rough model: taken branch adds 2)`;
  };
  ctrls.append(select('Operation', [['fetch', 'Instruction fetch'], ['load', 'Load from SRAM'], ['gpio', 'Store to GPIO'], ['dma', 'DMA transfer'], ['irq', 'Interrupt']], s.op, (v) => { s.op = v; p.redraw(); }, 'arch-op'),
    slider('Flash wait states', { min: 0, max: 5, step: 1, value: s.ws, fmt: (v) => String(v) }, (v) => { s.ws = v; p.redraw(); }),
    row(toggle('ART prefetch/cache', true, (v) => { s.art = v; p.redraw(); }, { id: 'arch-art' })));
  p.redraw();
};

// p10-l02: build pipeline
const BUILD = [
  'main.c and rt.c are compiled separately: each becomes an object file with its own .text/.data/.bss and no final addresses',
  'main.o lists rt_puts as U (undefined); rt.o defines it as T. The linker matches every U with exactly one definition',
  'the linker script places .vectors first at 0x0, then .text and .rodata, and .data in RAM with its load copy in flash',
  'objcopy -O binary keeps only the loadable bytes: text + data, starting with SP and the reset vector',
  'the programmer (OpenOCD over SWD) writes fw.bin into flash; at reset the core reads word 0 and word 1',
];
W.buildpipe = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 0, gc: true };
  const p = new Plot(body, { aspect: 0.8, maxH: 340, x: [0, 4], y: [0, 2.4], label: 'Build pipeline from C files to flash' });
  p.draw = (P) => {
    const k = s.k; const col = (i) => k >= i;
    box(P, 0.05, 1.75, 0.85, 2.15, 'main.c', true); box(P, 0.05, 1.15, 0.85, 1.55, 'rt.c', true);
    P.arrow(0.9, 1.65, 1.15, 1.65, col(0) ? C.lime : C.rule2, 2);
    box(P, 1.2, 1.75, 2.0, 2.15, 'main.o', col(0), col(1) ? 'U rt_puts' : ''); box(P, 1.2, 1.15, 2.0, 1.55, 'rt.o', col(0), col(1) ? 'T rt_puts' : '');
    P.arrow(2.05, 1.65, 2.3, 1.65, col(2) ? C.lime : C.rule2, 2);
    box(P, 2.35, 1.15, 3.2, 2.15, 'fw.elf', col(2), 'link.ld');
    P.arrow(3.25, 1.65, 3.45, 1.65, col(3) ? C.lime : C.rule2, 2); box(P, 3.5, 1.4, 3.97, 1.9, '.bin', col(3));
    if (k >= 1) P.line([1.6, 1.6], [1.75, 1.55], C.warn, 1.5, [3, 3]);
    // section bar
    const secs = [['vec', 0.06, C.bad], ['.text', s.gc ? 0.5 : 0.62, C.lime], ['.rodata', 0.12, C.signal], ['.data(LMA)', 0.08, C.warn]];
    let x = 0.2; P.text('flash image', 0.2, 0.92, C.fog);
    secs.forEach(([n, w, c]) => { const ww = w * 3.6; rect(P, x, 0.35, x + ww, 0.75, k >= 2 ? c + '44' : '#15170f', k >= 2 ? c : C.rule2); if (k >= 2) P.text(n, x + 0.04, 0.5, C.bone); x += ww; });
    if (k >= 4) P.text('→ flash @ 0x08000000 (STM32) / 0x0 (QEMU)', 0.2, 0.12, C.lime);
    read.innerHTML = `<b>${k + 1}.</b> ${BUILD[k]} · --gc-sections ${s.gc ? 'on: unused_helper() removed, .text smaller' : 'off: every function kept'}`;
  };
  stepper(ctrls, BUILD.length, () => s.k, (v) => { s.k = v; p.redraw(); }, 'build');
  ctrls.append(row(toggle('--gc-sections', true, (v) => { s.gc = v; p.redraw(); }, { id: 'build-gc' })));
  p.redraw();
};

// p10-l03: memory map bars
W.memmap = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { text: 24, data: 2, bss: 8, stack: 4 }; const FL = 256, RAM = 64;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 1], y: [0, 2], label: 'Flash and RAM usage bars' });
  p.draw = (P) => {
    const bar = (y, total, parts, name) => {
      rect(P, 0.02, y, 0.98, y + 0.45, '#15170f', C.rule2); let x = 0.02;
      parts.forEach(([n, kb, c]) => { const w = 0.96 * kb / total; if (w <= 0) return; rect(P, x, y, Math.min(0.98, x + w), y + 0.45, c + '55', c); if (w > 0.09) P.text(n, x + 0.01, y + 0.17, C.bone); x += w; });
      P.text(name, 0.02, y + 0.55, C.fog); return x;
    };
    bar(1.25, FL, [['.text', s.text, C.lime], ['.data', s.data, C.warn]], `Flash ${FL} KiB @ 0x00000000`);
    const used = s.data + s.bss; const heap = RAM - used - s.stack;
    rect(P, 0.02, 0.2, 0.98, 0.65, '#15170f', C.rule2);
    let x = 0.02; [['.data', s.data, C.warn], ['.bss', s.bss, C.signal]].forEach(([n, kb, c]) => { const w = 0.96 * kb / RAM; rect(P, x, 0.2, Math.min(0.98, x + w), 0.65, c + '55', c); if (w > 0.09) P.text(n, x + 0.01, 0.37, C.bone); x += w; });
    const sw = 0.96 * s.stack / RAM; const sx = 0.98 - sw; rect(P, sx, 0.2, 0.98, 0.65, (heap < 0 ? C.bad : C.lime) + '33', heap < 0 ? C.bad : C.lime); if (sw > 0.09) P.text('stack', sx + 0.01, 0.37, C.bone);
    if (heap > 0 && 0.96 * heap / RAM > 0.12) P.text('heap →', x + 0.02, 0.37, C.dim);
    P.text(`RAM ${RAM} KiB @ 0x20000000`, 0.02, 0.75, C.fog);
    read.innerHTML = `flash used text + data = <b>${s.text + s.data} KiB</b> of ${FL} · RAM static data + bss = <b>${used} KiB</b>, stack reserve ${s.stack} KiB, heap ${heap >= 0 ? `<b>${heap} KiB</b>` : '—'} · ${heap < 0 ? '<b>link fails: ASSERT "RAM overflow"</b>' : '.data is counted in both memories: initial values in flash, live copy in RAM'}`;
  };
  ctrls.append(slider('.text + .rodata', { min: 4, max: 240, step: 4, value: s.text, fmt: (v) => v + ' KiB' }, (v) => { s.text = v; p.redraw(); }),
    slider('.data', { min: 0, max: 16, step: 1, value: s.data, fmt: (v) => v + ' KiB' }, (v) => { s.data = v; p.redraw(); }),
    slider('.bss', { min: 0, max: 64, step: 1, value: s.bss, fmt: (v) => v + ' KiB' }, (v) => { s.bss = v; p.redraw(); }),
    slider('Stack reserve', { min: 1, max: 16, step: 1, value: s.stack, fmt: (v) => v + ' KiB' }, (v) => { s.stack = v; p.redraw(); }));
  p.redraw();
};

// p10-l04: reset to main
const RESET = ['power on: registers and RAM hold garbage', 'core loads SP from word 0 (0x20010000)', 'core loads PC from word 1 (Reset_Handler | 1) and starts executing', 'copy .data: initial values from flash to RAM', 'zero .bss', 'call main(): globals are now what the C code says'];
W.resetstep = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 0, skip: false };
  const garbage = [0x5c, 0xe1, 0x07, 0xa9, 0x3f, 0xd2, 0x88, 0x14, 0x6b, 0xf0, 0x2e, 0x91];
  const init = [42, 3, 0xfffd, 7];
  const p = new Plot(body, { aspect: 0.58, maxH: 300, x: [0, 4], y: [0, 2.3], label: 'Reset sequence: registers and RAM words' });
  p.draw = (P) => {
    const k = s.k;
    P.text('SP', 0.1, 2.05, C.fog); P.text(k >= 1 ? '0x20010000' : '????????', 0.5, 2.05, k >= 1 ? C.lime : C.bad);
    P.text('PC', 2.1, 2.05, C.fog); P.text(k >= 2 ? (k >= 5 ? 'main' : 'Reset_Handler') : '????????', 2.5, 2.05, k >= 2 ? C.lime : C.bad);
    P.text('flash .data load copy', 0.1, 1.7, C.fog);
    init.forEach((v, i) => { rect(P, 0.1 + i * 0.95, 1.25, 0.95 + i * 0.95, 1.55, '#1d2410', C.warn); P.text(String(v), 0.2 + i * 0.95, 1.35, C.bone); });
    P.text('RAM: .data (4 words) then .bss (8 words)', 0.1, 1.05, C.fog);
    for (let i = 0; i < 12; i++) {
      const x = 0.1 + (i % 6) * 0.65, y = i < 6 ? 0.55 : 0.12; let v = garbage[i], c = C.bad;
      if (i < 4 && k >= 3 && !s.skip) { v = init[i]; c = C.warn; }
      if (i >= 4 && k >= 4) { v = 0; c = C.signal; }
      rect(P, x, y, x + 0.58, y + 0.33, c + '22', c); P.text(String(v), x + 0.06, y + 0.1, C.bone);
    }
    const ok = k >= 5 && !s.skip;
    read.innerHTML = `<b>${k + 1}.</b> ${RESET[k]} · global <code>answer</code> (first .data word) = <b>${k >= 3 && !s.skip ? 42 : garbage[0]}</b>${k >= 5 ? (ok ? ' ✓ test passes' : ' ✗ test fails: .data was never copied') : ''}`;
  };
  stepper(ctrls, RESET.length, () => s.k, (v) => { s.k = v; p.redraw(); }, 'reset');
  ctrls.append(row(toggle('Skip the .data copy', false, (v) => { s.skip = v; p.redraw(); }, { id: 'reset-skip', danger: true })));
  p.redraw();
};

// p10-l05: GPIO blink with a register view and the RMW hazard
W.gpioblink = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bsrr: true, isr: true, t: 2400 };
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [0, 4000], y: [-0.2, 3.2], label: 'Pin traces for PA5 (main loop) and PA6 (interrupt)' });
  const sim = () => {
    // main toggles PA5 every 500 ms with a 3-step RMW (when not using BSRR); the ISR sets PA6 at 1000 ms + 0 (during a main RMW) and at 2600 ms, clears at 3300 ms
    const ev = []; let odr = 0; const isrAt = { 1000: 'set', 2600: 'set', 3300: 'clr' };
    for (let t = 0; t <= 4000; t += 1) {
      if (t % 500 === 0 && t > 0) {
        if (s.bsrr) { odr = (odr & 0x20) ? odr & ~0x20 : odr | 0x20; }
        else { const copy = odr; if (isrAt[t] && s.isr) { odr = isrAt[t] === 'set' ? odr | 0x40 : odr & ~0x40; } odr = copy ^ 0x20; }
      }
      if (s.isr && isrAt[t] && (s.bsrr || t % 500 !== 0)) odr = isrAt[t] === 'set' ? odr | 0x40 : odr & ~0x40;
      ev.push(odr);
    }
    return ev;
  };
  p.draw = (P) => {
    const ev = sim(); const ts = ev.map((_, i) => i);
    P.axes({ xl: 't [ms]' });
    P.line(ts, ev.map((v) => 2 + 0.8 * ((v >> 5) & 1)), C.lime, 2); P.text('PA5', 30, 2.95, C.lime);
    P.line(ts, ev.map((v) => 0.4 + 0.8 * ((v >> 6) & 1)), C.signal, 2); P.text('PA6', 30, 1.35, C.signal);
    if (s.isr) [1000, 2600, 3300].forEach((t) => P.line([t, t], [0.2, 3.1], C.warn, 1, [3, 3]));
    P.line([s.t, s.t], [-0.2, 3.2], C.fog, 1);
    const v = ev[s.t] >>> 0; const bits = v.toString(2).padStart(8, '0');
    const lost = !s.bsrr && s.isr && ((ev[1200] >> 6) & 1) === 0;
    read.innerHTML = `at ${s.t} ms ODR[7:0] = <b>${bits}</b> (PA5 = ${(v >> 5) & 1}, PA6 = ${(v >> 6) & 1}) · main uses ${s.bsrr ? '<b>BSRR</b>: one store, atomic' : '<b>ODR ^= 1&lt;&lt;5</b>: load, xor, store'} · ${s.isr ? (lost ? '<b>the ISR set PA6 at 1000 ms between main\'s load and store, and main\'s store wiped it out</b>' : 'the ISR\'s writes to PA6 all survive') : 'no interrupt'}`;
  };
  ctrls.append(row(toggle('Main uses BSRR', true, (v) => { s.bsrr = v; p.redraw(); }, { id: 'gpio-bsrr' }), toggle('ISR writes PA6', true, (v) => { s.isr = v; p.redraw(); }, { id: 'gpio-isr' })),
    slider('Cursor', { min: 0, max: 4000, step: 10, value: s.t, fmt: (v) => v + ' ms' }, (v) => { s.t = v; p.redraw(); }));
  p.redraw();
};

// p10-l06: field insert / extract on a 32-bit register
W.regview = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { pos: 4, w: 3, val: 5, masked: true, reg: 0xFFFFFF0F };
  const p = new Plot(body, { aspect: 0.42, maxH: 220, x: [0, 32], y: [0, 3.5], label: 'Bits of a 32-bit register before and after a field insert' });
  p.draw = (P) => {
    const w = Math.min(s.w, 32 - s.pos); const mw = (0xFFFFFFFF >>> (32 - w)) >>> 0; const M = (mw << s.pos) >>> 0;
    const ins = s.masked ? ((s.val & mw) << s.pos) >>> 0 : (s.val << s.pos) >>> 0;
    const out = (((s.reg & ~M) >>> 0) | ins) >>> 0;
    const rowBits = (y, v, lab) => { P.text(lab, 12, y + 0.6, C.fog); for (let b = 31; b >= 0; b--) { const x = 31 - b; const bit = (v >>> b) & 1; const inF = (M >>> b) & 1; const spill = !inF && ((ins >>> b) & 1) && lab === 'result'; rect(P, x + 0.08, y, x + 0.92, y + 0.45, bit ? (spill ? C.bad : inF ? C.lime : C.fog) : '#15170f', inF ? C.lime : C.rule2); } };
    rowBits(2.2, s.reg, 'before'); rowBits(1.2, M, 'mask'); rowBits(0.2, out, 'result');
    [31, 24, 16, 8, 0].forEach((b) => P.text(String(b), 31 - b + 0.2, 3.05, C.dim, 'left'));
    const spill = (ins & ~M) >>> 0;
    read.innerHTML = `field p = ${s.pos}, w = ${w}: mask ${hex(M)} · insert ${s.val} → result <b>${hex(out)}</b> · read back ${((out >>> s.pos) & mw) >>> 0}${spill ? ` · <b>unmasked value spilled into bits outside the field (${hex(spill)})</b>` : ''}`;
  };
  ctrls.append(slider('Position p', { min: 0, max: 31, step: 1, value: s.pos, fmt: (v) => String(v) }, (v) => { s.pos = v; p.redraw(); }),
    slider('Width w', { min: 1, max: 8, step: 1, value: s.w, fmt: (v) => String(v) }, (v) => { s.w = v; p.redraw(); }),
    slider('Value', { min: 0, max: 255, step: 1, value: s.val, fmt: (v) => String(v) }, (v) => { s.val = v; p.redraw(); }),
    row(toggle('Mask the value', true, (v) => { s.masked = v; p.redraw(); }, { id: 'reg-mask' }), btn('Register 0', () => { s.reg = 0; p.redraw(); }, 'reg-zero'), btn('Register 0xFFFFFF0F', () => { s.reg = 0xFFFFFF0F; p.redraw(); }, 'reg-ff')));
  p.redraw();
};

// p10-l07: clock tree with PLL limits
W.clocktree = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { hse: 8, m: 4, n: 168, p: 2, q: 7 };
  const p = new Plot(body, { aspect: 0.7, maxH: 330, x: [0, 4], y: [0, 2.6], label: 'STM32F407 clock tree from the crystal to the buses' });
  p.draw = (P) => {
    const vin = s.hse / s.m, vco = vin * s.n, sys = vco / s.p, usb = vco / s.q;
    const okIn = vin >= 1 && vin <= 2, okV = vco >= 100 && vco <= 432, okS = sys <= 168, okU = Math.abs(usb - 48) < 1e-9;
    const st = (ok) => (ok ? C.lime : C.bad);
    const b2 = (x0, y0, x1, y1, t, sub, ok) => { rect(P, x0, y0, x1, y1, ok ? 'rgba(198,255,26,.10)' : 'rgba(255,107,91,.15)', st(ok)); P.text(t, (x0 + x1) / 2, (y0 + y1) / 2 + 0.03, C.bone, 'center'); P.text(sub, (x0 + x1) / 2, y0 - 0.16, ok ? C.fog : C.bad, 'center'); };
    b2(0.05, 1.9, 0.75, 2.3, 'HSE', s.hse + ' MHz', true); P.arrow(0.78, 2.1, 0.95, 2.1, C.fog, 1.5);
    b2(1.0, 1.9, 1.5, 2.3, '/M', vin.toFixed(2) + ' MHz', okIn); P.arrow(1.53, 2.1, 1.7, 2.1, C.fog, 1.5);
    b2(1.75, 1.9, 2.55, 2.3, '×N VCO', vco.toFixed(0) + ' MHz', okV);
    P.line([2.15, 2.15], [1.9, 1.35], C.fog, 1.5); P.line([2.15, 3.1], [1.6, 1.6], C.fog, 1.5);
    b2(1.75, 0.95, 2.55, 1.35, '/P', sys.toFixed(1) + ' MHz', okS); b2(3.0, 1.6, 3.6, 2.0, '/Q', usb.toFixed(1) + ' MHz', okU);
    P.line([2.15, 2.15], [0.95, 0.75], C.fog, 1.5); P.line([0.4, 3.6], [0.75, 0.75], C.fog, 1.5);
    const ahb = sys, apb2 = sys / 2, apb1 = sys / 4;
    b2(0.1, 0.2, 1.2, 0.55, 'AHB /1', ahb.toFixed(0) + ' MHz', ahb <= 168); b2(1.45, 0.2, 2.55, 0.55, 'APB2 /2', apb2.toFixed(0) + ' MHz', apb2 <= 84); b2(2.8, 0.2, 3.9, 0.55, 'APB1 /4', apb1.toFixed(0) + ' MHz', apb1 <= 42);
    [0.65, 2.0, 3.35].forEach((x) => P.line([x, x], [0.75, 0.55], C.fog, 1.5));
    const ws = Math.ceil(sys / 30) - 1; const cfg = (s.m | (s.n << 6) | ((s.p / 2 - 1) << 16) | (1 << 22) | (s.q << 24)) >>> 0;
    const bad = [!okIn && 'VCO input must be 1–2 MHz', !okV && 'VCO must be 100–432 MHz', !okS && 'SYSCLK over 168 MHz', !okU && 'USB is not 48 MHz'].filter(Boolean);
    read.innerHTML = `SYSCLK = ${s.hse}·${s.n}/(${s.m}·${s.p}) = <b>${sys.toFixed(2)} MHz</b> · flash wait states ${Math.max(0, ws)} · APB1 timers ${(apb1 * 2).toFixed(0)} MHz · RCC_PLLCFGR = ${hex(cfg)} · ${bad.length ? '<b>' + bad.join('; ') + '</b>' : 'all stages inside their limits'}`;
  };
  ctrls.append(select('Crystal (HSE)', [['8', '8 MHz'], ['25', '25 MHz'], ['12', '12 MHz']], '8', (v) => { s.hse = +v; p.redraw(); }, 'clk-hse'),
    slider('M', { min: 2, max: 63, step: 1, value: s.m, fmt: (v) => String(v) }, (v) => { s.m = v; p.redraw(); }),
    slider('N', { min: 50, max: 432, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; p.redraw(); }),
    select('P', [['2', '2'], ['4', '4'], ['6', '6'], ['8', '8']], '2', (v) => { s.p = +v; p.redraw(); }, 'clk-p'),
    slider('Q', { min: 2, max: 15, step: 1, value: s.q, fmt: (v) => String(v) }, (v) => { s.q = v; p.redraw(); }));
  p.redraw();
};

// p10-l08: timer sawtooth and update events
W.timerpsc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { psc: 83, arr: 999, target: 1000 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 5], y: [0, 1.15], label: 'Timer counter value over time with update events' });
  p.draw = (P) => {
    const fclk = 84e6; const f = fclk / ((s.psc + 1) * (s.arr + 1)); const T = 1 / f; const span = 5 / s.target;
    P.axes({ xl: 't [ms]', yl: 'CNT / ARR' });
    const xs = [], ys = [];
    for (let i = 0; i <= 600; i++) { const t = span * i / 600; const ph = (t % T) / T; xs.push(t * s.target); ys.push(ph); }
    P.line(xs, ys, C.lime, 2);
    for (let k = 1; k * T <= span; k++) P.dot(k * T * s.target, 0, C.warn, 4);
    for (let k = 1; k <= 5; k++) P.line([k, k], [0, 1.1], C.rule2, 1, [3, 4]);
    const err = (f - s.target) / s.target * 100;
    read.innerHTML = `f<sub>update</sub> = 84 MHz / ((${s.psc}+1)(${s.arr}+1)) = <b>${f.toFixed(3)} Hz</b> · target ${s.target} Hz (dashed grid, x-axis in target periods) · error ${err.toFixed(4)} % ${Math.abs(err) < 0.1 ? '✓ within 0.1 %' : ''} · counter tick ${((s.psc + 1) / 84).toFixed(3)} µs, ${s.arr + 1} steps of resolution`;
  };
  ctrls.append(select('Target', [['1000', '1 kHz control tick'], ['20000', '20 kHz PWM'], ['44100', '44.1 kHz audio'], ['50', '50 Hz servo frame']], '1000', (v) => { s.target = +v; p.redraw(); }, 'tim-target'),
    slider('PSC', { min: 0, max: 1000, step: 1, value: s.psc, fmt: (v) => String(v) }, (v) => { s.psc = v; p.redraw(); }),
    slider('ARR', { min: 99, max: 65535, step: 1, value: s.arr, fmt: (v) => String(v) }, (v) => { s.arr = v; p.redraw(); }),
    row(btn('Best split', () => {
      let best = [1e9, 0, 0]; const K = 84e6 / s.target;
      for (let psc = 0; psc <= 65535; psc++) { const a = Math.round(K / (psc + 1)); if (a < 1 || a > 65536) continue; const e = Math.abs(84e6 / ((psc + 1) * a) - s.target); if (e < best[0] - 1e-9) best = [e, psc, a - 1]; }
      s.psc = best[1]; s.arr = best[2]; const inp = ctrls.querySelectorAll('input[type=range]'); inp[0].value = Math.min(1000, s.psc); inp[1].value = s.arr; inp[0].dispatchEvent(new Event('input')); inp[1].dispatchEvent(new Event('input')); s.psc = best[1]; p.redraw();
    }, 'tim-best')));
  p.redraw();
};

// p10-l09: NVIC timeline
W.nvictl = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { uartHi: false, crit: 0 };
  const p = new Plot(body, { aspect: 0.55, maxH: 290, x: [0, 3000], y: [0, 3.3], label: 'Timeline of main loop, timer ISR and UART ISR' });
  p.draw = (P) => {
    // time in µs; timer ISR every 1000 µs lasting 60; UART ISR at 900 and 1950 lasting 180; main critical section of s.crit µs starting at 960 and 2990-...
    const tim = [], uart = [[900, 180], [1940, 180]], crit = s.crit ? [[970, s.crit], [1985, s.crit]] : [];
    const busy = []; const starts = [];
    for (let k = 0; k < 3; k++) {
      const due = 1000 * k + 30; let start = due;
      crit.forEach(([a, d]) => { if (start >= a && start < a + d) start = a + d; });
      uart.forEach(([a, d]) => { if (s.uartHi && start >= a && start < a + d) start = a + d; });
      starts.push([due, start]); tim.push([start, 60]);
    }
    const row = (y, segs, c, lab) => { P.text(lab, 10, y + 0.45, C.fog); segs.forEach(([a, d]) => rect(P, a, y, a + d, y + 0.3, c + '66', c)); };
    P.axes({ xl: 't [µs]' });
    row(2.4, tim, C.lime, 'timer ISR (1 kHz)'); row(1.4, uart, C.signal, `UART ISR (${s.uartHi ? 'more urgent' : 'less urgent'})`);
    row(0.4, crit, C.bad, 'main: interrupts disabled');
    starts.forEach(([due, st]) => { P.line([due, due], [2.3, 2.85], C.warn, 1, [3, 3]); });
    if (s.uartHi) tim.forEach(([a]) => uart.forEach(([u, d]) => { if (a >= u && a < u + d) P.text('waits', a, 2.15, C.bad); }));
    const lat = starts.map(([d, st]) => st - d); const per = [starts[1][1] - starts[0][1], starts[2][1] - starts[1][1]];
    read.innerHTML = `timer ISR start delays: ${lat.map((v) => v.toFixed(0)).join(', ')} µs · periods ${per.map((v) => v.toFixed(0)).join(', ')} µs · jitter <b>${(Math.max(...lat) - Math.min(...lat)).toFixed(0)} µs</b> · ${s.uartHi ? 'the UART ISR is more urgent, so a timer tick that arrives while it runs must wait' : 'the timer is more urgent and preempts the UART ISR (lower number = more urgent)'}${s.crit ? ' · a critical section holds off every interrupt until it ends' : ''}`;
  };
  ctrls.append(row(toggle('UART more urgent than timer', false, (v) => { s.uartHi = v; p.redraw(); }, { id: 'nvic-uart' })),
    slider('Critical section in main', { min: 0, max: 120, step: 5, value: s.crit, fmt: (v) => v + ' µs' }, (v) => { s.crit = v; p.redraw(); }));
  p.redraw();
};

// p10-l10: race interleaving
W.racetime = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { at: 1, kind: 'read', fix: false };
  const p = new Plot(body, { aspect: 0.6, maxH: 300, x: [0, 8], y: [0, 2.2], label: 'Main loop instructions with an interrupt inserted between two of them' });
  p.draw = (P) => {
    const prog = s.kind === 'read' ? (s.fix ? ['ldr hi', 'ldr lo', 'ldr hi', 'cmp', 'bne retry'] : ['ldr lo', 'ldr hi']) : (s.fix ? ['cpsid i', 'ldr flags', 'orr', 'str flags', 'cpsie i'] : ['ldr flags', 'orr #1', 'str flags']);
    const n = prog.length; const at = Math.min(s.at, n); let x = 0.2;
    for (let i = 0; i <= n; i++) {
      if (i === at) { const masked = s.kind === 'rmw' && s.fix && i > 0 && i < n; rect(P, x, 1.25, x + 1.1, 1.75, masked ? '#2a1a14' : 'rgba(255,181,71,.25)', masked ? C.bad : C.warn); P.text(masked ? 'ISR pending' : 'ISR', x + 0.55, 1.42, C.bone, 'center'); x += 1.25; }
      if (i < n) { rect(P, x, 0.45, x + 1.1, 0.95, '#15170f', C.rule2); P.text(prog[i], x + 0.55, 0.62, C.bone, 'center'); x += 1.25; }
    }
    let msg;
    if (s.kind === 'read') {
      if (!s.fix) msg = at === 1 ? 'main read lo = 0xFFFFFFFF (old) and hi = 6 (new): <b>6:0xFFFFFFFF, 2³² ms in the future</b>' : `consistent read: ${at === 0 ? '6:0x00000000 (new)' : '5:0xFFFFFFFF (old)'}`;
      else msg = at >= 1 && at <= 2 ? 'hi changed between the two hi reads, so the loop <b>retries</b> and returns 6:0x00000000' : 'both hi reads agree: consistent value';
    } else {
      if (!s.fix) msg = at === 1 || at === 2 ? "the ISR set bit 1 after main's load; main's store writes the stale copy: <b>ISR bit lost</b>" : 'flags = 0b11, both bits kept';
      else msg = at >= 1 && at <= 4 ? 'interrupts are masked, the ISR stays pending and runs after cpsie: flags = 0b11' : 'flags = 0b11, both bits kept';
    }
    read.innerHTML = `${s.kind === 'read' ? '64-bit counter at 5:0xFFFFFFFF; the ISR wraps lo and increments hi' : 'main sets bit 0, the ISR sets bit 1'} · ISR after instruction ${at} · ${msg}`;
  };
  ctrls.append(select('Hazard', [['read', 'Torn 64-bit read'], ['rmw', 'Lost read-modify-write']], 'read', (v) => { s.kind = v; p.redraw(); }, 'race-kind'),
    slider('ISR fires after instruction', { min: 0, max: 5, step: 1, value: s.at, fmt: (v) => String(v) }, (v) => { s.at = v; p.redraw(); }),
    row(toggle('Apply the fix', false, (v) => { s.fix = v; p.redraw(); }, { id: 'race-fix' })));
  p.redraw();
};

// p10-l11: complementary PWM with dead time
const dtgDecode = (d) => ((d & 0x80) === 0 ? d : (d & 0xc0) === 0x80 ? (64 + (d & 0x3f)) * 2 : (d & 0xe0) === 0xc0 ? (32 + (d & 0x1f)) * 8 : (32 + (d & 0x1f)) * 16);
W.pwmdead = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { duty: 30, dt: 1000 }; const ARR = 4200, F = 168e6;
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [0, 2 * 2 * ARR], y: [0, 4.3], label: 'Centre-aligned counter, reference and complementary outputs' });
  p.draw = (P) => {
    const ccr = Math.round(s.duty / 100 * ARR); const want = Math.ceil(s.dt * 1e-9 * F - 1e-6);
    let code = -1, best = 1e9; for (let d = 0; d < 256; d++) { const v = dtgDecode(d); if (v >= want && v < best) { best = v; code = d; } }
    const dt = code < 0 ? 0 : best; const N = 4 * ARR;
    const ts = [], cnt = [], ref = [], ch = [], chn = []; let prev = 0, since = 1e9;
    for (let t = 0; t < N; t += 6) { const tt = t % (2 * ARR); const c = tt <= ARR ? tt : 2 * ARR - tt; const r = c < ccr ? 1 : 0; if (r !== prev) { since = 0; prev = r; } else since += 6; ts.push(t); cnt.push(3.3 + 0.9 * c / ARR); ref.push(2.3 + 0.6 * r); ch.push(1.3 + 0.6 * (r && since >= dt ? 1 : 0)); chn.push(0.3 + 0.6 * (!r && since >= dt ? 1 : 0)); }
    P.line(ts, cnt, C.fog, 1.5); P.line([0, N], [3.3 + 0.9 * ccr / ARR, 3.3 + 0.9 * ccr / ARR], C.warn, 1, [4, 3]);
    P.line(ts, ref, C.bone, 1.5); P.line(ts, ch, C.lime, 2); P.line(ts, chn, C.signal, 2);
    P.text('CNT', 40, 4.05, C.fog); P.text('OC1REF', 40, 3.0, C.bone); P.text('CH1', 40, 2.0, C.lime); P.text('CH1N', 40, 1.0, C.signal);
    const hi = Math.max(0, 2 * ccr - dt);
    read.innerHTML = `ARR ${ARR} (20 kHz), CCR = <b>${ccr}</b> · dead time ${s.dt} ns = ${want} counts → DTG <b>${code < 0 ? 'out of range' : hex(code, 2)}</b> = ${dt} counts (${(dt / F * 1e9).toFixed(0)} ns, rounded up) · CH1 high ≈ ${hi} of ${2 * ARR} counts (${(100 * hi / (2 * ARR)).toFixed(1)} %) · CH1 and CH1N never overlap`;
  };
  ctrls.append(slider('Duty', { min: 0, max: 100, step: 1, value: s.duty, fmt: (v) => v + ' %' }, (v) => { s.duty = v; p.redraw(); }),
    slider('Dead time', { min: 0, max: 6000, step: 50, value: s.dt, fmt: (v) => v + ' ns' }, (v) => { s.dt = v; p.redraw(); }));
  p.redraw();
};

// p10-l12: encoder counter and the two speed estimates
W.encodermode = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { rpm: 7 }; const CPR = 4000;
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [0, 100], y: [-0.1, 3.3], label: 'Encoder counter and speed estimates over 100 ms' });
  p.draw = (P) => {
    const w = s.rpm / 60; // rev/s
    P.axes({ xl: 't [ms]' });
    // counter (16-bit, shown mod 65536 scaled), starting near wrap
    const xs = [], cs = [], ms = [], tsv = []; let prevC = Math.floor(65400);
    for (let t = 0; t <= 100; t += 1) { const c = Math.floor(65400 + w * CPR * t / 1000); xs.push(t); cs.push(2.2 + ((c % 65536) / 65536)); if (t > 0) { const dn = ((c - prevC) % 65536 + 65536) % 65536; ms.push([t, dn / CPR / 1e-3 * 60]); } prevC = c; }
    P.line(xs, cs, C.fog, 1.5); P.text('CNT (16-bit)', 2, 3.15, C.fog);
    const ymax = Math.max(s.rpm * 2.2, 40); const sc = (v) => 0.1 + 1.8 * v / ymax;
    P.line([0, 100], [sc(s.rpm), sc(s.rpm)], C.dim, 1, [4, 3]);
    P.line(ms.map((m) => m[0]), ms.map((m) => sc(m[1])), C.warn, 1.5);
    const period = 60 / (s.rpm * 1000); const tEst = 60 / (Math.round(period * 1e6) * 1e-6 * 1000);
    P.line([0, 100], [sc(tEst), sc(tEst)], C.lime, 2);
    P.text('M (amber) vs T (lime)', 2, 2.0, C.fog);
    const per = w * CPR * 1e-3; const vals = ms.map((m) => m[1]); const spread = Math.max(...vals) - Math.min(...vals);
    read.innerHTML = `${s.rpm} rpm, 1000 lines x4 · ${per.toFixed(2)} counts per 1 ms sample · M estimates jump by ${spread.toFixed(0)} rpm (one count = 15 rpm) · T estimate from a ${(period * 1e3).toFixed(3)} ms captured period: <b>${tEst.toFixed(3)} rpm</b>`;
  };
  ctrls.append(slider('Speed', { min: 1, max: 600, step: 1, value: s.rpm, fmt: (v) => v + ' rpm' }, (v) => { s.rpm = v; p.redraw(); }));
  p.redraw();
};

export default W;
