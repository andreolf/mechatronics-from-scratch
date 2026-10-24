var e=`p10-l09`,t=40,n=`An interrupt lets hardware stop the main loop within a few hundred nanoseconds to run a handler. You learn how the NVIC prioritises, preempts and tail-chains exceptions and what entry latency costs, write a 1 kHz SysTick interrupt that runs a control-loop step, and measure its period jitter in QEMU against an independent hardware timer, first clean and then with a main loop that disables interrupts for too long.`,r=`<h2 id="what-happens-on-an-interrupt">What happens on an interrupt</h2>
<p>When a peripheral raises an interrupt request and the NVIC (nested vectored interrupt controller) decides it should run, a Cortex-M3/M4 does in hardware:</p>
<ol>
<li>finishes (or abandons and restarts) the current instruction;</li>
<li><strong>stacks</strong> eight registers, r0–r3, r12, LR, PC and xPSR, onto the current stack, which is exactly what the C calling convention says a function may clobber;</li>
<li>loads the handler address from the vector table and puts a special <strong>EXC_RETURN</strong> value in LR;</li>
<li>runs the handler, an ordinary C function. Returning (<code>bx lr</code> with EXC_RETURN) unstacks the eight registers.</li>
</ol>
<p>On a Cortex-M3/M4 with zero-wait-state memory the entry takes <strong>12 cycles</strong> and the exit 10. Back-to-back interrupts are <strong>tail-chained</strong>: the core skips the unstack/restack and goes from one handler to the next in 6 cycles.</p>
<h2 id="priority-and-preemption">Priority and preemption</h2>
<p>Each interrupt has a priority number; <strong>lower numbers are more urgent</strong>. STM32 parts implement 4 priority bits, so 16 levels, kept in the upper bits of each 8-bit priority field. The priority group splits those bits into:</p>
<ul>
<li><strong>preemption priority</strong>: a handler can interrupt (preempt) a running handler only if its preemption priority is strictly more urgent;</li>
<li><strong>subpriority</strong>: only decides which of two <em>pending</em> interrupts runs first.</li>
</ul>
<p>Worst-case latency for an interrupt is its entry time plus the longest stretch it can’t run: a higher-priority handler, or a <strong>critical section</strong> where code has disabled interrupts with <code>cpsid i</code> / <code>__disable_irq()</code>. That’s why critical sections must be short and bounded.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="nvictl" data-args="{}"></div></div><figcaption>A timeline of the main loop (grey), a 1 kHz timer ISR (lime) and a UART ISR (blue). Raise the UART’s priority above the timer’s to see preemption, and add a critical section in main to see the timer’s start time jitter.</figcaption></figure>
<h2 id="measuring-jitter">Measuring jitter</h2>
<p>A control loop driven by a timer interrupt assumes a constant sample time <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>. If the ISR starts <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0379em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> late on tick <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span>, the actual period is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">s</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8444em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0379em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9028em;vertical-align:-0.2083em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0379em;">δ</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0379em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span><span class="mbin mtight">−</span><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span></span></span></span>, and the <strong>jitter</strong> is the spread of that period:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0962em;">J</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.4354em;vertical-align:-0.7521em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.4306em;"><span style="top:-2.3479em;margin-left:0em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span><span class="mop">max</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.7521em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">−</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.4354em;vertical-align:-0.7521em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6679em;"><span style="top:-2.3479em;margin-left:0em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span><span class="mop">min</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.7521em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1389em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>On hardware you’d toggle a pin in the ISR and measure on a scope. In QEMU we read an <em>independent</em> free-running timer (the MPS2 board’s CMSDK TIMER0, also clocked at 25 MHz, so 40 ns per count) at ISR entry. As in lesson 01, QEMU with <code>-icount shift=0</code> executes 1 instruction per ns and doesn’t model the 12-cycle entry, so this tests <strong>where the interrupt is taken</strong>, not the silicon’s latency. That’s exactly where a long critical section hurts.</p>
<h2 id="worked-example">Worked example</h2>
<p>A 1 kHz tick from SysTick at 25 MHz.</p>
<ol>
<li>Reload = 25 000 − 1 = 24 999, period 25 000 counts = 1 ms.</li>
<li>A clean main loop: the ISR is taken at the next instruction boundary, so periods are 25 000 ± 1 count, jitter ≤ 40 ns.</li>
<li>A main loop that disables interrupts for 5000 instructions (5 µs in QEMU) can delay the ISR up to 5 µs: jitter up to 125 counts.</li>
<li>On a 168 MHz Cortex-M4, 12 cycles of entry is 71 ns, and a 1 µs jitter budget means no critical section longer than about 168 cycles.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p>The ISR timestamps itself with TIMER0 and runs one step of a discrete PI controller on a first-order plant, so you can see the “control loop” really runs at 1 kHz. <code>run.py</code> builds two variants, clean and with critical sections, and checks the jitter.</p>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">link.ld</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-ld"><span class="hljs-comment">/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */</span>
<span class="hljs-keyword">MEMORY</span> {
  FLASH (rx)  : <span class="hljs-keyword">ORIGIN</span> = <span class="hljs-number">0x00000000</span>, <span class="hljs-keyword">LENGTH</span> = <span class="hljs-number">256</span>K
  RAM   (rwx) : <span class="hljs-keyword">ORIGIN</span> = <span class="hljs-number">0x20000000</span>, <span class="hljs-keyword">LENGTH</span> = <span class="hljs-number">64</span>K
}
<span class="hljs-keyword">ENTRY</span>(Reset_Handler)
<span class="hljs-keyword">SECTIONS</span> {
  <span class="hljs-string">.text</span> : { <span class="hljs-keyword">KEEP</span>(*(<span class="hljs-string">.vectors</span>)) *(<span class="hljs-string">.text</span>*) *(<span class="hljs-string">.rodata</span>*) . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>); } &gt; FLASH
  <span class="hljs-string">.data</span> : { _sdata = .; *(<span class="hljs-string">.data</span>*) . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>); _edata = .; } &gt; RAM AT &gt; FLASH
  _sidata = <span class="hljs-keyword">LOADADDR</span>(<span class="hljs-string">.data</span>);
  <span class="hljs-string">.bss</span> (NOLOAD) : { _sbss = .; *(<span class="hljs-string">.bss</span>*) *(COMMON) . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>); _ebss = .; } &gt; RAM
  _estack = <span class="hljs-keyword">ORIGIN</span>(RAM) + <span class="hljs-keyword">LENGTH</span>(RAM);
}</code></pre></div>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">rt.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* rt.c: minimal Cortex-M runtime. Vector table, reset handler, semihosting print and exit. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-keyword">extern</span> <span class="hljs-type">uint32_t</span> _sidata, _sdata, _edata, _sbss, _ebss, _estack;
<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span>;

<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">semihost</span><span class="hljs-params">(<span class="hljs-type">int</span> op, <span class="hljs-type">const</span> <span class="hljs-type">void</span> *arg)</span> {          <span class="hljs-comment">/* bkpt 0xAB traps to the debugger (QEMU) */</span>
  <span class="hljs-keyword">register</span> <span class="hljs-type">int</span> r0 __asm__(<span class="hljs-string">&quot;r0&quot;</span>) = op;
  <span class="hljs-keyword">register</span> <span class="hljs-type">const</span> <span class="hljs-type">void</span> *r1 __asm__(<span class="hljs-string">&quot;r1&quot;</span>) = arg;
  __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;bkpt 0xAB&quot;</span> : <span class="hljs-string">&quot;+r&quot;</span>(r0) : <span class="hljs-string">&quot;r&quot;</span>(r1) : <span class="hljs-string">&quot;memory&quot;</span>)</span>;
  <span class="hljs-keyword">return</span> r0;
}
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span> { semihost(<span class="hljs-number">0x04</span>, s); }      <span class="hljs-comment">/* SYS_WRITE0 */</span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span> {
  <span class="hljs-type">char</span> b[<span class="hljs-number">12</span>]; <span class="hljs-type">int</span> i = <span class="hljs-number">11</span>; b[i] = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">do</span> { b[--i] = (<span class="hljs-type">char</span>)(<span class="hljs-string">&#x27;0&#x27;</span> + v % <span class="hljs-number">10</span>); v /= <span class="hljs-number">10</span>; } <span class="hljs-keyword">while</span> (v);
  rt_puts(&amp;b[i]);
}
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_exit</span><span class="hljs-params">(<span class="hljs-type">int</span> code)</span> {                                <span class="hljs-comment">/* SYS_EXIT: QEMU exits 0 for &quot;application exit&quot;, 1 otherwise */</span>
  semihost(<span class="hljs-number">0x18</span>, (<span class="hljs-type">const</span> <span class="hljs-type">void</span> *)(<span class="hljs-type">uintptr_t</span>)(code ? <span class="hljs-number">0x20024u</span> : <span class="hljs-number">0x20026u</span>));
  <span class="hljs-keyword">for</span> (;;) {}
}
<span class="hljs-type">void</span> <span class="hljs-title function_">Default_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { rt_puts(<span class="hljs-string">&quot;unexpected exception\\n&quot;</span>); rt_exit(<span class="hljs-number">3</span>); }
<span class="hljs-type">void</span> <span class="hljs-title function_">HardFault_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> __<span class="hljs-title function_">attribute__</span><span class="hljs-params">((weak, alias(<span class="hljs-string">&quot;Default_Handler&quot;</span>)))</span>;
<span class="hljs-type">void</span> <span class="hljs-title function_">SysTick_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span>   __<span class="hljs-title function_">attribute__</span><span class="hljs-params">((weak, alias(<span class="hljs-string">&quot;Default_Handler&quot;</span>)))</span>;

<span class="hljs-type">void</span> <span class="hljs-title function_">Reset_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">uint32_t</span> *src = &amp;_sidata, *dst = &amp;_sdata;
  <span class="hljs-keyword">while</span> (dst &lt; &amp;_edata) *dst++ = *src++;                <span class="hljs-comment">/* copy .data from flash to RAM */</span>
  <span class="hljs-keyword">for</span> (dst = &amp;_sbss; dst &lt; &amp;_ebss;) *dst++ = <span class="hljs-number">0</span>;         <span class="hljs-comment">/* zero .bss */</span>
  rt_exit(main());
}
__attribute__((section(<span class="hljs-string">&quot;.vectors&quot;</span>), used))
<span class="hljs-type">static</span> <span class="hljs-title function_">void</span> <span class="hljs-params">(*<span class="hljs-type">const</span> vectors[<span class="hljs-number">16</span>])</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> = {
  (<span class="hljs-type">void</span> (*)(<span class="hljs-type">void</span>))&amp;_estack, Reset_Handler, Default_Handler, HardFault_Handler,
  Default_Handler, Default_Handler, Default_Handler, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>,
  Default_Handler, Default_Handler, <span class="hljs-number">0</span>, Default_Handler, SysTick_Handler,
};</code></pre></div>

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">isr.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span>;

<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_CSR  (*(volatile uint32_t *)0xE000E010)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_RVR  (*(volatile uint32_t *)0xE000E014)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_CVR  (*(volatile uint32_t *)0xE000E018)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SHPR3     (*(volatile uint32_t *)0xE000ED20)     <span class="hljs-comment">/* SysTick priority in bits 31:24 */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> T0_CTRL   (*(volatile uint32_t *)0x40000000)     <span class="hljs-comment">/* CMSDK APB timer 0 */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> T0_VALUE  (*(volatile uint32_t *)0x40000004)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> T0_RELOAD (*(volatile uint32_t *)0x40000008)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> TICKS 200</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> RELOAD (25000u - 1u)                              <span class="hljs-comment">/* 25 MHz / 25 000 = 1 kHz */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">ifndef</span> CRIT_LOOPS</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CRIT_LOOPS 0                                      <span class="hljs-comment">/* critical section length in loop iterations */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>

<span class="hljs-type">static</span> <span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> n_ticks, stamp[TICKS];
<span class="hljs-type">static</span> <span class="hljs-type">int32_t</span> y_q16, integ_q16;                          <span class="hljs-comment">/* plant output and PI integrator, Q16.16 */</span>

<span class="hljs-type">void</span> <span class="hljs-title function_">SysTick_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">uint32_t</span> now = T0_VALUE;                                <span class="hljs-comment">/* timestamp first: that&#x27;s &quot;ISR start&quot; */</span>
  <span class="hljs-keyword">if</span> (n_ticks &lt; TICKS) stamp[n_ticks] = now;
  <span class="hljs-comment">/* one control step at 1 kHz: PI on a first-order plant y&#x27; = (u - y)/tau, tau = 50 ms, setpoint 1.0 */</span>
  <span class="hljs-type">int32_t</span> e = (<span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">16</span>) - y_q16;
  integ_q16 += e / <span class="hljs-number">20</span>;                                    <span class="hljs-comment">/* Ki*Ts = 0.05 */</span>
  <span class="hljs-type">int32_t</span> u = <span class="hljs-number">2</span> * e + integ_q16;                          <span class="hljs-comment">/* Kp = 2 */</span>
  y_q16 += (u - y_q16) / <span class="hljs-number">50</span>;                              <span class="hljs-comment">/* Ts/tau = 1/50 */</span>
  n_ticks++;
}

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">spin</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> n)</span> { <span class="hljs-keyword">if</span> (n) __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;1: subs %0, %0, #1\\n\\t bne 1b&quot;</span> : <span class="hljs-string">&quot;+r&quot;</span>(n) : : <span class="hljs-string">&quot;cc&quot;</span>)</span>; }

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  T0_RELOAD = <span class="hljs-number">0xFFFFFFFFu</span>; T0_VALUE = <span class="hljs-number">0xFFFFFFFFu</span>; T0_CTRL = <span class="hljs-number">1</span>;   <span class="hljs-comment">/* free-running down-counter */</span>
  SHPR3 = (SHPR3 &amp; <span class="hljs-number">0x00FFFFFFu</span>) | (<span class="hljs-number">0x40u</span> &lt;&lt; <span class="hljs-number">24</span>);                  <span class="hljs-comment">/* SysTick priority 4 (of 0..15) */</span>
  SYST_RVR = RELOAD; SYST_CVR = <span class="hljs-number">0</span>; SYST_CSR = <span class="hljs-number">7</span>;                  <span class="hljs-comment">/* core clock, interrupt, enable */</span>
  <span class="hljs-keyword">while</span> (n_ticks &lt; TICKS) {
    <span class="hljs-keyword">if</span> (CRIT_LOOPS) { __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;cpsid i&quot;</span> ::: <span class="hljs-string">&quot;memory&quot;</span>)</span>; spin(CRIT_LOOPS); __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;cpsie i&quot;</span> ::: <span class="hljs-string">&quot;memory&quot;</span>)</span>; }
    spin(<span class="hljs-number">1733</span>);                                           <span class="hljs-comment">/* other work, deliberately not a divisor of the period */</span>
  }
  SYST_CSR = <span class="hljs-number">0</span>;
  <span class="hljs-type">uint32_t</span> lo = <span class="hljs-number">0xFFFFFFFFu</span>, hi = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> k = <span class="hljs-number">2</span>; k &lt; TICKS; k++) { <span class="hljs-type">uint32_t</span> d = stamp[k - <span class="hljs-number">1</span>] - stamp[k]; <span class="hljs-keyword">if</span> (d &lt; lo) lo = d; <span class="hljs-keyword">if</span> (d &gt; hi) hi = d; }
  rt_puts(<span class="hljs-string">&quot;period_min &quot;</span>); rt_putu(lo); rt_puts(<span class="hljs-string">&quot; period_max &quot;</span>); rt_putu(hi);
  rt_puts(<span class="hljs-string">&quot; y_milli &quot;</span>); rt_putu((<span class="hljs-type">uint32_t</span>)((y_q16 * <span class="hljs-number">1000LL</span>) &gt;&gt; <span class="hljs-number">16</span>)); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Measure SysTick ISR period jitter in QEMU, with and without a 5 us critical section in main.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> re, shutil, subprocess, sys
<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)&quot;</span>)

NS_PER_COUNT = <span class="hljs-number">40</span>                                    <span class="hljs-comment"># TIMER0 runs at 25 MHz</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">measure</span>(<span class="hljs-params">crit_loops</span>):
    subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;-mcpu=cortex-m3&quot;</span>, <span class="hljs-string">&quot;-mthumb&quot;</span>, <span class="hljs-string">&quot;-O1&quot;</span>, <span class="hljs-string">&quot;-Wall&quot;</span>, <span class="hljs-string">&quot;-Werror&quot;</span>, <span class="hljs-string">&quot;-ffreestanding&quot;</span>,
                    <span class="hljs-string">&quot;-nostdlib&quot;</span>, <span class="hljs-string">&quot;-T&quot;</span>, <span class="hljs-string">&quot;link.ld&quot;</span>, <span class="hljs-string">f&quot;-DCRIT_LOOPS=<span class="hljs-subst">{crit_loops}</span>&quot;</span>, <span class="hljs-string">&quot;rt.c&quot;</span>, <span class="hljs-string">&quot;isr.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, <span class="hljs-string">&quot;isr.elf&quot;</span>], check=<span class="hljs-literal">True</span>)
    r = subprocess.run([<span class="hljs-string">&quot;qemu-system-arm&quot;</span>, <span class="hljs-string">&quot;-M&quot;</span>, <span class="hljs-string">&quot;mps2-an385&quot;</span>, <span class="hljs-string">&quot;-nographic&quot;</span>, <span class="hljs-string">&quot;-icount&quot;</span>, <span class="hljs-string">&quot;shift=0&quot;</span>, <span class="hljs-string">&quot;-semihosting-config&quot;</span>,
                        <span class="hljs-string">&quot;enable=on,target=native&quot;</span>, <span class="hljs-string">&quot;-kernel&quot;</span>, <span class="hljs-string">&quot;isr.elf&quot;</span>], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">60</span>)
    <span class="hljs-keyword">assert</span> r.returncode == <span class="hljs-number">0</span>, r.stdout
    lo, hi, y = <span class="hljs-built_in">map</span>(<span class="hljs-built_in">int</span>, re.search(<span class="hljs-string">r&quot;period_min (\\d+) period_max (\\d+) y_milli (\\d+)&quot;</span>, r.stdout).groups())
    <span class="hljs-keyword">return</span> lo, hi, y

lo, hi, y = measure(<span class="hljs-number">0</span>)
jitter_ns = (hi - lo) * NS_PER_COUNT
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;clean:  period <span class="hljs-subst">{lo}</span>..<span class="hljs-subst">{hi}</span> counts (<span class="hljs-subst">{lo * NS_PER_COUNT / <span class="hljs-number">1e6</span>:<span class="hljs-number">.4</span>f}</span> ms), jitter <span class="hljs-subst">{jitter_ns}</span> ns, plant output <span class="hljs-subst">{y / <span class="hljs-number">1000</span>:<span class="hljs-number">.3</span>f}</span>&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>((lo + hi) / <span class="hljs-number">2</span> - <span class="hljs-number">25000</span>) &lt;= <span class="hljs-number">1</span>                <span class="hljs-comment"># 1 ms period</span>
<span class="hljs-keyword">assert</span> jitter_ns &lt; <span class="hljs-number">1000</span>                               <span class="hljs-comment"># jitter below 1 us</span>
<span class="hljs-keyword">assert</span> <span class="hljs-number">990</span> &lt;= y &lt;= <span class="hljs-number">1010</span>                               <span class="hljs-comment"># the PI loop has settled on the setpoint 1.0</span>

lo2, hi2, _ = measure(<span class="hljs-number">2500</span>)                           <span class="hljs-comment"># 2 instructions x 2500 = 5000 ns with interrupts off</span>
jitter2 = (hi2 - lo2) * NS_PER_COUNT
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;5 us critical sections: period <span class="hljs-subst">{lo2}</span>..<span class="hljs-subst">{hi2}</span> counts, jitter <span class="hljs-subst">{jitter2}</span> ns&quot;</span>)
<span class="hljs-keyword">assert</span> jitter2 &gt; <span class="hljs-number">1000</span>                                 <span class="hljs-comment"># the long critical section breaks the budget</span>
<span class="hljs-keyword">assert</span> jitter2 &lt;= <span class="hljs-number">2</span> * <span class="hljs-number">5000</span> + <span class="hljs-number">2</span> * NS_PER_COUNT         <span class="hljs-comment"># but never more than twice its length</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A UART receive ISR at priority 2 takes 8 µs. The 1 kHz control ISR is at priority 5. What’s the worst-case delay of the control ISR, and how do you fix it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Up to 8 µs (plus entry), because a running priority-2 handler can’t be preempted by priority 5. Either make the control ISR more urgent (a lower number than the UART’s), or shorten the UART ISR to just moving the byte into a ring buffer (lesson 18) and parse in the main loop.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the ISR read the timestamp as its very first statement?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Everything after it (the controller arithmetic) adds a constant offset but no jitter, as long as it is deterministic. Reading it last would mix the controller’s data-dependent execution time (like a division’s variable cycle count on hardware) into the measurement.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l09"></div>

`,i=[{id:`what-happens-on-an-interrupt`,title:`What happens on an interrupt`},{id:`priority-and-preemption`,title:`Priority and preemption`},{id:`measuring-jitter`,title:`Measuring jitter`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l09-q1`,type:`num`,q:`<p>SysTick reload for a 1 kHz tick at 25 MHz?</p>
`,explain:`<p>f/1000 − 1.</p>
`,answer:24999,tol:.001,unit:``},{id:`p10-l09-q2`,type:`num`,q:`<p>Cortex-M4 interrupt entry of 12 cycles at 168 MHz, in ns?</p>
`,explain:`<p>Cycles over the clock.</p>
`,answer:71.43,tol:.001,unit:`ns`},{id:`p10-l09-q3`,type:`num`,q:`<p>A 1 µs jitter budget at 168 MHz allows a critical section of at most how many cycles?</p>
`,explain:`<p>Ignoring the entry time itself.</p>
`,answer:168,tol:.001,unit:`cycles`},{id:`p10-l09-q4`,type:`num`,q:`<p>Measured periods range from 24 990 to 25 110 counts of 40 ns. Jitter in µs?</p>
`,explain:`<p>Spread times the count period.</p>
`,answer:4.8,tol:.001,unit:`µs`},{id:`p10-l09-q5`,type:`mc`,q:`<p>On a Cortex-M, which priority number is most urgent?</p>
`,explain:`<p>0 is the most urgent configurable priority.</p>
`,options:[`the highest number`,`the lowest number`,`all are equal unless grouped`,`priority 8`],answer:1},{id:`p10-l09-q6`,type:`mc`,q:`<p>What does tail-chaining save?</p>
`,explain:`<p>The core goes straight to the next handler.</p>
`,options:[`unstacking and restacking registers between back-to-back handlers`,`flash wait states`,`the priority comparison`,`the vector table lookup`],answer:0}],o=[{file:`link.ld`,lang:`ld`,src:`/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */
MEMORY {
  FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
ENTRY(Reset_Handler)
SECTIONS {
  .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) . = ALIGN(4); } > FLASH
  .data : { _sdata = .; *(.data*) . = ALIGN(4); _edata = .; } > RAM AT > FLASH
  _sidata = LOADADDR(.data);
  .bss (NOLOAD) : { _sbss = .; *(.bss*) *(COMMON) . = ALIGN(4); _ebss = .; } > RAM
  _estack = ORIGIN(RAM) + LENGTH(RAM);
}`},{file:`rt.c`,lang:`c`,src:`/* rt.c: minimal Cortex-M runtime. Vector table, reset handler, semihosting print and exit. */
#include <stdint.h>
extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;
int main(void);

static int semihost(int op, const void *arg) {          /* bkpt 0xAB traps to the debugger (QEMU) */
  register int r0 __asm__("r0") = op;
  register const void *r1 __asm__("r1") = arg;
  __asm__ volatile("bkpt 0xAB" : "+r"(r0) : "r"(r1) : "memory");
  return r0;
}
void rt_puts(const char *s) { semihost(0x04, s); }      /* SYS_WRITE0 */
void rt_putu(uint32_t v) {
  char b[12]; int i = 11; b[i] = 0;
  do { b[--i] = (char)('0' + v % 10); v /= 10; } while (v);
  rt_puts(&b[i]);
}
void rt_exit(int code) {                                /* SYS_EXIT: QEMU exits 0 for "application exit", 1 otherwise */
  semihost(0x18, (const void *)(uintptr_t)(code ? 0x20024u : 0x20026u));
  for (;;) {}
}
void Default_Handler(void) { rt_puts("unexpected exception\\n"); rt_exit(3); }
void HardFault_Handler(void) __attribute__((weak, alias("Default_Handler")));
void SysTick_Handler(void)   __attribute__((weak, alias("Default_Handler")));

void Reset_Handler(void) {
  uint32_t *src = &_sidata, *dst = &_sdata;
  while (dst < &_edata) *dst++ = *src++;                /* copy .data from flash to RAM */
  for (dst = &_sbss; dst < &_ebss;) *dst++ = 0;         /* zero .bss */
  rt_exit(main());
}
__attribute__((section(".vectors"), used))
static void (*const vectors[16])(void) = {
  (void (*)(void))&_estack, Reset_Handler, Default_Handler, HardFault_Handler,
  Default_Handler, Default_Handler, Default_Handler, 0, 0, 0, 0,
  Default_Handler, Default_Handler, 0, Default_Handler, SysTick_Handler,
};`},{file:`isr.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

#define SYST_CSR  (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR  (*(volatile uint32_t *)0xE000E014)
#define SYST_CVR  (*(volatile uint32_t *)0xE000E018)
#define SHPR3     (*(volatile uint32_t *)0xE000ED20)     /* SysTick priority in bits 31:24 */
#define T0_CTRL   (*(volatile uint32_t *)0x40000000)     /* CMSDK APB timer 0 */
#define T0_VALUE  (*(volatile uint32_t *)0x40000004)
#define T0_RELOAD (*(volatile uint32_t *)0x40000008)
#define TICKS 200
#define RELOAD (25000u - 1u)                              /* 25 MHz / 25 000 = 1 kHz */
#ifndef CRIT_LOOPS
#define CRIT_LOOPS 0                                      /* critical section length in loop iterations */
#endif

static volatile uint32_t n_ticks, stamp[TICKS];
static int32_t y_q16, integ_q16;                          /* plant output and PI integrator, Q16.16 */

void SysTick_Handler(void) {
  uint32_t now = T0_VALUE;                                /* timestamp first: that's "ISR start" */
  if (n_ticks < TICKS) stamp[n_ticks] = now;
  /* one control step at 1 kHz: PI on a first-order plant y' = (u - y)/tau, tau = 50 ms, setpoint 1.0 */
  int32_t e = (1 << 16) - y_q16;
  integ_q16 += e / 20;                                    /* Ki*Ts = 0.05 */
  int32_t u = 2 * e + integ_q16;                          /* Kp = 2 */
  y_q16 += (u - y_q16) / 50;                              /* Ts/tau = 1/50 */
  n_ticks++;
}

static void spin(uint32_t n) { if (n) __asm__ volatile("1: subs %0, %0, #1\\n\\t bne 1b" : "+r"(n) : : "cc"); }

int main(void) {
  T0_RELOAD = 0xFFFFFFFFu; T0_VALUE = 0xFFFFFFFFu; T0_CTRL = 1;   /* free-running down-counter */
  SHPR3 = (SHPR3 & 0x00FFFFFFu) | (0x40u << 24);                  /* SysTick priority 4 (of 0..15) */
  SYST_RVR = RELOAD; SYST_CVR = 0; SYST_CSR = 7;                  /* core clock, interrupt, enable */
  while (n_ticks < TICKS) {
    if (CRIT_LOOPS) { __asm__ volatile("cpsid i" ::: "memory"); spin(CRIT_LOOPS); __asm__ volatile("cpsie i" ::: "memory"); }
    spin(1733);                                           /* other work, deliberately not a divisor of the period */
  }
  SYST_CSR = 0;
  uint32_t lo = 0xFFFFFFFFu, hi = 0;
  for (int k = 2; k < TICKS; k++) { uint32_t d = stamp[k - 1] - stamp[k]; if (d < lo) lo = d; if (d > hi) hi = d; }
  rt_puts("period_min "); rt_putu(lo); rt_puts(" period_max "); rt_putu(hi);
  rt_puts(" y_milli "); rt_putu((uint32_t)((y_q16 * 1000LL) >> 16)); rt_puts("\\n");
  return 0;
}`},{file:`run.py`,lang:`python`,src:`"""Measure SysTick ISR period jitter in QEMU, with and without a 5 us critical section in main."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

NS_PER_COUNT = 40                                    # TIMER0 runs at 25 MHz
def measure(crit_loops):
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", f"-DCRIT_LOOPS={crit_loops}", "rt.c", "isr.c", "-o", "isr.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-icount", "shift=0", "-semihosting-config",
                        "enable=on,target=native", "-kernel", "isr.elf"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, timeout=60)
    assert r.returncode == 0, r.stdout
    lo, hi, y = map(int, re.search(r"period_min (\\d+) period_max (\\d+) y_milli (\\d+)", r.stdout).groups())
    return lo, hi, y

lo, hi, y = measure(0)
jitter_ns = (hi - lo) * NS_PER_COUNT
print(f"clean:  period {lo}..{hi} counts ({lo * NS_PER_COUNT / 1e6:.4f} ms), jitter {jitter_ns} ns, plant output {y / 1000:.3f}")
assert abs((lo + hi) / 2 - 25000) <= 1                # 1 ms period
assert jitter_ns < 1000                               # jitter below 1 us
assert 990 <= y <= 1010                               # the PI loop has settled on the setpoint 1.0

lo2, hi2, _ = measure(2500)                           # 2 instructions x 2500 = 5000 ns with interrupts off
jitter2 = (hi2 - lo2) * NS_PER_COUNT
print(f"5 us critical sections: period {lo2}..{hi2} counts, jitter {jitter2} ns")
assert jitter2 > 1000                                 # the long critical section breaks the budget
assert jitter2 <= 2 * 5000 + 2 * NS_PER_COUNT         # but never more than twice its length
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};