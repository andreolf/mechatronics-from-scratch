var e=`p10-l04`,t=40,n=`Before main runs, something has to set the stack pointer, copy initialised variables into RAM and zero the rest, and that something is about thirty lines of C. You derive the reset sequence of a Cortex-M, write the vector table and startup code from scratch, and prove they work by booting in QEMU, then break them on purpose and watch the global-variable test catch it.`,r=`<h2 id="what-happens-at-reset">What happens at reset</h2>
<p>When a Cortex-M core leaves reset it does three things in hardware, with no code at all:</p>
<ol>
<li>reads the word at address 0x0000_0000 into <strong>SP</strong> (the main stack pointer, MSP);</li>
<li>reads the word at 0x0000_0004, the <strong>reset vector</strong>, into <strong>PC</strong> (bit 0 must be 1, meaning Thumb);</li>
<li>starts executing there, in Thread mode, privileged, with interrupts enabled but nothing configured.</li>
</ol>
<p>That’s all. RAM contains whatever it powered up with. A global <code>int n = 7;</code> is <strong>not</strong> 7 yet: its initial value sits in flash at the <code>.data</code> load address, and <code>int buf[64];</code> is not zero. The C standard promises both before <code>main</code>, so the startup code must:</p>
<ul>
<li>copy <code>.data</code> from its LMA in flash (<code>_sidata</code>) to its VMA in RAM (<code>_sdata</code> to <code>_edata</code>),</li>
<li>zero <code>.bss</code> (<code>_sbss</code> to <code>_ebss</code>),</li>
<li>optionally set up clocks (<code>SystemInit</code>, lesson 07) and run C++ constructors (<code>__libc_init_array</code>),</li>
<li>call <code>main</code>, and never return from the reset handler.</li>
</ul>
<p>The cost is linear: copying <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span></span></span></span> bytes and zeroing <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span></span></span></span> bytes word by word takes about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord">/4</span></span></span></span> load/store pairs plus <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mord">/4</span></span></span></span> stores, a few microseconds for kilobytes at 100 MHz.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="resetstep" data-args="{}"></div></div><figcaption>Step from reset to main. Watch SP and PC load from the vector table, then .data fill with its initial values and .bss clear, while a global’s value changes from garbage to correct.</figcaption></figure>
<h2 id="the-vector-table">The vector table</h2>
<p>The vector table is an array of 32-bit words at address 0 (relocatable later through <code>SCB-&gt;VTOR</code>). On a Cortex-M3/M4:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>index</th>
<th>offset</th>
<th>entry</th>
</tr>
</thead>
<tbody><tr>
<td>0</td>
<td>0x00</td>
<td>initial SP</td>
</tr>
<tr>
<td>1</td>
<td>0x04</td>
<td>Reset</td>
</tr>
<tr>
<td>2</td>
<td>0x08</td>
<td>NMI</td>
</tr>
<tr>
<td>3</td>
<td>0x0C</td>
<td>HardFault</td>
</tr>
<tr>
<td>4–6</td>
<td>0x10–0x18</td>
<td>MemManage, BusFault, UsageFault</td>
</tr>
<tr>
<td>11</td>
<td>0x2C</td>
<td>SVCall</td>
</tr>
<tr>
<td>14</td>
<td>0x38</td>
<td>PendSV</td>
</tr>
<tr>
<td>15</td>
<td>0x3C</td>
<td>SysTick</td>
</tr>
<tr>
<td>16 + n</td>
<td>0x40 + 4n</td>
<td>external interrupt n (IRQn)</td>
</tr>
</tbody></table></div>
<p>Exception number <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> lives at offset <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">4</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span>. Handlers are declared <strong>weak aliases</strong> of a default handler, so any file can define <code>void SysTick_Handler(void)</code> and the linker picks that over the default, with no registration call.</p>
<h2 id="worked-example">Worked example</h2>
<p><code>.data</code> is 12 bytes and <code>.bss</code> is 40 bytes on a part at 64 MHz.</p>
<ol>
<li>Copy: 3 words, each a load and a store; zero: 10 stores.</li>
<li>The external interrupt 5 vector lives at offset <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">40</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">54</span></span></span></span>.</li>
<li>SysTick (exception 15) is at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">15</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">3</span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span>.</li>
<li>If the copy loop were skipped, a global initialised to 42 would read whatever RAM held: 0 in QEMU, random on hardware.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p><code>startup.c</code> is the whole boot path. For testing it has two switches: <code>POISON</code> fills the static RAM with 0xA5 first, as real RAM would hold garbage (QEMU’s RAM starts at zero, which would hide a missing <code>.bss</code> loop), and <code>SKIP_COPY</code> / <code>SKIP_ZERO</code> remove a step. <code>main.c</code> checks the globals. <code>run.py</code> boots the correct build and the broken ones.</p>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">link.ld</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-ld"><span class="hljs-comment">/* Minimal linker script for a Cortex-M3 (QEMU mps2-an385 memory map). */</span>
<span class="hljs-keyword">MEMORY</span> {
  FLASH (rx)  : <span class="hljs-keyword">ORIGIN</span> = <span class="hljs-number">0x00000000</span>, <span class="hljs-keyword">LENGTH</span> = <span class="hljs-number">256</span>K
  RAM   (rwx) : <span class="hljs-keyword">ORIGIN</span> = <span class="hljs-number">0x20000000</span>, <span class="hljs-keyword">LENGTH</span> = <span class="hljs-number">64</span>K
}
STACK_SIZE = <span class="hljs-number">4</span>K;
<span class="hljs-keyword">ENTRY</span>(Reset_Handler)

<span class="hljs-keyword">SECTIONS</span> {
  <span class="hljs-string">.text</span> : {
    <span class="hljs-keyword">KEEP</span>(*(<span class="hljs-string">.vectors</span>))          <span class="hljs-comment">/* the vector table must be first, at address 0 */</span>
    *(<span class="hljs-string">.text</span>*)
    *(<span class="hljs-string">.rodata</span>*)
    . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>);
  } &gt; FLASH

  <span class="hljs-string">.data</span> : {                    <span class="hljs-comment">/* VMA in RAM, LMA in flash */</span>
    _sdata = .;
    *(<span class="hljs-string">.data</span>*)
    . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>);
    _edata = .;
  } &gt; RAM AT &gt; FLASH
  _sidata = <span class="hljs-keyword">LOADADDR</span>(<span class="hljs-string">.data</span>);

  <span class="hljs-string">.bss</span> (NOLOAD) : {
    _sbss = .;
    *(<span class="hljs-string">.bss</span>*) *(COMMON)
    . = <span class="hljs-keyword">ALIGN</span>(<span class="hljs-number">4</span>);
    _ebss = .;
  } &gt; RAM

  _heap_start = _ebss;
  _estack     = <span class="hljs-keyword">ORIGIN</span>(RAM) + <span class="hljs-keyword">LENGTH</span>(RAM);
  _heap_end   = _estack - STACK_SIZE;
  ASSERT(_heap_end &gt;= _heap_start, &quot;RAM overflow: <span class="hljs-string">.data</span> + <span class="hljs-string">.bss</span> + stack do not fit&quot;)
}</code></pre></div>

<div class="code-card" data-code="1"><div class="code-head"><span class="fname" translate="no">startup.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="1">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="1">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* startup.c: vector table and reset handler for a Cortex-M3, written from scratch. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>

<span class="hljs-keyword">extern</span> <span class="hljs-type">uint32_t</span> _sidata, _sdata, _edata, _sbss, _ebss, _estack;   <span class="hljs-comment">/* from link.ld */</span>
<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span>;
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_exit</span><span class="hljs-params">(<span class="hljs-type">int</span> code)</span>;

<span class="hljs-type">void</span> <span class="hljs-title function_">Default_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> { <span class="hljs-keyword">for</span> (;;) {} }       <span class="hljs-comment">/* park here; a debugger shows where */</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> WEAK_ALIAS __attribute__((weak, alias(<span class="hljs-string">&quot;Default_Handler&quot;</span>)))</span>
<span class="hljs-type">void</span> <span class="hljs-title function_">NMI_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">HardFault_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">MemManage_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">BusFault_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">UsageFault_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">SVC_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">PendSV_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">SysTick_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> WEAK_ALIAS;
<span class="hljs-type">void</span> <span class="hljs-title function_">Reset_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span>;

__attribute__((section(<span class="hljs-string">&quot;.vectors&quot;</span>), used))
<span class="hljs-type">static</span> <span class="hljs-title function_">void</span> <span class="hljs-params">(*<span class="hljs-type">const</span> vector_table[<span class="hljs-number">16</span>])</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> = {
  (<span class="hljs-type">void</span> (*)(<span class="hljs-type">void</span>))&amp;_estack,   <span class="hljs-comment">/* 0: initial SP */</span>
  Reset_Handler,              <span class="hljs-comment">/* 1 */</span>
  NMI_Handler, HardFault_Handler, MemManage_Handler, BusFault_Handler, UsageFault_Handler,
  <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>,                 <span class="hljs-comment">/* 7-10 reserved */</span>
  SVC_Handler, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>,          <span class="hljs-comment">/* 11 SVCall, 12 debug monitor, 13 reserved */</span>
  PendSV_Handler, SysTick_Handler,
};

<span class="hljs-type">void</span> <span class="hljs-title function_">Reset_Handler</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
<span class="hljs-meta">#<span class="hljs-keyword">ifdef</span> POISON</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> *p = &amp;_sdata; p &lt; &amp;_ebss; p++) *p = <span class="hljs-number">0xA5A5A5A5u</span>;   <span class="hljs-comment">/* emulate power-up garbage */</span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">ifndef</span> SKIP_COPY</span>
  <span class="hljs-type">const</span> <span class="hljs-type">uint32_t</span> *src = &amp;_sidata;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> *dst = &amp;_sdata; dst &lt; &amp;_edata;) *dst++ = *src++;  <span class="hljs-comment">/* .data: flash -&gt; RAM */</span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">ifndef</span> SKIP_ZERO</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> *dst = &amp;_sbss; dst &lt; &amp;_ebss;) *dst++ = <span class="hljs-number">0</span>;          <span class="hljs-comment">/* .bss = 0 */</span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
  rt_exit(main());            <span class="hljs-comment">/* on a real board: main(); for (;;) {} */</span>
}</code></pre></div>

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">semihost.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-comment">/* semihost.c: print and exit through the debugger (QEMU) interface. */</span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">semihost</span><span class="hljs-params">(<span class="hljs-type">int</span> op, <span class="hljs-type">const</span> <span class="hljs-type">void</span> *arg)</span> {
  <span class="hljs-keyword">register</span> <span class="hljs-type">int</span> r0 __asm__(<span class="hljs-string">&quot;r0&quot;</span>) = op;
  <span class="hljs-keyword">register</span> <span class="hljs-type">const</span> <span class="hljs-type">void</span> *r1 __asm__(<span class="hljs-string">&quot;r1&quot;</span>) = arg;
  __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;bkpt 0xAB&quot;</span> : <span class="hljs-string">&quot;+r&quot;</span>(r0) : <span class="hljs-string">&quot;r&quot;</span>(r1) : <span class="hljs-string">&quot;memory&quot;</span>)</span>;
  <span class="hljs-keyword">return</span> r0;
}
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span> { semihost(<span class="hljs-number">0x04</span>, s); }
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_exit</span><span class="hljs-params">(<span class="hljs-type">int</span> code)</span> { semihost(<span class="hljs-number">0x18</span>, (<span class="hljs-type">const</span> <span class="hljs-type">void</span> *)(<span class="hljs-type">uintptr_t</span>)(code ? <span class="hljs-number">0x20024u</span> : <span class="hljs-number">0x20026u</span>)); <span class="hljs-keyword">for</span> (;;) {} }</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">main.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>;

<span class="hljs-type">uint32_t</span> answer = <span class="hljs-number">42</span>;                       <span class="hljs-comment">/* .data */</span>
<span class="hljs-type">int16_t</span>  coeffs[<span class="hljs-number">3</span>] = {<span class="hljs-number">-3</span>, <span class="hljs-number">5</span>, <span class="hljs-number">7</span>};            <span class="hljs-comment">/* .data */</span>
<span class="hljs-type">uint32_t</span> zeros[<span class="hljs-number">16</span>];                         <span class="hljs-comment">/* .bss  */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint8_t</span> seen;                        <span class="hljs-comment">/* .bss  */</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">int</span> ok = answer == <span class="hljs-number">42</span> &amp;&amp; coeffs[<span class="hljs-number">0</span>] == <span class="hljs-number">-3</span> &amp;&amp; coeffs[<span class="hljs-number">2</span>] == <span class="hljs-number">7</span> &amp;&amp; seen == <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">16</span>; i++) ok = ok &amp;&amp; zeros[i] == <span class="hljs-number">0</span>;
  rt_puts(ok ? <span class="hljs-string">&quot;globals ok\\n&quot;</span> : <span class="hljs-string">&quot;globals WRONG\\n&quot;</span>);
  <span class="hljs-keyword">return</span> ok ? <span class="hljs-number">0</span> : <span class="hljs-number">1</span>;
}</code></pre></div>

<div class="code-card" data-code="4"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="4">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="4">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Boot the startup code in QEMU, then break it on purpose and check the test catches it.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> shutil, struct, subprocess, sys

<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">boot</span>(<span class="hljs-params">*defines</span>):
    subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;-mcpu=cortex-m3&quot;</span>, <span class="hljs-string">&quot;-mthumb&quot;</span>, <span class="hljs-string">&quot;-O1&quot;</span>, <span class="hljs-string">&quot;-Wall&quot;</span>, <span class="hljs-string">&quot;-Werror&quot;</span>, <span class="hljs-string">&quot;-ffreestanding&quot;</span>,
                    <span class="hljs-string">&quot;-nostdlib&quot;</span>, <span class="hljs-string">&quot;-T&quot;</span>, <span class="hljs-string">&quot;link.ld&quot;</span>, *[<span class="hljs-string">f&quot;-D<span class="hljs-subst">{d}</span>&quot;</span> <span class="hljs-keyword">for</span> d <span class="hljs-keyword">in</span> defines],
                    <span class="hljs-string">&quot;startup.c&quot;</span>, <span class="hljs-string">&quot;semihost.c&quot;</span>, <span class="hljs-string">&quot;main.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], check=<span class="hljs-literal">True</span>)
    r = subprocess.run([<span class="hljs-string">&quot;qemu-system-arm&quot;</span>, <span class="hljs-string">&quot;-M&quot;</span>, <span class="hljs-string">&quot;mps2-an385&quot;</span>, <span class="hljs-string">&quot;-nographic&quot;</span>, <span class="hljs-string">&quot;-semihosting-config&quot;</span>,
                        <span class="hljs-string">&quot;enable=on,target=native&quot;</span>, <span class="hljs-string">&quot;-kernel&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">30</span>)
    <span class="hljs-keyword">return</span> r.returncode, r.stdout.strip()

cases = {(): <span class="hljs-number">0</span>, (<span class="hljs-string">&quot;POISON&quot;</span>,): <span class="hljs-number">0</span>, (<span class="hljs-string">&quot;SKIP_COPY&quot;</span>,): <span class="hljs-number">1</span>, (<span class="hljs-string">&quot;POISON&quot;</span>, <span class="hljs-string">&quot;SKIP_ZERO&quot;</span>): <span class="hljs-number">1</span>, (<span class="hljs-string">&quot;POISON&quot;</span>, <span class="hljs-string">&quot;SKIP_COPY&quot;</span>, <span class="hljs-string">&quot;SKIP_ZERO&quot;</span>): <span class="hljs-number">1</span>}
<span class="hljs-keyword">for</span> defines, expect <span class="hljs-keyword">in</span> cases.items():
    code, out = boot(*defines)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-string">&#x27; &#x27;</span>.join(defines) <span class="hljs-keyword">or</span> <span class="hljs-string">&#x27;normal&#x27;</span>:&lt;<span class="hljs-number">28</span>}</span> exit <span class="hljs-subst">{code}</span>  <span class="hljs-subst">{out}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> code == expect, (defines, code, out)

<span class="hljs-comment"># vector table layout: SysTick handler address at offset 0x3C, reset vector odd</span>
boot()
subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-objcopy&quot;</span>, <span class="hljs-string">&quot;-O&quot;</span>, <span class="hljs-string">&quot;binary&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>, <span class="hljs-string">&quot;fw.bin&quot;</span>], check=<span class="hljs-literal">True</span>)
words = struct.unpack_from(<span class="hljs-string">&quot;&lt;16I&quot;</span>, <span class="hljs-built_in">open</span>(<span class="hljs-string">&quot;fw.bin&quot;</span>, <span class="hljs-string">&quot;rb&quot;</span>).read(), <span class="hljs-number">0</span>)
nm = {l.split()[<span class="hljs-number">2</span>]: <span class="hljs-built_in">int</span>(l.split()[<span class="hljs-number">0</span>], <span class="hljs-number">16</span>) <span class="hljs-keyword">for</span> l <span class="hljs-keyword">in</span> subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-nm&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>).stdout.splitlines() <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(l.split()) == <span class="hljs-number">3</span>}
<span class="hljs-keyword">assert</span> words[<span class="hljs-number">0</span>] == nm[<span class="hljs-string">&quot;_estack&quot;</span>] <span class="hljs-keyword">and</span> words[<span class="hljs-number">1</span>] == nm[<span class="hljs-string">&quot;Reset_Handler&quot;</span>] | <span class="hljs-number">1</span>
<span class="hljs-keyword">assert</span> words[<span class="hljs-number">15</span>] == nm[<span class="hljs-string">&quot;SysTick_Handler&quot;</span>] | <span class="hljs-number">1</span> == nm[<span class="hljs-string">&quot;Default_Handler&quot;</span>] | <span class="hljs-number">1</span>   <span class="hljs-comment"># weak alias: not overridden here</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Add <code>void SysTick_Handler(void) { ticks++; }</code> to <code>main.c</code>. What changes in the vector table, and why didn’t you have to edit <code>startup.c</code>?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Word 15 now holds the address of your <code>SysTick_Handler</code> (with bit 0 set) instead of <code>Default_Handler</code>. The startup file’s declaration is a <em>weak</em> alias, and a strong definition anywhere in the program wins at link time.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>A colleague moves the <code>.bss</code> loop before the <code>.data</code> copy. Does it still work? What if a C++ constructor runs before both?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The order of the two loops doesn’t matter because the regions don’t overlap. A constructor (from <code>__libc_init_array</code>) must run <em>after</em> both, since it may read initialised globals; called first, it would see garbage and its writes into <code>.bss</code> would then be zeroed.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l04"></div>

`,i=[{id:`what-happens-at-reset`,title:`What happens at reset`},{id:`the-vector-table`,title:`The vector table`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l04-q1`,type:`num`,q:`<p>Offset in the vector table of external interrupt IRQ 5 (decimal)?</p>
`,explain:`<p>0x54.</p>
`,answer:84,tol:.001,unit:`bytes`},{id:`p10-l04-q2`,type:`num`,q:`<p>Offset of the SysTick vector (exception 15), decimal?</p>
`,explain:`<p>0x3C.</p>
`,answer:60,tol:.001,unit:`bytes`},{id:`p10-l04-q3`,type:`num`,q:`<p>How many word stores zero a 40-byte .bss?</p>
`,explain:`<p>One per 32-bit word.</p>
`,answer:10,tol:.001,unit:`stores`},{id:`p10-l04-q4`,type:`num`,q:`<p>Copying 4 KiB of .data at about 4 cycles per word on a 64 MHz core takes how many µs?</p>
`,explain:`<p>1024 words × 4 cycles / 64 MHz.</p>
`,answer:64,tol:.001,unit:`µs`},{id:`p10-l04-q5`,type:`mc`,q:`<p>What does the core read from address 0x00000000 at reset?</p>
`,explain:`<p>Word 0 is SP, word 1 is the reset vector.</p>
`,options:[`the first instruction`,`the initial stack pointer`,`the reset vector`,`the clock configuration`],answer:1},{id:`p10-l04-q6`,type:`mc`,q:`<p>Why does the test poison RAM with 0xA5 before checking .bss?</p>
`,explain:`<p>Real RAM powers up with garbage; the test must too.</p>
`,options:[`QEMU RAM starts at zero and would hide a missing .bss loop`,`to speed up boot`,`the linker requires it`,`to set the stack`],answer:0}],o=[{file:`link.ld`,lang:`ld`,src:`/* Minimal linker script for a Cortex-M3 (QEMU mps2-an385 memory map). */
MEMORY {
  FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
STACK_SIZE = 4K;
ENTRY(Reset_Handler)

SECTIONS {
  .text : {
    KEEP(*(.vectors))          /* the vector table must be first, at address 0 */
    *(.text*)
    *(.rodata*)
    . = ALIGN(4);
  } > FLASH

  .data : {                    /* VMA in RAM, LMA in flash */
    _sdata = .;
    *(.data*)
    . = ALIGN(4);
    _edata = .;
  } > RAM AT > FLASH
  _sidata = LOADADDR(.data);

  .bss (NOLOAD) : {
    _sbss = .;
    *(.bss*) *(COMMON)
    . = ALIGN(4);
    _ebss = .;
  } > RAM

  _heap_start = _ebss;
  _estack     = ORIGIN(RAM) + LENGTH(RAM);
  _heap_end   = _estack - STACK_SIZE;
  ASSERT(_heap_end >= _heap_start, "RAM overflow: .data + .bss + stack do not fit")
}`},{file:`startup.c`,lang:`c`,src:`/* startup.c: vector table and reset handler for a Cortex-M3, written from scratch. */
#include <stdint.h>

extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;   /* from link.ld */
int main(void);
void rt_exit(int code);

void Default_Handler(void) { for (;;) {} }       /* park here; a debugger shows where */
#define WEAK_ALIAS __attribute__((weak, alias("Default_Handler")))
void NMI_Handler(void) WEAK_ALIAS;
void HardFault_Handler(void) WEAK_ALIAS;
void MemManage_Handler(void) WEAK_ALIAS;
void BusFault_Handler(void) WEAK_ALIAS;
void UsageFault_Handler(void) WEAK_ALIAS;
void SVC_Handler(void) WEAK_ALIAS;
void PendSV_Handler(void) WEAK_ALIAS;
void SysTick_Handler(void) WEAK_ALIAS;
void Reset_Handler(void);

__attribute__((section(".vectors"), used))
static void (*const vector_table[16])(void) = {
  (void (*)(void))&_estack,   /* 0: initial SP */
  Reset_Handler,              /* 1 */
  NMI_Handler, HardFault_Handler, MemManage_Handler, BusFault_Handler, UsageFault_Handler,
  0, 0, 0, 0,                 /* 7-10 reserved */
  SVC_Handler, 0, 0,          /* 11 SVCall, 12 debug monitor, 13 reserved */
  PendSV_Handler, SysTick_Handler,
};

void Reset_Handler(void) {
#ifdef POISON
  for (uint32_t *p = &_sdata; p < &_ebss; p++) *p = 0xA5A5A5A5u;   /* emulate power-up garbage */
#endif
#ifndef SKIP_COPY
  const uint32_t *src = &_sidata;
  for (uint32_t *dst = &_sdata; dst < &_edata;) *dst++ = *src++;  /* .data: flash -> RAM */
#endif
#ifndef SKIP_ZERO
  for (uint32_t *dst = &_sbss; dst < &_ebss;) *dst++ = 0;          /* .bss = 0 */
#endif
  rt_exit(main());            /* on a real board: main(); for (;;) {} */
}`},{file:`semihost.c`,lang:`c`,src:`/* semihost.c: print and exit through the debugger (QEMU) interface. */
#include <stdint.h>
static int semihost(int op, const void *arg) {
  register int r0 __asm__("r0") = op;
  register const void *r1 __asm__("r1") = arg;
  __asm__ volatile("bkpt 0xAB" : "+r"(r0) : "r"(r1) : "memory");
  return r0;
}
void rt_puts(const char *s) { semihost(0x04, s); }
void rt_exit(int code) { semihost(0x18, (const void *)(uintptr_t)(code ? 0x20024u : 0x20026u)); for (;;) {} }`},{file:`main.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s);

uint32_t answer = 42;                       /* .data */
int16_t  coeffs[3] = {-3, 5, 7};            /* .data */
uint32_t zeros[16];                         /* .bss  */
static uint8_t seen;                        /* .bss  */

int main(void) {
  int ok = answer == 42 && coeffs[0] == -3 && coeffs[2] == 7 && seen == 0;
  for (int i = 0; i < 16; i++) ok = ok && zeros[i] == 0;
  rt_puts(ok ? "globals ok\\n" : "globals WRONG\\n");
  return ok ? 0 : 1;
}`},{file:`run.py`,lang:`python`,src:`"""Boot the startup code in QEMU, then break it on purpose and check the test catches it."""
import shutil, struct, subprocess, sys

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

def boot(*defines):
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", *[f"-D{d}" for d in defines],
                    "startup.c", "semihost.c", "main.c", "-o", "fw.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config",
                        "enable=on,target=native", "-kernel", "fw.elf"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
    return r.returncode, r.stdout.strip()

cases = {(): 0, ("POISON",): 0, ("SKIP_COPY",): 1, ("POISON", "SKIP_ZERO"): 1, ("POISON", "SKIP_COPY", "SKIP_ZERO"): 1}
for defines, expect in cases.items():
    code, out = boot(*defines)
    print(f"{' '.join(defines) or 'normal':<28} exit {code}  {out}")
    assert code == expect, (defines, code, out)

# vector table layout: SysTick handler address at offset 0x3C, reset vector odd
boot()
subprocess.run(["arm-none-eabi-objcopy", "-O", "binary", "fw.elf", "fw.bin"], check=True)
words = struct.unpack_from("<16I", open("fw.bin", "rb").read(), 0)
nm = {l.split()[2]: int(l.split()[0], 16) for l in subprocess.run(["arm-none-eabi-nm", "fw.elf"], capture_output=True, text=True).stdout.splitlines() if len(l.split()) == 3}
assert words[0] == nm["_estack"] and words[1] == nm["Reset_Handler"] | 1
assert words[15] == nm["SysTick_Handler"] | 1 == nm["Default_Handler"] | 1   # weak alias: not overridden here
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};