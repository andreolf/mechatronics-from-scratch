var e=`p10-l21`,t=40,n=`When firmware crashes on a Cortex-M it doesn’t vanish, it takes a HardFault with the crashing context saved on the stack and the reason recorded in fault status registers. You learn what GDB over SWD gives you, breakpoints, watchpoints and fault registers, write a HardFault handler that recovers the stacked frame and decodes CFSR, HFSR and BFAR, and test it in QEMU on three real faults, checking that it names the faulting function from the stacked PC.`,r=`<h2 id="the-debugger-s-view">The debugger’s view</h2>
<p>A Cortex-M has its debugger built in. Over <strong>SWD</strong> (two wires, SWDIO and SWCLK) a probe such as an ST-LINK or J-Link, driven by <strong>OpenOCD</strong>, lets <strong>GDB</strong> halt the core, read and write any register or memory address, and flash the part:</p>
<ul>
<li><strong>breakpoints</strong>: the Flash Patch and Breakpoint unit (FPB) gives a handful of hardware breakpoints (6 on a typical Cortex-M3/M4), which work on code in flash;</li>
<li><strong>watchpoints</strong>: the DWT’s comparators (4 on M3/M4) halt when an address is read or written. They’re how you find out <em>who</em> is corrupting a variable;</li>
<li><code>monitor reset halt</code>, <code>load</code>, <code>continue</code>, <code>bt</code>, <code>info registers</code>, <code>x/8wx $sp</code> are most of what you need day to day.</li>
</ul>
<p>GDB is the right tool when you can reproduce the bug at the bench. The fault handler below is for when you can’t: it records what happened at the moment of the crash.</p>
<h2 id="what-a-fault-leaves-behind">What a fault leaves behind</h2>
<p>Bad memory accesses, undefined instructions, division by zero (when trapping is enabled) and bad exception returns raise <strong>fault exceptions</strong>. If the configurable faults (MemManage, BusFault, UsageFault) aren’t enabled, they <strong>escalate</strong> to HardFault. On entry the core stacks the usual exception frame (lesson 09):</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>offset</th>
<th>0</th>
<th>4</th>
<th>8</th>
<th>12</th>
<th>16</th>
<th>20</th>
<th>24</th>
<th>28</th>
</tr>
</thead>
<tbody><tr>
<td>register</td>
<td>r0</td>
<td>r1</td>
<td>r2</td>
<td>r3</td>
<td>r12</td>
<td>LR</td>
<td><strong>PC</strong></td>
<td>xPSR</td>
</tr>
</tbody></table></div>
<p>The frame is eight words, 32 bytes, so the stacked PC sits at</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord text"><span class="mord">PC</span></span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">fault</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">mem</span></span><span class="mopen">[</span><span class="mord text"><span class="mord">SP</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">24</span><span class="mclose">]</span><span class="mpunct">,</span></span></span></span></span></div>
<p>where SP is the stack pointer the handler sees. The stacked <strong>PC</strong> is the address of the instruction that faulted (for a precise fault), and the stacked <strong>LR</strong> is where that function would have returned. Bit 2 of the handler’s own LR (EXC_RETURN) says which stack the frame is on: 0 for MSP, 1 for PSP (used by an RTOS’s threads). A three-instruction assembly stub picks the right one and passes a pointer to C.</p>
<h2 id="the-fault-status-registers">The fault status registers</h2>
<div class="table-scroll"><table>
<thead>
<tr>
<th>register</th>
<th>address</th>
<th>what it tells you</th>
</tr>
</thead>
<tbody><tr>
<td>CFSR</td>
<td>0xE000ED28</td>
<td>the cause: MemManage (bits 7:0), BusFault (15:8), UsageFault (31:16)</td>
</tr>
<tr>
<td>HFSR</td>
<td>0xE000ED2C</td>
<td>bit 30 FORCED: a configurable fault escalated to HardFault</td>
</tr>
<tr>
<td>MMFAR</td>
<td>0xE000ED34</td>
<td>faulting address, valid if CFSR.MMARVALID (bit 7)</td>
</tr>
<tr>
<td>BFAR</td>
<td>0xE000ED38</td>
<td>faulting address, valid if CFSR.BFARVALID (bit 15)</td>
</tr>
</tbody></table></div>
<p>Useful CFSR bits: <strong>PRECISERR</strong> (bit 9, a bus error at a known instruction), <strong>IMPRECISERR</strong> (bit 10, a buffered write failed later, so the PC is past the culprit), <strong>UNDEFINSTR</strong> (bit 16), <strong>INVSTATE</strong> (bit 17, typically a call through a function pointer with bit 0 clear), <strong>DIVBYZERO</strong> (bit 25, needs CCR.DIV_0_TRP).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="faultdecode" data-args="{}"></div></div><figcaption>A HardFault decoder. Pick a fault: the stacked frame, CFSR bits and the faulting address are decoded, and the stacked PC is mapped back to a function the way addr2line would.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>The handler prints CFSR = 0x0000_8200, HFSR = 0x4000_0000, BFAR = 0xF000_0000, stacked PC = 0x0000_018C.</p>
<ol>
<li>HFSR bit 30 (FORCED): a BusFault escalated.</li>
<li>CFSR bit 9 PRECISERR and bit 15 BFARVALID: a precise data bus error at a known address.</li>
<li>BFAR = 0xF000_0000: the code read an address where there’s no memory or peripheral.</li>
<li><code>arm-none-eabi-addr2line -f -e fw.elf 0x18c</code> names the function, and with <code>-g</code> the source line.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p><code>fault.c</code> holds the handler and three ways to crash, selected by <code>-DFAULT=n</code>: a division by zero with trapping enabled, a read from an unmapped address, and an undefined instruction. The handler prints the decoded state and exits through semihosting. <code>run.py</code> builds each, runs it in QEMU, and checks that the decoder identified the cause and that the stacked PC lies inside the function that crashed.</p>

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

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">fault.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_exit</span><span class="hljs-params">(<span class="hljs-type">int</span> code)</span>;

<span class="hljs-meta">#<span class="hljs-keyword">define</span> CCR   (*(volatile uint32_t *)0xE000ED14)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CFSR  (*(volatile uint32_t *)0xE000ED28)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> HFSR  (*(volatile uint32_t *)0xE000ED2C)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> MMFAR (*(volatile uint32_t *)0xE000ED34)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> BFAR  (*(volatile uint32_t *)0xE000ED38)</span>

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">put_hex</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *name, <span class="hljs-type">uint32_t</span> v)</span> {
  <span class="hljs-type">char</span> b[<span class="hljs-number">11</span>] = <span class="hljs-string">&quot;0x00000000&quot;</span>; <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">8</span>; i++) b[<span class="hljs-number">9</span> - i] = <span class="hljs-string">&quot;0123456789abcdef&quot;</span>[(v &gt;&gt; (<span class="hljs-number">4</span> * i)) &amp; <span class="hljs-number">0xF</span>];
  rt_puts(name); rt_puts(<span class="hljs-string">&quot;=&quot;</span>); rt_puts(b); rt_puts(<span class="hljs-string">&quot; &quot;</span>);
}
<span class="hljs-comment">/* the stub: pick MSP or PSP from EXC_RETURN bit 2, pass the frame pointer to C */</span>
__attribute__((naked)) <span class="hljs-type">void</span> <span class="hljs-title function_">HardFault_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;tst lr, #4      \\n\\t&quot;</span>
                   <span class="hljs-string">&quot;ite eq          \\n\\t&quot;</span>
                   <span class="hljs-string">&quot;mrseq r0, msp   \\n\\t&quot;</span>
                   <span class="hljs-string">&quot;mrsne r0, psp   \\n\\t&quot;</span>
                   <span class="hljs-string">&quot;b hardfault_c   \\n\\t&quot;</span>)</span>;
}
<span class="hljs-type">void</span> <span class="hljs-title function_">hardfault_c</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint32_t</span> *frame)</span> {
  <span class="hljs-type">uint32_t</span> cfsr = CFSR, hfsr = HFSR;
  put_hex(<span class="hljs-string">&quot;pc&quot;</span>, frame[<span class="hljs-number">6</span>]); put_hex(<span class="hljs-string">&quot;lr&quot;</span>, frame[<span class="hljs-number">5</span>]); put_hex(<span class="hljs-string">&quot;xpsr&quot;</span>, frame[<span class="hljs-number">7</span>]);
  put_hex(<span class="hljs-string">&quot;cfsr&quot;</span>, cfsr); put_hex(<span class="hljs-string">&quot;hfsr&quot;</span>, hfsr); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (hfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">30</span>)) rt_puts(<span class="hljs-string">&quot;cause: FORCED (escalated to HardFault)\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">25</span>)) rt_puts(<span class="hljs-string">&quot;cause: DIVBYZERO\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">16</span>)) rt_puts(<span class="hljs-string">&quot;cause: UNDEFINSTR\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">17</span>)) rt_puts(<span class="hljs-string">&quot;cause: INVSTATE\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">9</span>))  rt_puts(<span class="hljs-string">&quot;cause: PRECISERR\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">10</span>)) rt_puts(<span class="hljs-string">&quot;cause: IMPRECISERR (PC is after the culprit)\\n&quot;</span>);
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">15</span>)) { put_hex(<span class="hljs-string">&quot;bfar&quot;</span>, BFAR); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>); }
  <span class="hljs-keyword">if</span> (cfsr &amp; (<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">7</span>))  { put_hex(<span class="hljs-string">&quot;mmfar&quot;</span>, MMFAR); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>); }
  rt_exit(<span class="hljs-number">0</span>);                                    <span class="hljs-comment">/* on a board: log to backup RAM, then reset */</span>
}

__attribute__((noinline)) <span class="hljs-type">int</span> <span class="hljs-title function_">divide</span><span class="hljs-params">(<span class="hljs-type">int</span> a, <span class="hljs-type">int</span> b)</span> { <span class="hljs-keyword">return</span> a / b; }
__attribute__((noinline)) <span class="hljs-type">uint32_t</span> <span class="hljs-title function_">peek</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> addr)</span> { <span class="hljs-keyword">return</span> *(<span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> *)addr; }
__attribute__((noinline)) <span class="hljs-type">void</span> <span class="hljs-title function_">bad_opcode</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;udf #0&quot;</span>)</span>; }

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-keyword">volatile</span> <span class="hljs-type">int</span> zero = <span class="hljs-number">0</span>;
<span class="hljs-meta">#<span class="hljs-keyword">if</span> FAULT == 1</span>
  CCR |= <span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">4</span>;                                <span class="hljs-comment">/* DIV_0_TRP: trap integer division by zero */</span>
  rt_putu((<span class="hljs-type">uint32_t</span>)divide(<span class="hljs-number">10</span>, zero));
<span class="hljs-meta">#<span class="hljs-keyword">elif</span> FAULT == 2</span>
  rt_putu(peek(<span class="hljs-number">0xF0000000u</span>));                    <span class="hljs-comment">/* no memory or peripheral here */</span>
<span class="hljs-meta">#<span class="hljs-keyword">else</span></span>
  bad_opcode();
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
  (<span class="hljs-type">void</span>)zero;
  rt_puts(<span class="hljs-string">&quot;no fault?\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
}</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Trigger three faults in QEMU and check the HardFault decoder names the cause and the function.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> re, shutil, subprocess, sys
<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">function_at</span>(<span class="hljs-params">elf, pc</span>):
    out = subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-addr2line&quot;</span>, <span class="hljs-string">&quot;-f&quot;</span>, <span class="hljs-string">&quot;-e&quot;</span>, elf, <span class="hljs-built_in">hex</span>(pc)], capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>).stdout
    <span class="hljs-keyword">return</span> out.splitlines()[<span class="hljs-number">0</span>]

cases = {<span class="hljs-number">1</span>: (<span class="hljs-string">&quot;DIVBYZERO&quot;</span>, <span class="hljs-string">&quot;divide&quot;</span>), <span class="hljs-number">2</span>: (<span class="hljs-string">&quot;PRECISERR&quot;</span>, <span class="hljs-string">&quot;peek&quot;</span>), <span class="hljs-number">3</span>: (<span class="hljs-string">&quot;UNDEFINSTR&quot;</span>, <span class="hljs-string">&quot;bad_opcode&quot;</span>)}
<span class="hljs-keyword">for</span> n, (cause, func) <span class="hljs-keyword">in</span> cases.items():
    elf = <span class="hljs-string">f&quot;fault<span class="hljs-subst">{n}</span>.elf&quot;</span>
    subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;-mcpu=cortex-m3&quot;</span>, <span class="hljs-string">&quot;-mthumb&quot;</span>, <span class="hljs-string">&quot;-O1&quot;</span>, <span class="hljs-string">&quot;-g&quot;</span>, <span class="hljs-string">&quot;-Wall&quot;</span>, <span class="hljs-string">&quot;-Werror&quot;</span>, <span class="hljs-string">&quot;-ffreestanding&quot;</span>,
                    <span class="hljs-string">&quot;-nostdlib&quot;</span>, <span class="hljs-string">&quot;-T&quot;</span>, <span class="hljs-string">&quot;link.ld&quot;</span>, <span class="hljs-string">f&quot;-DFAULT=<span class="hljs-subst">{n}</span>&quot;</span>, <span class="hljs-string">&quot;rt.c&quot;</span>, <span class="hljs-string">&quot;fault.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, elf], check=<span class="hljs-literal">True</span>)
    r = subprocess.run([<span class="hljs-string">&quot;qemu-system-arm&quot;</span>, <span class="hljs-string">&quot;-M&quot;</span>, <span class="hljs-string">&quot;mps2-an385&quot;</span>, <span class="hljs-string">&quot;-nographic&quot;</span>, <span class="hljs-string">&quot;-semihosting-config&quot;</span>, <span class="hljs-string">&quot;enable=on,target=native&quot;</span>,
                        <span class="hljs-string">&quot;-kernel&quot;</span>, elf], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">30</span>)
    <span class="hljs-keyword">assert</span> r.returncode == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;no fault?&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> r.stdout, r.stdout
    regs = {k: <span class="hljs-built_in">int</span>(v, <span class="hljs-number">16</span>) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> re.findall(<span class="hljs-string">r&quot;(\\w+)=0x([0-9a-f]{8})&quot;</span>, r.stdout)}
    <span class="hljs-keyword">assert</span> <span class="hljs-string">f&quot;cause: <span class="hljs-subst">{cause}</span>&quot;</span> <span class="hljs-keyword">in</span> r.stdout <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;FORCED&quot;</span> <span class="hljs-keyword">in</span> r.stdout, r.stdout
    where = function_at(elf, regs[<span class="hljs-string">&quot;pc&quot;</span>])
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;fault <span class="hljs-subst">{n}</span>: <span class="hljs-subst">{cause:&lt;<span class="hljs-number">10</span>}</span> pc=0x<span class="hljs-subst">{regs[<span class="hljs-string">&#x27;pc&#x27;</span>]:08x}</span> in <span class="hljs-subst">{where}</span>()  cfsr=0x<span class="hljs-subst">{regs[<span class="hljs-string">&#x27;cfsr&#x27;</span>]:08x}</span>&quot;</span>
          + (<span class="hljs-string">f&quot; bfar=0x<span class="hljs-subst">{regs[<span class="hljs-string">&#x27;bfar&#x27;</span>]:08x}</span>&quot;</span> <span class="hljs-keyword">if</span> <span class="hljs-string">&quot;bfar&quot;</span> <span class="hljs-keyword">in</span> regs <span class="hljs-keyword">else</span> <span class="hljs-string">&quot;&quot;</span>))
    <span class="hljs-keyword">assert</span> where == func                                   <span class="hljs-comment"># the decoder identifies the faulting function</span>
    <span class="hljs-keyword">if</span> n == <span class="hljs-number">2</span>:
        <span class="hljs-keyword">assert</span> regs[<span class="hljs-string">&quot;bfar&quot;</span>] == <span class="hljs-number">0xF0000000</span> <span class="hljs-keyword">and</span> regs[<span class="hljs-string">&quot;cfsr&quot;</span>] &amp; (<span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">15</span>)
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>CFSR shows IMPRECISERR and the stacked PC points into an unrelated function. How do you find the real culprit?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>An imprecise bus fault comes from a buffered write that failed after the CPU moved on, so the PC is a few instructions later. Set <code>SCB-&gt;ACTLR</code> DISDEFWBUF (bit 1) to disable the write buffer while debugging; the fault then becomes precise and the PC points at the guilty store. Remember to re-enable it, since it costs performance.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A HardFault with INVSTATE right after calling a function pointer. What’s wrong?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The pointer’s bit 0 is clear, so the core tried to switch to Arm state, which a Cortex-M doesn’t have. Usually the pointer was computed by hand, read from uninitialised memory, or came from a corrupted table. Function addresses from the linker always have bit 0 set.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l21"></div>

`,i=[{id:`the-debugger-s-view`,title:`The debugger’s view`},{id:`what-a-fault-leaves-behind`,title:`What a fault leaves behind`},{id:`the-fault-status-registers`,title:`The fault status registers`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l21-q1`,type:`num`,q:`<p>Offset in bytes of the stacked PC in the exception frame?</p>
`,explain:`<p>The seventh word.</p>
`,answer:24,tol:.001,unit:`bytes`},{id:`p10-l21-q2`,type:`num`,q:`<p>CFSR value (decimal) with only DIVBYZERO set?</p>
`,explain:`<p>0x02000000.</p>
`,answer:33554432,tol:1e-7,unit:``},{id:`p10-l21-q3`,type:`num`,q:`<p>CFSR value (decimal) for PRECISERR plus BFARVALID?</p>
`,explain:`<p>0x8200.</p>
`,answer:33280,tol:.001,unit:``},{id:`p10-l21-q4`,type:`num`,q:`<p>Size in bytes of the basic exception frame?</p>
`,explain:`<p>Eight registers.</p>
`,answer:32,tol:.001,unit:`bytes`},{id:`p10-l21-q5`,type:`mc`,q:`<p>EXC_RETURN bit 2 tells the handler…</p>
`,explain:`<p>The stub tests it and reads MSP or PSP.</p>
`,options:[`whether the FPU was used`,`the fault cause`,`which stack (MSP or PSP) holds the frame`,`the priority`],answer:2},{id:`p10-l21-q6`,type:`mc`,q:`<p>Which tool maps a stacked PC to a function and line?</p>
`,explain:`<p>It needs the ELF with symbols, and -g for lines.</p>
`,options:[`addr2line (or GDB’s info symbol / list)`,`nm only`,`size`,`objcopy`],answer:0}],o=[{file:`link.ld`,lang:`ld`,src:`/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */
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
};`},{file:`fault.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v); void rt_exit(int code);

#define CCR   (*(volatile uint32_t *)0xE000ED14)
#define CFSR  (*(volatile uint32_t *)0xE000ED28)
#define HFSR  (*(volatile uint32_t *)0xE000ED2C)
#define MMFAR (*(volatile uint32_t *)0xE000ED34)
#define BFAR  (*(volatile uint32_t *)0xE000ED38)

static void put_hex(const char *name, uint32_t v) {
  char b[11] = "0x00000000"; for (int i = 0; i < 8; i++) b[9 - i] = "0123456789abcdef"[(v >> (4 * i)) & 0xF];
  rt_puts(name); rt_puts("="); rt_puts(b); rt_puts(" ");
}
/* the stub: pick MSP or PSP from EXC_RETURN bit 2, pass the frame pointer to C */
__attribute__((naked)) void HardFault_Handler(void) {
  __asm__ volatile("tst lr, #4      \\n\\t"
                   "ite eq          \\n\\t"
                   "mrseq r0, msp   \\n\\t"
                   "mrsne r0, psp   \\n\\t"
                   "b hardfault_c   \\n\\t");
}
void hardfault_c(const uint32_t *frame) {
  uint32_t cfsr = CFSR, hfsr = HFSR;
  put_hex("pc", frame[6]); put_hex("lr", frame[5]); put_hex("xpsr", frame[7]);
  put_hex("cfsr", cfsr); put_hex("hfsr", hfsr); rt_puts("\\n");
  if (hfsr & (1u << 30)) rt_puts("cause: FORCED (escalated to HardFault)\\n");
  if (cfsr & (1u << 25)) rt_puts("cause: DIVBYZERO\\n");
  if (cfsr & (1u << 16)) rt_puts("cause: UNDEFINSTR\\n");
  if (cfsr & (1u << 17)) rt_puts("cause: INVSTATE\\n");
  if (cfsr & (1u << 9))  rt_puts("cause: PRECISERR\\n");
  if (cfsr & (1u << 10)) rt_puts("cause: IMPRECISERR (PC is after the culprit)\\n");
  if (cfsr & (1u << 15)) { put_hex("bfar", BFAR); rt_puts("\\n"); }
  if (cfsr & (1u << 7))  { put_hex("mmfar", MMFAR); rt_puts("\\n"); }
  rt_exit(0);                                    /* on a board: log to backup RAM, then reset */
}

__attribute__((noinline)) int divide(int a, int b) { return a / b; }
__attribute__((noinline)) uint32_t peek(uint32_t addr) { return *(volatile uint32_t *)addr; }
__attribute__((noinline)) void bad_opcode(void) { __asm__ volatile("udf #0"); }

int main(void) {
  volatile int zero = 0;
#if FAULT == 1
  CCR |= 1u << 4;                                /* DIV_0_TRP: trap integer division by zero */
  rt_putu((uint32_t)divide(10, zero));
#elif FAULT == 2
  rt_putu(peek(0xF0000000u));                    /* no memory or peripheral here */
#else
  bad_opcode();
#endif
  (void)zero;
  rt_puts("no fault?\\n");
  return 1;
}`},{file:`run.py`,lang:`python`,src:`"""Trigger three faults in QEMU and check the HardFault decoder names the cause and the function."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

def function_at(elf, pc):
    out = subprocess.run(["arm-none-eabi-addr2line", "-f", "-e", elf, hex(pc)], capture_output=True, text=True).stdout
    return out.splitlines()[0]

cases = {1: ("DIVBYZERO", "divide"), 2: ("PRECISERR", "peek"), 3: ("UNDEFINSTR", "bad_opcode")}
for n, (cause, func) in cases.items():
    elf = f"fault{n}.elf"
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-g", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", f"-DFAULT={n}", "rt.c", "fault.c", "-o", elf], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config", "enable=on,target=native",
                        "-kernel", elf], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
    assert r.returncode == 0 and "no fault?" not in r.stdout, r.stdout
    regs = {k: int(v, 16) for k, v in re.findall(r"(\\w+)=0x([0-9a-f]{8})", r.stdout)}
    assert f"cause: {cause}" in r.stdout and "FORCED" in r.stdout, r.stdout
    where = function_at(elf, regs["pc"])
    print(f"fault {n}: {cause:<10} pc=0x{regs['pc']:08x} in {where}()  cfsr=0x{regs['cfsr']:08x}"
          + (f" bfar=0x{regs['bfar']:08x}" if "bfar" in regs else ""))
    assert where == func                                   # the decoder identifies the faulting function
    if n == 2:
        assert regs["bfar"] == 0xF0000000 and regs["cfsr"] & (1 << 15)
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};