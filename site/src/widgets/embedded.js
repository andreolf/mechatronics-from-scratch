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

export default W;
