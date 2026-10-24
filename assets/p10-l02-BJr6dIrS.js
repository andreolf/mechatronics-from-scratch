var e=`p10-l02`,t=40,n=`An IDE’s build button hides four steps, which are compile, assemble, link and convert. You learn what an object file holds, how the linker resolves symbols and places sections, and why an ELF becomes a raw binary for flashing, then write a Makefile for arm-none-eabi-gcc that builds firmware which boots in QEMU and has the vector table exactly where the core expects it.`,r=`<h2 id="from-c-to-flash">From .c to flash</h2>
<p>A firmware build is a pipeline, and each step has a tool you can run by hand:</p>
<ol>
<li><strong>Preprocess and compile</strong> (<code>arm-none-eabi-gcc -c</code>): each <code>.c</code> file becomes an <strong>object file</strong> (<code>.o</code>) of machine code for the target, organised into <strong>sections</strong>: <code>.text</code> (code), <code>.rodata</code> (constants), <code>.data</code> (initialised variables) and <code>.bss</code> (zero-initialised variables). Addresses inside it are not final yet.</li>
<li><strong>Link</strong> (<code>arm-none-eabi-ld</code>, usually invoked through gcc): combine all objects, resolve every <strong>symbol</strong> (a call to <code>rt_puts</code> in <code>main.o</code> is an <em>undefined</em> symbol until <code>rt.o</code> supplies it), place each section at an address given by the <strong>linker script</strong>, and write an <strong>ELF</strong> file.</li>
<li><strong>Convert</strong> (<code>arm-none-eabi-objcopy -O binary</code>): strip the ELF down to the raw bytes that go into flash, starting at flash address 0.</li>
<li><strong>Flash</strong> (OpenOCD, st-flash, or a vendor tool over SWD): write those bytes into the chip.</li>
</ol>
<p>The ELF keeps symbols, section headers and debug information, which is what GDB needs. The <code>.bin</code> is only the bytes, which is what the chip needs. A <code>.hex</code> file is the same bytes as text with addresses, which some programmers prefer.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="buildpipe" data-args="{}"></div></div><figcaption>The build pipeline. Step through it: two object files with undefined symbols, the linker placing sections, and objcopy cutting out the flash image. Toggle --gc-sections to see unused functions disappear.</figcaption></figure>
<h2 id="symbols-and-sections">Symbols and sections</h2>
<p><code>arm-none-eabi-nm</code> lists symbols with a type letter: <strong>T</strong> for code in <code>.text</code>, <strong>D</strong> for initialised data, <strong>B</strong> for <code>.bss</code>, <strong>R</strong> for read-only data, and <strong>U</strong> for undefined (needed from somewhere else). If a U symbol has no definition in any object at link time, you get the classic <code>undefined reference to ...</code> error. If two objects both define it, you get <code>multiple definition</code>.</p>
<p>Two flags shrink firmware: <code>-ffunction-sections -fdata-sections</code> put each function and variable in its own section, and <code>-Wl,--gc-sections</code> lets the linker drop every section that nothing references. The vector table must be marked <code>KEEP</code> in the linker script, because nothing <em>calls</em> it: the hardware reads it.</p>
<h2 id="why-the-binary-starts-with-the-stack-pointer">Why the binary starts with the stack pointer</h2>
<p>A Cortex-M core boots by reading two words from address 0: the initial <strong>stack pointer</strong> and the <strong>reset vector</strong> (the address of <code>Reset_Handler</code>). Thumb code addresses have bit 0 set to mark Thumb state, so the reset vector is odd. Your build is correct only if the first 8 bytes of the <code>.bin</code> are exactly those two values. That is a cheap, strong test, and it’s the first thing to check when a board doesn’t boot.</p>
<h2 id="the-size-of-a-flash-image">The size of a flash image</h2>
<p><code>arm-none-eabi-size</code> prints <code>text</code>, <code>data</code> and <code>bss</code>. Flash holds <code>text + data</code> (the initial values of <code>.data</code> are stored in flash and copied to RAM at startup). RAM holds <code>data + bss</code> plus the stack. So</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord text"><span class="mord">flash\xA0used</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6984em;vertical-align:-0.0833em;"></span><span class="mord text"><span class="mord">text</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord text"><span class="mord">data</span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord text"><span class="mord">static\xA0RAM\xA0used</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord text"><span class="mord">data</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord text"><span class="mord">bss</span></span><span class="mord">.</span></span></span></span></span></div>
<h2 id="worked-example">Worked example</h2>
<p><code>size</code> reports text = 412, data = 16, bss = 8 for a build.</p>
<ol>
<li>The <code>.bin</code> is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">412</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">16</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">428</span></span></span></span> bytes.</li>
<li>Static RAM is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">16</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">8</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">24</span></span></span></span> bytes, plus the stack.</li>
<li>The first word is the stack top, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">2000</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0000</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">64</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">KiB</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">2001</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0000</span></span></span></span>.</li>
<li>If <code>Reset_Handler</code> is at 0x40 in flash, the second word is 0x41 (Thumb bit set).</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p>The same <code>link.ld</code> and <code>rt.c</code> as lesson 01, a <code>main.c</code>, the <code>Makefile</code>, and <code>run.py</code>, which runs <code>make</code>, inspects the outputs with the binutils, and boots the image in QEMU. The <code>flash</code> target shows the OpenOCD command for an STM32F4 board with an ST-LINK; it isn’t run here.</p>

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

<div class="code-card" data-code="2"><div class="code-head"><span class="fname" translate="no">main.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="2">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="2">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-type">void</span> <span class="hljs-title function_">rt_puts</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">char</span> *s)</span>; <span class="hljs-type">void</span> <span class="hljs-title function_">rt_putu</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> v)</span>;

<span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">char</span> greeting[] = <span class="hljs-string">&quot;hello from flash\\n&quot;</span>;        <span class="hljs-comment">/* .rodata: stays in flash */</span>
<span class="hljs-type">uint32_t</span> table[<span class="hljs-number">4</span>] = {<span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">4</span>, <span class="hljs-number">1</span>};                           <span class="hljs-comment">/* .data: initial values in flash, copied to RAM */</span>
<span class="hljs-type">uint32_t</span> scratch[<span class="hljs-number">2</span>];                                        <span class="hljs-comment">/* .bss: zeroed at startup */</span>

<span class="hljs-type">uint32_t</span> <span class="hljs-title function_">unused_helper</span><span class="hljs-params">(<span class="hljs-type">uint32_t</span> x)</span> { <span class="hljs-keyword">return</span> x * <span class="hljs-number">2654435761u</span>; }   <span class="hljs-comment">/* nothing calls this: --gc-sections drops it */</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  rt_puts(greeting);
  <span class="hljs-type">uint32_t</span> sum = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i++) sum += table[i];
  scratch[<span class="hljs-number">0</span>] = sum;
  rt_puts(sum == <span class="hljs-number">9</span> &amp;&amp; scratch[<span class="hljs-number">1</span>] == <span class="hljs-number">0</span> ? <span class="hljs-string">&quot;PASS\\n&quot;</span> : <span class="hljs-string">&quot;FAIL\\n&quot;</span>);
  <span class="hljs-keyword">return</span> sum == <span class="hljs-number">9</span> ? <span class="hljs-number">0</span> : <span class="hljs-number">1</span>;
}</code></pre></div>

<div class="code-card" data-code="3"><div class="code-head"><span class="fname" translate="no">Makefile</span><button class="btn btn-quiet btn-small" type="button" data-copy="3">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="3">Download</button></div><pre tabindex="0"><code class="language-makefile"><span class="hljs-comment"># Makefile: build Cortex-M3 firmware with no IDE. Recipe lines start with a TAB.</span>
CC      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE    = arm-none-eabi-size
CFLAGS  = -mcpu=cortex-m3 -mthumb -O2 -g -Wall -Werror -ffreestanding -ffunction-sections -fdata-sections
LDFLAGS = -nostdlib -T link.ld -Wl,--gc-sections -Wl,-Map=fw.map
OBJS    = rt.o main.o
QEMU    = qemu-system-arm -M mps2-an385 -nographic -semihosting-config enable=on,target=native

<span class="hljs-section">all: fw.bin</span>

<span class="hljs-section">%.o: %.c</span>
	<span class="hljs-variable">$(CC)</span> <span class="hljs-variable">$(CFLAGS)</span> -c <span class="hljs-variable">$&lt;</span> -o <span class="hljs-variable">$@</span>

<span class="hljs-section">fw.elf: <span class="hljs-variable">$(OBJS)</span> link.ld</span>
	<span class="hljs-variable">$(CC)</span> <span class="hljs-variable">$(CFLAGS)</span> <span class="hljs-variable">$(LDFLAGS)</span> <span class="hljs-variable">$(OBJS)</span> -o <span class="hljs-variable">$@</span>
	<span class="hljs-variable">$(SIZE)</span> <span class="hljs-variable">$@</span>

<span class="hljs-section">fw.bin: fw.elf</span>
	<span class="hljs-variable">$(OBJCOPY)</span> -O binary <span class="hljs-variable">$&lt;</span> <span class="hljs-variable">$@</span>

<span class="hljs-section">run: fw.elf</span>
	<span class="hljs-variable">$(QEMU)</span> -kernel fw.elf

<span class="hljs-section">flash: fw.elf</span>
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg -c <span class="hljs-string">&quot;program fw.elf verify reset exit&quot;</span>

<span class="hljs-section">clean:</span>
	rm -f *.o fw.elf fw.bin fw.map

<span class="hljs-meta"><span class="hljs-keyword">.PHONY</span>: all run flash clean</span></code></pre></div>

<div class="code-card" data-code="4"><div class="code-head"><span class="fname" translate="no">run.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="4">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="4">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-string">&quot;&quot;&quot;Build with make, check the ELF and BIN with binutils, boot in QEMU.&quot;&quot;&quot;</span>
<span class="hljs-keyword">import</span> re, shutil, struct, subprocess, sys

<span class="hljs-keyword">for</span> tool <span class="hljs-keyword">in</span> (<span class="hljs-string">&quot;make&quot;</span>, <span class="hljs-string">&quot;arm-none-eabi-gcc&quot;</span>, <span class="hljs-string">&quot;qemu-system-arm&quot;</span>):
    <span class="hljs-keyword">if</span> <span class="hljs-keyword">not</span> shutil.which(tool):
        sys.exit(<span class="hljs-string">f&quot;needs <span class="hljs-subst">{tool}</span> (Debian/Ubuntu: apt install make gcc-arm-none-eabi qemu-system-arm)&quot;</span>)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">sh</span>(<span class="hljs-params">*cmd</span>):
    <span class="hljs-keyword">return</span> subprocess.run(cmd, check=<span class="hljs-literal">True</span>, capture_output=<span class="hljs-literal">True</span>, text=<span class="hljs-literal">True</span>).stdout

sh(<span class="hljs-string">&quot;make&quot;</span>, <span class="hljs-string">&quot;clean&quot;</span>); <span class="hljs-built_in">print</span>(sh(<span class="hljs-string">&quot;make&quot;</span>, <span class="hljs-string">&quot;all&quot;</span>))

<span class="hljs-keyword">def</span> <span class="hljs-title function_">symbols</span>(<span class="hljs-params">path</span>):
    table = {}
    <span class="hljs-keyword">for</span> line <span class="hljs-keyword">in</span> sh(<span class="hljs-string">&quot;arm-none-eabi-nm&quot;</span>, path).splitlines():
        parts = line.split()
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">len</span>(parts) == <span class="hljs-number">3</span>: table[parts[<span class="hljs-number">2</span>]] = (<span class="hljs-built_in">int</span>(parts[<span class="hljs-number">0</span>], <span class="hljs-number">16</span>), parts[<span class="hljs-number">1</span>])
        <span class="hljs-keyword">elif</span> <span class="hljs-built_in">len</span>(parts) == <span class="hljs-number">2</span>: table[parts[<span class="hljs-number">1</span>]] = (<span class="hljs-literal">None</span>, parts[<span class="hljs-number">0</span>])
    <span class="hljs-keyword">return</span> table

obj, elf = symbols(<span class="hljs-string">&quot;main.o&quot;</span>), symbols(<span class="hljs-string">&quot;fw.elf&quot;</span>)
<span class="hljs-keyword">assert</span> obj[<span class="hljs-string">&quot;rt_puts&quot;</span>][<span class="hljs-number">1</span>] == <span class="hljs-string">&quot;U&quot;</span>                      <span class="hljs-comment"># undefined in main.o ...</span>
<span class="hljs-keyword">assert</span> elf[<span class="hljs-string">&quot;rt_puts&quot;</span>][<span class="hljs-number">1</span>] == <span class="hljs-string">&quot;T&quot;</span>                      <span class="hljs-comment"># ... resolved by the linker</span>
<span class="hljs-keyword">assert</span> <span class="hljs-string">&quot;unused_helper&quot;</span> <span class="hljs-keyword">in</span> obj <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;unused_helper&quot;</span> <span class="hljs-keyword">not</span> <span class="hljs-keyword">in</span> elf   <span class="hljs-comment"># removed by --gc-sections</span>
<span class="hljs-keyword">assert</span> elf[<span class="hljs-string">&quot;table&quot;</span>][<span class="hljs-number">1</span>] == <span class="hljs-string">&quot;D&quot;</span> <span class="hljs-keyword">and</span> elf[<span class="hljs-string">&quot;scratch&quot;</span>][<span class="hljs-number">1</span>] == <span class="hljs-string">&quot;B&quot;</span>

text, data, bss = <span class="hljs-built_in">map</span>(<span class="hljs-built_in">int</span>, sh(<span class="hljs-string">&quot;arm-none-eabi-size&quot;</span>, <span class="hljs-string">&quot;fw.elf&quot;</span>).splitlines()[<span class="hljs-number">1</span>].split()[:<span class="hljs-number">3</span>])
image = <span class="hljs-built_in">open</span>(<span class="hljs-string">&quot;fw.bin&quot;</span>, <span class="hljs-string">&quot;rb&quot;</span>).read()
<span class="hljs-keyword">assert</span> <span class="hljs-built_in">len</span>(image) == text + data, (<span class="hljs-built_in">len</span>(image), text, data)     <span class="hljs-comment"># flash image = text + data</span>

sp, reset = struct.unpack_from(<span class="hljs-string">&quot;&lt;II&quot;</span>, image, <span class="hljs-number">0</span>)
<span class="hljs-keyword">assert</span> sp == elf[<span class="hljs-string">&quot;_estack&quot;</span>][<span class="hljs-number">0</span>] == <span class="hljs-number">0x20010000</span>                     <span class="hljs-comment"># word 0: initial stack pointer</span>
<span class="hljs-keyword">assert</span> reset == elf[<span class="hljs-string">&quot;Reset_Handler&quot;</span>][<span class="hljs-number">0</span>] | <span class="hljs-number">1</span>                      <span class="hljs-comment"># word 1: reset vector, Thumb bit set</span>
<span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;text <span class="hljs-subst">{text}</span> data <span class="hljs-subst">{data}</span> bss <span class="hljs-subst">{bss}</span>; bin <span class="hljs-subst">{<span class="hljs-built_in">len</span>(image)}</span> bytes; SP 0x<span class="hljs-subst">{sp:08x}</span>; reset 0x<span class="hljs-subst">{reset:08x}</span>&quot;</span>)

boot = subprocess.run([<span class="hljs-string">&quot;make&quot;</span>, <span class="hljs-string">&quot;-s&quot;</span>, <span class="hljs-string">&quot;run&quot;</span>], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=<span class="hljs-literal">True</span>, timeout=<span class="hljs-number">30</span>)
<span class="hljs-built_in">print</span>(boot.stdout.strip())
<span class="hljs-keyword">assert</span> boot.returncode == <span class="hljs-number">0</span> <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;hello from flash&quot;</span> <span class="hljs-keyword">in</span> boot.stdout <span class="hljs-keyword">and</span> <span class="hljs-string">&quot;PASS&quot;</span> <span class="hljs-keyword">in</span> boot.stdout
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Delete <code>rt.o</code> from <code>OBJS</code> and run make. What error do you get, and which tool prints it?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The linker (through gcc) reports <code>undefined reference to 'rt_puts'</code> (and to <code>Reset_Handler</code> as the entry). The compiler was happy because a declaration is enough to compile a call; only the linker needs the definition.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Your board doesn’t boot. <code>xxd -l 8 fw.bin</code> shows <code>00 00 00 00 00 00 00 00</code>. What’s the likely cause?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The vector table isn’t at the start of the image: either the <code>.vectors</code> section isn’t placed first in <code>.text</code>, or it was removed by <code>--gc-sections</code> because it isn’t marked <code>KEEP</code>. The core then loads SP = 0 and jumps to address 0, which faults immediately.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l02"></div>

`,i=[{id:`from-c-to-flash`,title:`From .c to flash`},{id:`symbols-and-sections`,title:`Symbols and sections`},{id:`why-the-binary-starts-with-the-stack-pointer`,title:`Why the binary starts with the stack pointer`},{id:`the-size-of-a-flash-image`,title:`The size of a flash image`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l02-q1`,type:`num`,q:`<p>size reports text 1200, data 64, bss 256. How many bytes does the flash image take?</p>
`,explain:`<p>text + data.</p>
`,answer:1264,tol:.001,unit:`bytes`},{id:`p10-l02-q2`,type:`num`,q:`<p>Static RAM for that build (data + bss), in bytes?</p>
`,explain:`<p>Initialised and zeroed variables both live in RAM.</p>
`,answer:320,tol:.001,unit:`bytes`},{id:`p10-l02-q3`,type:`num`,q:`<p>Reset_Handler is at 0x100. What value is stored in the reset vector (decimal)?</p>
`,explain:`<p>Thumb bit set.</p>
`,answer:257,tol:.001,unit:``},{id:`p10-l02-q4`,type:`num`,q:`<p>Initial SP for 128 KiB of RAM starting at 0x20000000, in decimal?</p>
`,explain:`<p>0x20020000.</p>
`,answer:537001984,tol:1e-7,unit:``},{id:`p10-l02-q5`,type:`mc`,q:`<p>In nm output, what does U mean?</p>
`,explain:`<p>The linker must find a definition.</p>
`,options:[`user code`,`uninitialised data`,`unused`,`undefined, needed from another object`],answer:3},{id:`p10-l02-q6`,type:`mc`,q:`<p>Why does the vector table need KEEP in the linker script?</p>
`,explain:`<p>The hardware reads it, not your code.</p>
`,options:[`nothing in the code references it, so --gc-sections would drop it`,`KEEP makes it read-only`,`it is too large`,`it must be in RAM`],answer:0}],o=[{file:`link.ld`,lang:`ld`,src:`/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */
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
};`},{file:`main.c`,lang:`c`,src:`#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

static const char greeting[] = "hello from flash\\n";        /* .rodata: stays in flash */
uint32_t table[4] = {3, 1, 4, 1};                           /* .data: initial values in flash, copied to RAM */
uint32_t scratch[2];                                        /* .bss: zeroed at startup */

uint32_t unused_helper(uint32_t x) { return x * 2654435761u; }   /* nothing calls this: --gc-sections drops it */

int main(void) {
  rt_puts(greeting);
  uint32_t sum = 0;
  for (int i = 0; i < 4; i++) sum += table[i];
  scratch[0] = sum;
  rt_puts(sum == 9 && scratch[1] == 0 ? "PASS\\n" : "FAIL\\n");
  return sum == 9 ? 0 : 1;
}`},{file:`Makefile`,lang:`makefile`,src:`# Makefile: build Cortex-M3 firmware with no IDE. Recipe lines start with a TAB.
CC      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE    = arm-none-eabi-size
CFLAGS  = -mcpu=cortex-m3 -mthumb -O2 -g -Wall -Werror -ffreestanding -ffunction-sections -fdata-sections
LDFLAGS = -nostdlib -T link.ld -Wl,--gc-sections -Wl,-Map=fw.map
OBJS    = rt.o main.o
QEMU    = qemu-system-arm -M mps2-an385 -nographic -semihosting-config enable=on,target=native

all: fw.bin

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

fw.elf: $(OBJS) link.ld
	$(CC) $(CFLAGS) $(LDFLAGS) $(OBJS) -o $@
	$(SIZE) $@

fw.bin: fw.elf
	$(OBJCOPY) -O binary $< $@

run: fw.elf
	$(QEMU) -kernel fw.elf

flash: fw.elf
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg -c "program fw.elf verify reset exit"

clean:
	rm -f *.o fw.elf fw.bin fw.map

.PHONY: all run flash clean`},{file:`run.py`,lang:`python`,src:`"""Build with make, check the ELF and BIN with binutils, boot in QEMU."""
import re, shutil, struct, subprocess, sys

for tool in ("make", "arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install make gcc-arm-none-eabi qemu-system-arm)")

def sh(*cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout

sh("make", "clean"); print(sh("make", "all"))

def symbols(path):
    table = {}
    for line in sh("arm-none-eabi-nm", path).splitlines():
        parts = line.split()
        if len(parts) == 3: table[parts[2]] = (int(parts[0], 16), parts[1])
        elif len(parts) == 2: table[parts[1]] = (None, parts[0])
    return table

obj, elf = symbols("main.o"), symbols("fw.elf")
assert obj["rt_puts"][1] == "U"                      # undefined in main.o ...
assert elf["rt_puts"][1] == "T"                      # ... resolved by the linker
assert "unused_helper" in obj and "unused_helper" not in elf   # removed by --gc-sections
assert elf["table"][1] == "D" and elf["scratch"][1] == "B"

text, data, bss = map(int, sh("arm-none-eabi-size", "fw.elf").splitlines()[1].split()[:3])
image = open("fw.bin", "rb").read()
assert len(image) == text + data, (len(image), text, data)     # flash image = text + data

sp, reset = struct.unpack_from("<II", image, 0)
assert sp == elf["_estack"][0] == 0x20010000                     # word 0: initial stack pointer
assert reset == elf["Reset_Handler"][0] | 1                      # word 1: reset vector, Thumb bit set
print(f"text {text} data {data} bss {bss}; bin {len(image)} bytes; SP 0x{sp:08x}; reset 0x{reset:08x}")

boot = subprocess.run(["make", "-s", "run"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
print(boot.stdout.strip())
assert boot.returncode == 0 and "hello from flash" in boot.stdout and "PASS" in boot.stdout
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};