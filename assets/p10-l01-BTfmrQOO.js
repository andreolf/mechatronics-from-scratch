var e=`p10-l01`,t=40,n=`A Cortex-M microcontroller is a 32-bit core, a few buses and a lot of memory-mapped peripherals on one chip. You learn the register file, the three-stage pipeline and what an instruction costs, then cross-compile a counting loop for a Cortex-M3, run it in QEMU and check that the measured count matches the instructions you predicted by hand.`,r=`<h2 id="what-is-on-the-chip">What is on the chip</h2>
<p>A microcontroller (MCU) puts a processor core, its memories and its peripherals on one die. For an Arm Cortex-M part such as an STM32F4, the pieces are:</p>
<ul>
<li>the <strong>core</strong>: 16 registers of 32 bits, an ALU, a hardware multiplier and divider, and (on the M4F/M7) a floating-point unit;</li>
<li><strong>flash</strong> for code and constants (hundreds of kilobytes) and <strong>SRAM</strong> for variables and the stack (tens to hundreds of kilobytes);</li>
<li><strong>buses</strong> that connect them. Cortex-M3/M4 cores have separate instruction (I-code) and data (D-code) buses into the code region plus a system bus, so an instruction fetch and a data access can happen in the same cycle. That is a modified <strong>Harvard</strong> design: separate paths, but one address space;</li>
<li><strong>peripherals</strong> (GPIO, timers, ADC, UART, SPI, DMA) on slower peripheral buses behind a bridge;</li>
<li>the <strong>NVIC</strong> (interrupt controller), <strong>SysTick</strong> timer and debug blocks inside the core’s private region at 0xE000_0000.</li>
</ul>
<p>Everything is <strong>memory-mapped</strong>: a peripheral register is an address, and you control the hardware by loading from and storing to it. The rest of this phase is about doing that correctly.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="mcuarch" data-args="{}"></div></div><figcaption>Inside a Cortex-M MCU. Pick an operation to see which bus it uses and roughly what it costs. A fetch from flash with wait states stalls the pipeline unless the prefetch buffer or cache hides it.</figcaption></figure>
<h2 id="registers-and-the-pipeline">Registers and the pipeline</h2>
<p>The programmer sees r0–r12 (general purpose), <strong>SP</strong> (r13, the stack pointer), <strong>LR</strong> (r14, the return address after a call) and <strong>PC</strong> (r15), plus <strong>xPSR</strong> with the condition flags N, Z, C, V. The calling convention (AAPCS) passes the first four arguments in r0–r3 and returns in r0.</p>
<p>The Cortex-M3/M4 pipeline has three stages: <strong>fetch, decode, execute</strong>. While one instruction executes, the next is decoded and the one after is fetched, so most data-processing instructions complete at one per clock. Rough costs on a Cortex-M3/M4 with zero-wait-state memory, from Arm’s technical reference manuals:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>instruction</th>
<th>cycles</th>
</tr>
</thead>
<tbody><tr>
<td>ADD, SUB, AND, MOV, compare</td>
<td>1</td>
</tr>
<tr>
<td>MUL (32-bit result)</td>
<td>1</td>
</tr>
<tr>
<td>LDR / STR (single)</td>
<td>2 (pipelined back-to-back loads cost less)</td>
</tr>
<tr>
<td>SDIV / UDIV</td>
<td>2–12, depends on operands</td>
</tr>
<tr>
<td>taken branch</td>
<td>1 + P, where P (pipeline refill) is 1–3</td>
</tr>
</tbody></table></div>
<p>A taken branch throws away the fetched and decoded instructions behind it, which is why loops have overhead. Flash also matters: at 168 MHz an STM32F4’s flash needs 5 wait states, and only the ART accelerator (prefetch plus a small cache) keeps a loop running near one instruction per cycle.</p>
<h2 id="counting-a-loop-by-hand">Counting a loop by hand</h2>
<p>The tightest counting loop is two Thumb-2 instructions:</p>
<pre><code>1:  subs r0, r0, #1    @ decrement, set the Z flag
    bne  1b            @ branch back while not zero
</code></pre>
<p>For <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> iterations that is exactly <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> instructions executed. On real silicon the cycles are <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mclose">)</span></span></span></span> per iteration, so 3–4 cycles: about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">3.5</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> cycles, or <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> taking about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">350</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000/168</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">MHz</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.1</span></span></span></span> ms at 168 MHz.</p>
<p>On hardware you measure cycles with the <strong>DWT cycle counter</strong>: enable trace in DEMCR (bit 24 at 0xE000EDFC), set CYCCNTENA (bit 0 of DWT_CTRL at 0xE0001000), then read DWT_CYCCNT at 0xE0001004 before and after. The difference is the exact cycle count, including wait states.</p>
<h2 id="what-qemu-can-and-cannot-tell-you">What QEMU can and cannot tell you</h2>
<p>We run the code in <strong>QEMU</strong>, emulating the Arm MPS2-AN385 board (a Cortex-M3). QEMU does not model the pipeline or wait states, so it cannot count real cycles, and it has no DWT cycle counter. With <code>-icount shift=0</code> it does something useful instead: time advances by exactly 1 ns per <strong>instruction</strong>, and the SysTick timer, clocked at the board’s 25 MHz, advances once every 40 instructions. So in QEMU</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6679em;"></span><span class="mord text"><span class="mord">instructions</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">40</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord">Δ</span><span class="mord text"><span class="mord">SysTick</span></span><span class="mpunct">,</span></span></span></span></span></div>
<p>which lets you check an instruction count exactly. Converting to cycles on a real chip still needs the table above or a DWT measurement. Keep the two ideas separate: <strong>instruction count</strong> is a property of the code, <strong>cycle count</strong> is a property of the code on a particular memory system.</p>
<h2 id="worked-example">Worked example</h2>
<p>You time the two-instruction loop for <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> with SysTick in QEMU.</p>
<ol>
<li>Instructions: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">200</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span>.</li>
<li>SysTick ticks: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">200</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000/40</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5000</span></span></span></span>.</li>
<li>Doubling <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.109em;">N</span></span></span></span> doubles the ticks, so the slope is 2 instructions per iteration, and the intercept is the call overhead (a few instructions).</li>
<li>On a Cortex-M3 at 72 MHz with <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">P</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span>, the same loop is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">4</span><span class="mord mathnormal" style="margin-right:0.109em;">N</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">400</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> cycles, or 5.56 ms.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p>Four files. <code>link.ld</code> and <code>rt.c</code> are a minimal linker script and runtime (vector table, reset handler, and semihosting to print and exit through the debugger interface). Lessons 03 and 04 build them up line by line; here just use them. <code>cycles.c</code> is the experiment, and <code>run.py</code> cross-compiles, runs QEMU and checks the counts.</p>

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

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">cycles.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span>;

<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_CSR (*(volatile uint32_t *)0xE000E010)   <span class="hljs-comment">/* SysTick control and status */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_RVR (*(volatile uint32_t *)0xE000E014)   <span class="hljs-comment">/* reload value */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SYST_CVR (*(volatile uint32_t *)0xE000E018)   <span class="hljs-comment">/* current value, counts DOWN */</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DEMCR      (*(volatile uint32_t *)0xE000EDFC)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DWT_CTRL   (*(volatile uint32_t *)0xE0001000)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> DWT_CYCCNT (*(volatile uint32_t *)0xE0001004)</span>

<span class="hljs-comment">/* exactly two instructions per iteration */</span>
__attribute__((noinline)) <span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">loop2</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> n)</span> {
  __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;1: subs %0, %0, #1\\n\\t bne 1b&quot;</span> : <span class="hljs-string">&quot;+r&quot;</span>(n) : : <span class="hljs-string">&quot;cc&quot;</span>)</span>;
}

<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">systick_delta</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> n)</span> {
  SYST_RVR = <span class="hljs-number">0xFFFFFF</span>; SYST_CVR = <span class="hljs-number">0</span>; SYST_CSR = <span class="hljs-number">5</span>;      <span class="hljs-comment">/* enable, core clock, no interrupt */</span>
  <span class="hljs-type">uint32_t</span> t0 = SYST_CVR;
  loop2(n);
  <span class="hljs-type">uint32_t</span> t1 = SYST_CVR;
  SYST_CSR = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> (t0 - t1) &amp; <span class="hljs-number">0xFFFFFF</span>;                          <span class="hljs-comment">/* 24-bit down-counter */</span>
}

<span class="hljs-meta">#<span class="hljs-keyword">ifdef</span> ON_HARDWARE   <span class="hljs-comment">/* real silicon only: QEMU has no DWT cycle counter */</span></span>
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">dwt_cycles</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> n)</span> {
  DEMCR |= <span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">24</span>; DWT_CYCCNT = <span class="hljs-number">0</span>; DWT_CTRL |= <span class="hljs-number">1u</span>;
  <span class="hljs-type">uint32_t</span> c0 = DWT_CYCCNT; loop2(n); <span class="hljs-keyword">return</span> DWT_CYCCNT - c0;
}
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">uint32_t</span> ns[] = {<span class="hljs-number">1000</span>, <span class="hljs-number">10000</span>, <span class="hljs-number">100000</span>, <span class="hljs-number">200000</span>};
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i++) {
    rt_puts(<span class="hljs-string">&quot;N &quot;</span>); rt_putu(ns[i]); rt_puts(<span class="hljs-string">&quot; ticks &quot;</span>); rt_putu(systick_delta(ns[i])); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
  }
<span class="hljs-meta">#<span class="hljs-keyword">ifdef</span> ON_HARDWARE</span>
  rt_puts(<span class="hljs-string">&quot;cycles &quot;</span>); rt_putu(dwt_cycles(<span class="hljs-number">100000</span>)); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Cross-compile cycles.c for a Cortex-M3, run it in QEMU with -icount and check the instruction counts.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> re, shutil, subprocess, sys
<span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np

<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)&quot;</span>)

CFLAGS = [<span class="hljs-string">&quot;-mcpu=cortex-m3&quot;</span>, <span class="hljs-string">&quot;-mthumb&quot;</span>, <span class="hljs-string">&quot;-O1&quot;</span>, <span class="hljs-string">&quot;-nostdlib&quot;</span>, <span class="hljs-string">&quot;-ffreestanding&quot;</span>, <span class="hljs-string">&quot;-Wall&quot;</span>, <span class="hljs-string">&quot;-Werror&quot;</span>]
subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, *CFLAGS, <span class="hljs-string">&quot;-T&quot;</span>, <span class="hljs-string">&quot;link.ld&quot;</span>, <span class="hljs-string">&quot;rt.c&quot;</span>, <span class="hljs-string">&quot;cycles.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, <span class="hljs-string">&quot;cycles.elf&quot;</span>], check=<span class="hljs-literal">True</span>)
out = subprocess.run([<span class="hljs-string">&quot;qemu-system-arm&quot;</span>, <span class="hljs-string">&quot;-M&quot;</span>, <span class="hljs-string">&quot;mps2-an385&quot;</span>, <span class="hljs-string">&quot;-nographic&quot;</span>, <span class="hljs-string">&quot;-icount&quot;</span>, <span class="hljs-string">&quot;shift=0&quot;</span>,
                      <span class="hljs-string">&quot;-semihosting-config&quot;</span>, <span class="hljs-string">&quot;enable=on,target=native&quot;</span>, <span class="hljs-string">&quot;-kernel&quot;</span>, <span class="hljs-string">&quot;cycles.elf&quot;</span>],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">30</span>)
<span class="hljs-keyword">assert</span> out.returncode == <span class="hljs-number">0</span>, out.stdout                <span class="hljs-comment"># semihosting text arrives on QEMU&#x27;s stderr, merged here</span>
rows = [(<span class="hljs-built_in">int</span>(n), <span class="hljs-built_in">int</span>(t)) <span class="hljs-keyword">for</span> n, t <span class="hljs-keyword">in</span> re.findall(<span class="hljs-string">r&quot;N (\\d+) ticks (\\d+)&quot;</span>, out.stdout)]
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(rows) == <span class="hljs-number">4</span>, out.stdout
INSTR_PER_TICK = <span class="hljs-number">40</span>                     <span class="hljs-comment"># QEMU: 1 ns per instruction, SysTick at 25 MHz</span>
N = np.array([r[<span class="hljs-number">0</span>] <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> rows], <span class="hljs-built_in">float</span>); instr = np.array([r[<span class="hljs-number">1</span>] <span class="hljs-keyword">for</span> r <span class="hljs-keyword">in</span> rows], <span class="hljs-built_in">float</span>) * INSTR_PER_TICK
slope, intercept = np.polyfit(N, instr, <span class="hljs-number">1</span>)
<span class="hljs-keyword">for</span> n, i <span class="hljs-keyword">in</span> <span class="hljs-built_in">zip</span>(N, instr):
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;N=<span class="hljs-subst">{<span class="hljs-built_in">int</span>(n):&gt;<span class="hljs-number">6</span>}</span>  instructions=<span class="hljs-subst">{<span class="hljs-built_in">int</span>(i):&gt;<span class="hljs-number">7</span>}</span>  predicted=<span class="hljs-subst">{<span class="hljs-built_in">int</span>(<span class="hljs-number">2</span> * n):&gt;<span class="hljs-number">7</span>}</span>&quot;</span>)
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;slope <span class="hljs-subst">{slope:<span class="hljs-number">.4</span>f}</span> instructions per iteration, intercept <span class="hljs-subst">{intercept:<span class="hljs-number">.0</span>f}</span>&quot;</span>)
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(slope - <span class="hljs-number">2</span>) &lt; <span class="hljs-number">1e-3</span>                          <span class="hljs-comment"># two instructions per iteration</span>
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">abs</span>(instr[<span class="hljs-number">2</span>] - <span class="hljs-number">200000</span>) / <span class="hljs-number">200000</span> &lt; <span class="hljs-number">0.005</span>         <span class="hljs-comment"># N=100000 matches the hand count within 0.5 %</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Replace <code>subs</code>/<code>bne</code> with a C loop <code>for (volatile uint32_t i = 0; i &lt; n; i++) {}</code> and measure again. Why are there now about 6 instructions per iteration?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><code>volatile</code> forces <code>i</code> to live in memory, so each iteration loads <code>i</code>, compares it with <code>n</code>, branches, loads it again, adds one and stores it back. That’s roughly ldr, cmp, b, ldr, adds, str: six instructions, and on hardware the loads and stores cost 2 cycles each. This is why a “delay loop” in C is unpredictable, and why you use a timer instead (lesson 08).</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A real Cortex-M4 at 168 MHz with flash wait states runs the loop in 5 cycles per iteration until you enable the ART accelerator, then in 3. How long do 100 000 iterations take in each case?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000/168</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">MHz</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2.98</span></span></span></span> ms, and <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">100</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000/168</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">MHz</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.79</span></span></span></span> ms. The code didn’t change, only the memory system: measure with DWT_CYCCNT on the board before you trust any timing.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l01"></div>

`,i=[{id:`what-is-on-the-chip`,title:`What is on the chip`},{id:`registers-and-the-pipeline`,title:`Registers and the pipeline`},{id:`counting-a-loop-by-hand`,title:`Counting a loop by hand`},{id:`what-qemu-can-and-cannot-tell-you`,title:`What QEMU can and cannot tell you`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l01-q1`,type:`num`,q:`<p>How many instructions does the subs/bne loop execute for N = 250 000?</p>
`,explain:`<p>Two per iteration.</p>
`,answer:5e5,tol:.001,unit:`instructions`},{id:`p10-l01-q2`,type:`num`,q:`<p>In QEMU with -icount shift=0, how many SysTick ticks does that take (40 instructions per tick)?</p>
`,explain:`<p>Instructions divided by 40.</p>
`,answer:12500,tol:.001,unit:`ticks`},{id:`p10-l01-q3`,type:`num`,q:`<p>On a Cortex-M3 at 72 MHz with 4 cycles per iteration, how many ms do 100 000 iterations take?</p>
`,explain:`<p>Cycles divided by the clock.</p>
`,answer:5.556,tol:.001,unit:`ms`},{id:`p10-l01-q4`,type:`num`,q:`<p>A taken branch costs 1 + P cycles. With P = 3, how many cycles is one loop iteration (subs 1 cycle)?</p>
`,explain:`<p>The subs plus the branch with its refill.</p>
`,answer:5,tol:.001,unit:`cycles`},{id:`p10-l01-q5`,type:`mc`,q:`<p>Which register holds the return address after a BL (function call)?</p>
`,explain:`<p>The link register.</p>
`,options:[`LR (r14)`,`PC (r15)`,`r0`,`SP (r13)`],answer:0},{id:`p10-l01-q6`,type:`mc`,q:`<p>What does QEMU’s -icount shift=0 let you measure exactly?</p>
`,explain:`<p>Time advances 1 ns per instruction; there is no pipeline or wait-state model.</p>
`,options:[`instructions executed`,`clock cycles including wait states`,`cache misses`,`power consumption`],answer:0}],o=[{file:`link.ld`,lang:`ld`,src:`/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */
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
};`},{file:`cycles.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

#define SYST_CSR (*(volatile uint32_t *)0xE000E010)   /* SysTick control and status */
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)   /* reload value */
#define SYST_CVR (*(volatile uint32_t *)0xE000E018)   /* current value, counts DOWN */
#define DEMCR      (*(volatile uint32_t *)0xE000EDFC)
#define DWT_CTRL   (*(volatile uint32_t *)0xE0001000)
#define DWT_CYCCNT (*(volatile uint32_t *)0xE0001004)

/* exactly two instructions per iteration */
__attribute__((noinline)) static void loop2(uint32_t n) {
  __asm__ volatile("1: subs %0, %0, #1\\n\\t bne 1b" : "+r"(n) : : "cc");
}

static uint32_t systick_delta(uint32_t n) {
  SYST_RVR = 0xFFFFFF; SYST_CVR = 0; SYST_CSR = 5;      /* enable, core clock, no interrupt */
  uint32_t t0 = SYST_CVR;
  loop2(n);
  uint32_t t1 = SYST_CVR;
  SYST_CSR = 0;
  return (t0 - t1) & 0xFFFFFF;                          /* 24-bit down-counter */
}

#ifdef ON_HARDWARE   /* real silicon only: QEMU has no DWT cycle counter */
static uint32_t dwt_cycles(uint32_t n) {
  DEMCR |= 1u << 24; DWT_CYCCNT = 0; DWT_CTRL |= 1u;
  uint32_t c0 = DWT_CYCCNT; loop2(n); return DWT_CYCCNT - c0;
}
#endif

int main(void) {
  static const uint32_t ns[] = {1000, 10000, 100000, 200000};
  for (int i = 0; i < 4; i++) {
    rt_puts("N "); rt_putu(ns[i]); rt_puts(" ticks "); rt_putu(systick_delta(ns[i])); rt_puts("\\n");
  }
#ifdef ON_HARDWARE
  rt_puts("cycles "); rt_putu(dwt_cycles(100000)); rt_puts("\\n");
#endif
  return 0;
}`},{file:`run.py`,lang:`python`,src:`"""Cross-compile cycles.c for a Cortex-M3, run it in QEMU with -icount and check the instruction counts."""
import re, shutil, subprocess, sys
import numpy as np

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

CFLAGS = ["-mcpu=cortex-m3", "-mthumb", "-O1", "-nostdlib", "-ffreestanding", "-Wall", "-Werror"]
subprocess.run(["arm-none-eabi-gcc", *CFLAGS, "-T", "link.ld", "rt.c", "cycles.c", "-o", "cycles.elf"], check=True)
out = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-icount", "shift=0",
                      "-semihosting-config", "enable=on,target=native", "-kernel", "cycles.elf"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
assert out.returncode == 0, out.stdout                # semihosting text arrives on QEMU's stderr, merged here
rows = [(int(n), int(t)) for n, t in re.findall(r"N (\\d+) ticks (\\d+)", out.stdout)]
assert len(rows) == 4, out.stdout
INSTR_PER_TICK = 40                     # QEMU: 1 ns per instruction, SysTick at 25 MHz
N = np.array([r[0] for r in rows], float); instr = np.array([r[1] for r in rows], float) * INSTR_PER_TICK
slope, intercept = np.polyfit(N, instr, 1)
for n, i in zip(N, instr):
    print(f"N={int(n):>6}  instructions={int(i):>7}  predicted={int(2 * n):>7}")
print(f"slope {slope:.4f} instructions per iteration, intercept {intercept:.0f}")
assert abs(slope - 2) < 1e-3                          # two instructions per iteration
assert abs(instr[2] - 200000) / 200000 < 0.005         # N=100000 matches the hand count within 0.5 %
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};