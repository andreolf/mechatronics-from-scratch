var e=`p10-l03`,t=40,n=`The linker script decides where every byte of your firmware lives. You derive the layout of .text, .rodata, .data, .bss, heap and stack in flash and RAM, learn why .data has two addresses, write a minimal linker script with a stack reservation and an overflow check, and test the result by reading the section table and the map against the addresses the firmware prints in QEMU.`,r=`<h2 id="two-memories-four-kinds-of-data">Two memories, four kinds of data</h2>
<p>A microcontroller has non-volatile <strong>flash</strong> (keeps its contents without power, slow to write) and volatile <strong>SRAM</strong> (fast, lost at power-off). The compiler sorts your program into sections, and each kind has one right home:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>section</th>
<th>holds</th>
<th>lives in</th>
<th>at reset</th>
</tr>
</thead>
<tbody><tr>
<td><code>.text</code></td>
<td>code, the vector table</td>
<td>flash</td>
<td>already there</td>
</tr>
<tr>
<td><code>.rodata</code></td>
<td><code>const</code> tables, string literals</td>
<td>flash</td>
<td>already there</td>
</tr>
<tr>
<td><code>.data</code></td>
<td>initialised globals (<code>int n = 7;</code>)</td>
<td>RAM, initial values in flash</td>
<td>copied flash → RAM</td>
</tr>
<tr>
<td><code>.bss</code></td>
<td>zero-initialised globals (<code>int buf[64];</code>)</td>
<td>RAM</td>
<td>zeroed</td>
</tr>
<tr>
<td>heap, stack</td>
<td><code>malloc</code>, locals, return addresses</td>
<td>RAM</td>
<td>nothing</td>
</tr>
</tbody></table></div>
<p><code>.data</code> is the interesting one. Code that uses it needs its <strong>RAM address</strong> (where it lives at run time, the <em>VMA</em>), but its initial values must survive power-off, so they are stored in flash at a <em>load address</em> (the <em>LMA</em>). The startup code (lesson 04) copies them across before <code>main</code>.</p>
<h2 id="reading-a-linker-script">Reading a linker script</h2>
<pre><code>MEMORY { FLASH (rx) : ORIGIN = 0x00000000, LENGTH = 256K
         RAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 64K }
</code></pre>
<p>declares the regions. Inside <code>SECTIONS</code>, each output section collects input sections by pattern (<code>*(.text*)</code> means “the <code>.text...</code> sections of every object”) and is placed in a region with <code>&gt; FLASH</code>. The dot (<code>.</code>) is the <strong>location counter</strong>: <code>_sdata = .;</code> defines a symbol at the current address, and <code>ALIGN(4)</code> rounds it up. <code>&gt; RAM AT &gt; FLASH</code> gives <code>.data</code> its VMA in RAM and its LMA in flash, and <code>LOADADDR(.data)</code> returns that LMA. Symbols defined in the script are visible from C as <code>extern uint32_t _sdata;</code>, where <em>the address of the symbol is the value</em> you want (<code>&amp;_sdata</code>).</p>
<p>The stack grows <strong>down</strong> from the top of RAM, so <code>_estack = ORIGIN(RAM) + LENGTH(RAM)</code>. A reserved stack size plus an <code>ASSERT</code> turns “the stack silently overwrites <code>.bss</code>” into a link-time error:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:2.0933em;vertical-align:-1.3988em;"></span><span class="minner munder"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6944em;"><span style="top:-1.6012em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">static</span></span></span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="minner munder"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.6944em;"><span class="svg-align" style="top:-2.2687em;"><span class="pstrut" style="height:3em;"></span><span class="katex-stretchy" style="height:0.548em;min-width:1.6em;"><span class="brace-left" style="height:0.548em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="0.548em" viewBox="0 0 400000 548" preserveAspectRatio="xMinYMin slice"><path d="M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13
 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688
 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7
-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z"/></svg></span><span class="brace-center" style="height:0.548em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="0.548em" viewBox="0 0 400000 548" preserveAspectRatio="xMidYMin slice"><path d="M199572 214
c100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14
 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3
 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0
-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z"/></svg></span><span class="brace-right" style="height:0.548em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="0.548em" viewBox="0 0 400000 548" preserveAspectRatio="xMaxYMin slice"><path d="M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3
 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237
-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z"/></svg></span></span></span><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord text"><span class="mord">data</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord text"><span class="mord">bss</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.7313em;"><span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.3988em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">heap</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8304em;vertical-align:-0.136em;"></span><span class="mord text"><span class="mord">stack</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≤</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord text"><span class="mord">RAM</span></span><span class="mord">.</span></span></span></span></span></div>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="memmap" data-args="{}"></div></div><figcaption>Flash and RAM as bars. Grow .data, .bss and the stack reservation; .data appears twice, as its initial values in flash and as the live copy in RAM. Past the limit the linker ASSERT fires.</figcaption></figure>
<h2 id="the-map-file">The map file</h2>
<p><code>-Wl,-Map=fw.map</code> writes a report of every input section, its object file, address and size. When firmware outgrows its flash, the map tells you which object and which function is to blame. <code>arm-none-eabi-objdump -h</code> prints the output sections with both VMA and LMA, and <code>nm -n</code> lists the symbols in address order.</p>
<h2 id="worked-example">Worked example</h2>
<p>256 KiB flash at 0x0, 64 KiB RAM at 0x2000_0000, 4 KiB stack. A build has <code>.text</code> = 0x1F0 bytes (including <code>.rodata</code>), <code>.data</code> = 8 bytes, <code>.bss</code> = 1024 bytes.</p>
<ol>
<li><code>.text</code> at 0x0000_0000, ending at 0x1F0.</li>
<li><code>.data</code> VMA 0x2000_0000; its LMA is right after <code>.text</code>, at 0x1F0.</li>
<li><code>.bss</code> starts at 0x2000_0008 and ends at 0x2000_0408.</li>
<li><code>_estack</code> = 0x2001_0000, so the stack reserve starts at 0x2000_F000 and the heap gets 0x2000_F000 − 0x2000_0408 = 60 408 bytes.</li>
<li>A 62 KiB buffer makes static RAM ≈ 63.5 KiB, which plus 4 KiB of stack exceeds 64 KiB: the ASSERT fails the link.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p><code>main.c</code> puts a variable in each section and prints their addresses. <code>run.py</code> builds with a map file, reads the section table and symbols, compares them with what the firmware printed in QEMU, and finally shows that an oversized buffer fails the link.</p>

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

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">main.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span>;
<span class="hljs-keyword">extern</span> <span class="hljs-type">uint32_t</span> _heap_end, _estack;

<span class="hljs-meta">#<span class="hljs-keyword">ifndef</span> BUF_SIZE</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> BUF_SIZE 1024</span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>
<span class="hljs-type">const</span> <span class="hljs-type">uint32_t</span> lut[<span class="hljs-number">4</span>] = {<span class="hljs-number">0x11</span>, <span class="hljs-number">0x22</span>, <span class="hljs-number">0x33</span>, <span class="hljs-number">0x44</span>};   <span class="hljs-comment">/* .rodata */</span>
<span class="hljs-type">uint32_t</span> counter = <span class="hljs-number">7</span>;                                <span class="hljs-comment">/* .data   */</span>
<span class="hljs-type">uint32_t</span> flags = <span class="hljs-number">0xA5</span>;                               <span class="hljs-comment">/* .data   */</span>
<span class="hljs-type">uint8_t</span> buffer[BUF_SIZE];                            <span class="hljs-comment">/* .bss    */</span>

<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">show</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *name, <span class="hljs-type">const</span> <span class="hljs-keyword">volatile</span> <span class="hljs-type">void</span> *p)</span> {
  rt_puts(name); rt_puts(<span class="hljs-string">&quot; &quot;</span>); rt_putu((<span class="hljs-type">uint32_t</span>)(<span class="hljs-type">uintptr_t</span>)p); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
}
<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">uint32_t</span> sp; __asm__ <span class="hljs-title function_">volatile</span><span class="hljs-params">(<span class="hljs-string">&quot;mov %0, sp&quot;</span> : <span class="hljs-string">&quot;=r&quot;</span>(sp))</span>;
  show(<span class="hljs-string">&quot;lut&quot;</span>, lut); show(<span class="hljs-string">&quot;counter&quot;</span>, &amp;counter); show(<span class="hljs-string">&quot;buffer&quot;</span>, buffer);
  rt_puts(<span class="hljs-string">&quot;sp &quot;</span>); rt_putu(sp); rt_puts(<span class="hljs-string">&quot;\\n&quot;</span>);
  buffer[BUF_SIZE - <span class="hljs-number">1</span>] = (<span class="hljs-type">uint8_t</span>)lut[<span class="hljs-number">1</span>];
  <span class="hljs-type">int</span> ok = counter == <span class="hljs-number">7</span> &amp;&amp; flags == <span class="hljs-number">0xA5</span> &amp;&amp; buffer[<span class="hljs-number">0</span>] == <span class="hljs-number">0</span> &amp;&amp; buffer[BUF_SIZE - <span class="hljs-number">1</span>] == <span class="hljs-number">0x22</span>
           &amp;&amp; sp &gt; (<span class="hljs-type">uint32_t</span>)(<span class="hljs-type">uintptr_t</span>)&amp;_heap_end &amp;&amp; sp &lt;= (<span class="hljs-type">uint32_t</span>)(<span class="hljs-type">uintptr_t</span>)&amp;_estack;
  rt_puts(ok ? <span class="hljs-string">&quot;PASS\\n&quot;</span> : <span class="hljs-string">&quot;FAIL\\n&quot;</span>);
  <span class="hljs-keyword">return</span> ok ? <span class="hljs-number">0</span> : <span class="hljs-number">1</span>;
}</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Build with a map file, check section addresses, compare with QEMU, and test the overflow ASSERT.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> re, shutil, subprocess, sys

<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)&quot;</span>)
CC = [<span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;-mcpu=cortex-m3&quot;</span>, <span class="hljs-string">&quot;-mthumb&quot;</span>, <span class="hljs-string">&quot;-O1&quot;</span>, <span class="hljs-string">&quot;-Wall&quot;</span>, <span class="hljs-string">&quot;-Werror&quot;</span>, <span class="hljs-string">&quot;-ffreestanding&quot;</span>, <span class="hljs-string">&quot;-nostdlib&quot;</span>, <span class="hljs-string">&quot;-T&quot;</span>, <span class="hljs-string">&quot;link.ld&quot;</span>]

subprocess.run([*CC, <span class="hljs-string">&quot;-Wl,-Map=fw.map&quot;</span>, <span class="hljs-string">&quot;rt.c&quot;</span>, <span class="hljs-string">&quot;main.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], check=<span class="hljs-literal">True</span>)

<span class="hljs-comment"># output sections: name -&gt; (size, VMA, LMA)</span>
sec = {}
<span class="hljs-keyword">for</span> line <span class="hljs-keyword">in</span> subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-objdump&quot;</span>, <span class="hljs-string">&quot;-h&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>).stdout.splitlines():
    f = line.split()
    <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(f) &gt;= <span class="hljs-number">6</span> <span class="hljs-keyword">and</span> f[<span class="hljs-number">0</span>].isdigit():
        sec[f[<span class="hljs-number">1</span>]] = (<span class="hljs-built_in">int</span>(f[<span class="hljs-number">2</span>], <span class="hljs-number">16</span>), <span class="hljs-built_in">int</span>(f[<span class="hljs-number">3</span>], <span class="hljs-number">16</span>), <span class="hljs-built_in">int</span>(f[<span class="hljs-number">4</span>], <span class="hljs-number">16</span>))
sym = {}
<span class="hljs-keyword">for</span> line <span class="hljs-keyword">in</span> subprocess.run([<span class="hljs-string">&quot;arm-none-eabi-nm&quot;</span>, <span class="hljs-string">&quot;-n&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>).stdout.splitlines():
    a, t, name = line.split()
    sym[name] = <span class="hljs-built_in">int</span>(a, <span class="hljs-number">16</span>)

text, data, bss = sec[<span class="hljs-string">&quot;.text&quot;</span>], sec[<span class="hljs-string">&quot;.data&quot;</span>], sec[<span class="hljs-string">&quot;.bss&quot;</span>]
<span class="hljs-built_in">print</span>({k: (<span class="hljs-built_in">hex</span>(v[<span class="hljs-number">0</span>]), <span class="hljs-built_in">hex</span>(v[<span class="hljs-number">1</span>]), <span class="hljs-built_in">hex</span>(v[<span class="hljs-number">2</span>])) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> sec.items() <span class="hljs-keyword">if</span> k <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;.text&quot;</span>, <span class="hljs-string">&quot;.data&quot;</span>, <span class="hljs-string">&quot;.bss&quot;</span>)})
<span class="hljs-keyword">assert</span> text[<span class="hljs-number">1</span>] == <span class="hljs-number">0x0</span>                                    <span class="hljs-comment"># code at the start of flash</span>
<span class="hljs-keyword">assert</span> data[<span class="hljs-number">1</span>] == <span class="hljs-number">0x20000000</span>                             <span class="hljs-comment"># .data runs from RAM ...</span>
<span class="hljs-keyword">assert</span> data[<span class="hljs-number">2</span>] == text[<span class="hljs-number">1</span>] + text[<span class="hljs-number">0</span>]                      <span class="hljs-comment"># ... and is loaded from flash right after .text</span>
<span class="hljs-keyword">assert</span> bss[<span class="hljs-number">1</span>] == data[<span class="hljs-number">1</span>] + data[<span class="hljs-number">0</span>]                       <span class="hljs-comment"># .bss follows .data</span>
<span class="hljs-keyword">assert</span> sym[<span class="hljs-string">&quot;_sidata&quot;</span>] == data[<span class="hljs-number">2</span>] <span class="hljs-keyword">and</span> sym[<span class="hljs-string">&quot;_sdata&quot;</span>] == data[<span class="hljs-number">1</span>] <span class="hljs-keyword">and</span> sym[<span class="hljs-string">&quot;_ebss&quot;</span>] == bss[<span class="hljs-number">1</span>] + bss[<span class="hljs-number">0</span>]
<span class="hljs-keyword">assert</span> sym[<span class="hljs-string">&quot;_estack&quot;</span>] == <span class="hljs-number">0x20010000</span> <span class="hljs-keyword">and</span> sym[<span class="hljs-string">&quot;_heap_end&quot;</span>] == <span class="hljs-number">0x20010000</span> - <span class="hljs-number">4096</span>
<span class="hljs-keyword">assert</span> sym[<span class="hljs-string">&quot;lut&quot;</span>] &lt; text[<span class="hljs-number">1</span>] + text[<span class="hljs-number">0</span>]                    <span class="hljs-comment"># const data is in flash</span>
<span class="hljs-keyword">assert</span> data[<span class="hljs-number">1</span>] &lt;= sym[<span class="hljs-string">&quot;counter&quot;</span>] &lt; data[<span class="hljs-number">1</span>] + data[<span class="hljs-number">0</span>]
<span class="hljs-keyword">assert</span> bss[<span class="hljs-number">1</span>] &lt;= sym[<span class="hljs-string">&quot;buffer&quot;</span>] &lt; bss[<span class="hljs-number">1</span>] + bss[<span class="hljs-number">0</span>]
mapfile = <span class="hljs-built_in">open</span>(<span class="hljs-string">&quot;fw.map&quot;</span>).read()
<span class="hljs-keyword">assert</span> re.search(<span class="hljs-string">r&quot;^\\.data\\s+0x0*20000000\\s+0x[0-9a-f]+\\s+load address 0x0*%x&quot;</span> % data[<span class="hljs-number">2</span>], mapfile, re.M)

run = subprocess.run([<span class="hljs-string">&quot;qemu-system-arm&quot;</span>, <span class="hljs-string">&quot;-M&quot;</span>, <span class="hljs-string">&quot;mps2-an385&quot;</span>, <span class="hljs-string">&quot;-nographic&quot;</span>, <span class="hljs-string">&quot;-semihosting-config&quot;</span>, <span class="hljs-string">&quot;enable=on,target=native&quot;</span>,
                      <span class="hljs-string">&quot;-kernel&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">30</span>)
seen = {k: <span class="hljs-built_in">int</span>(v) <span class="hljs-keyword">for</span> k, v <span class="hljs-keyword">in</span> re.findall(<span class="hljs-string">r&quot;^(\\w+) (\\d+)$&quot;</span>, run.stdout, re.M)}
<span class="hljs-keyword">assert</span> run.returncode == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;PASS&quot;</span> <span class="hljs-keyword">in</span> run.stdout, run.stdout
<span class="hljs-keyword">for</span> name <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;lut&quot;</span>, <span class="hljs-string">&quot;counter&quot;</span>, <span class="hljs-string">&quot;buffer&quot;</span>):
    <span class="hljs-keyword">assert</span> seen[name] == sym[name], name                 <span class="hljs-comment"># the firmware agrees with the linker</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;addresses at run time match the symbol table; sp =&quot;</span>, <span class="hljs-built_in">hex</span>(seen[<span class="hljs-string">&quot;sp&quot;</span>]))

big = subprocess.run([*CC, <span class="hljs-string">&quot;-DBUF_SIZE=63488&quot;</span>, <span class="hljs-string">&quot;rt.c&quot;</span>, <span class="hljs-string">&quot;main.c&quot;</span>, <span class="hljs-string">&quot;-o&quot;</span>, <span class="hljs-string">&quot;big.elf&quot;</span>], capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>)
<span class="hljs-keyword">assert</span> big.returncode != <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;RAM overflow&quot;</span> <span class="hljs-keyword">in</span> big.stderr  <span class="hljs-comment"># 62 KiB buffer + 4 KiB stack does not fit</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;oversized build rejected:&quot;</span>, big.stderr.strip().splitlines()[-<span class="hljs-number">2</span>][-<span class="hljs-number">60</span>:])
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>You declare <code>const uint8_t font[4096] = {...};</code> but <code>size</code> shows <code>.data</code> grew by 4 KiB instead of <code>.text</code>. What happened, and why does it matter?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The table ended up in <code>.data</code>, usually because it isn’t really <code>const</code> (for example <code>const uint8_t *font[]</code>, where the pointers are writable, or the <code>const</code> was dropped). It now costs 4 KiB of flash <em>and</em> 4 KiB of RAM, plus copy time at boot. Keep lookup tables <code>static const</code> so they stay in <code>.rodata</code>.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the stack go at the top of RAM and grow down, with the heap above <code>.bss</code> growing up?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The two dynamic regions grow toward each other from opposite ends of the free space, so either can use all of it as long as their sum fits. A fixed stack reservation and the ASSERT turn the worst case into a build error, and a stack guard (an MPU region or a watermark pattern) catches it at run time.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l03"></div>

`,i=[{id:`two-memories-four-kinds-of-data`,title:`Two memories, four kinds of data`},{id:`reading-a-linker-script`,title:`Reading a linker script`},{id:`the-map-file`,title:`The map file`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l03-q1`,type:`num`,q:`<p>.text is 0x1F0 bytes at 0x0. What is the LMA of .data (decimal)?</p>
`,explain:`<p>Right after .text.</p>
`,answer:496,tol:.001,unit:``},{id:`p10-l03-q2`,type:`num`,q:`<p>.data is 8 bytes at 0x20000000 and .bss is 1024 bytes. Where does .bss end (decimal)?</p>
`,explain:`<p>0x20000408.</p>
`,answer:536871944,tol:1e-7,unit:``},{id:`p10-l03-q3`,type:`num`,q:`<p>With 64 KiB RAM, 4 KiB stack and .bss ending at 0x20000408, how many bytes of heap remain?</p>
`,explain:`<p>From _ebss to the stack reservation.</p>
`,answer:60408,tol:.001,unit:`bytes`},{id:`p10-l03-q4`,type:`num`,q:`<p>How much flash does .data with 200 bytes of initial values use?</p>
`,explain:`<p>Its initial values are stored in flash (and it uses 200 bytes of RAM too).</p>
`,answer:200,tol:.001,unit:`bytes`},{id:`p10-l03-q5`,type:`mc`,q:`<p>What does ‘&gt; RAM AT &gt; FLASH’ mean for .data?</p>
`,explain:`<p>Two addresses, one copy at startup.</p>
`,options:[`it is copied from RAM to flash at reset`,`it runs from RAM (VMA) but is stored in flash (LMA)`,`it is placed twice by the compiler`,`it is read-only`],answer:1},{id:`p10-l03-q6`,type:`mc`,q:`<p>In C, how do you get the value of the linker symbol _estack?</p>
`,explain:`<p>Linker symbols are addresses, not variables with storage.</p>
`,options:[`_estack`,`&amp;_estack, the address of the symbol`,`*_estack`,`sizeof(_estack)`],answer:1}],o=[{file:`link.ld`,lang:`ld`,src:`/* Minimal linker script for a Cortex-M3 (QEMU mps2-an385 memory map). */
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
};`},{file:`main.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);
extern uint32_t _heap_end, _estack;

#ifndef BUF_SIZE
#define BUF_SIZE 1024
#endif
const uint32_t lut[4] = {0x11, 0x22, 0x33, 0x44};   /* .rodata */
uint32_t counter = 7;                                /* .data   */
uint32_t flags = 0xA5;                               /* .data   */
uint8_t buffer[BUF_SIZE];                            /* .bss    */

static void show(const char *name, const volatile void *p) {
  rt_puts(name); rt_puts(" "); rt_putu((uint32_t)(uintptr_t)p); rt_puts("\\n");
}
int main(void) {
  uint32_t sp; __asm__ volatile("mov %0, sp" : "=r"(sp));
  show("lut", lut); show("counter", &counter); show("buffer", buffer);
  rt_puts("sp "); rt_putu(sp); rt_puts("\\n");
  buffer[BUF_SIZE - 1] = (uint8_t)lut[1];
  int ok = counter == 7 && flags == 0xA5 && buffer[0] == 0 && buffer[BUF_SIZE - 1] == 0x22
           && sp > (uint32_t)(uintptr_t)&_heap_end && sp <= (uint32_t)(uintptr_t)&_estack;
  rt_puts(ok ? "PASS\\n" : "FAIL\\n");
  return ok ? 0 : 1;
}`},{file:`run.py`,lang:`python`,src:`"""Build with a map file, check section addresses, compare with QEMU, and test the overflow ASSERT."""
import re, shutil, subprocess, sys

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")
CC = ["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding", "-nostdlib", "-T", "link.ld"]

subprocess.run([*CC, "-Wl,-Map=fw.map", "rt.c", "main.c", "-o", "fw.elf"], check=True)

# output sections: name -> (size, VMA, LMA)
sec = {}
for line in subprocess.run(["arm-none-eabi-objdump", "-h", "fw.elf"], capture_output=True, text=True).stdout.splitlines():
    f = line.split()
    if len(f) >= 6 and f[0].isdigit():
        sec[f[1]] = (int(f[2], 16), int(f[3], 16), int(f[4], 16))
sym = {}
for line in subprocess.run(["arm-none-eabi-nm", "-n", "fw.elf"], capture_output=True, text=True).stdout.splitlines():
    a, t, name = line.split()
    sym[name] = int(a, 16)

text, data, bss = sec[".text"], sec[".data"], sec[".bss"]
print({k: (hex(v[0]), hex(v[1]), hex(v[2])) for k, v in sec.items() if k in (".text", ".data", ".bss")})
assert text[1] == 0x0                                    # code at the start of flash
assert data[1] == 0x20000000                             # .data runs from RAM ...
assert data[2] == text[1] + text[0]                      # ... and is loaded from flash right after .text
assert bss[1] == data[1] + data[0]                       # .bss follows .data
assert sym["_sidata"] == data[2] and sym["_sdata"] == data[1] and sym["_ebss"] == bss[1] + bss[0]
assert sym["_estack"] == 0x20010000 and sym["_heap_end"] == 0x20010000 - 4096
assert sym["lut"] < text[1] + text[0]                    # const data is in flash
assert data[1] <= sym["counter"] < data[1] + data[0]
assert bss[1] <= sym["buffer"] < bss[1] + bss[0]
mapfile = open("fw.map").read()
assert re.search(r"^\\.data\\s+0x0*20000000\\s+0x[0-9a-f]+\\s+load address 0x0*%x" % data[2], mapfile, re.M)

run = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config", "enable=on,target=native",
                      "-kernel", "fw.elf"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
seen = {k: int(v) for k, v in re.findall(r"^(\\w+) (\\d+)$", run.stdout, re.M)}
assert run.returncode == 0 and "PASS" in run.stdout, run.stdout
for name in ("lut", "counter", "buffer"):
    assert seen[name] == sym[name], name                 # the firmware agrees with the linker
print("addresses at run time match the symbol table; sp =", hex(seen["sp"]))

big = subprocess.run([*CC, "-DBUF_SIZE=63488", "rt.c", "main.c", "-o", "big.elf"], capture_output=True, text=True)
assert big.returncode != 0 and "RAM overflow" in big.stderr  # 62 KiB buffer + 4 KiB stack does not fit
print("oversized build rejected:", big.stderr.strip().splitlines()[-2][-60:])
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};