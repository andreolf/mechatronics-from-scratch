var e=`p10-l05`,t=35,n=`A GPIO pin is a handful of bits in memory-mapped registers. You learn the STM32F4 GPIO register set, enable the port clock, configure a pin with a read-modify-write that leaves its neighbours alone, set and clear it atomically through BSRR, and test a blink driver on the host against fake registers and a simulated logic analyser that checks the period.`,r=`<h2 id="registers-are-addresses">Registers are addresses</h2>
<p>On an STM32F4 each GPIO port (A, B, C, …) is a block of 32-bit registers 0x400 bytes apart, starting with GPIOA at 0x4002_0000. The registers you need first:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>offset</th>
<th>register</th>
<th>bits per pin</th>
<th>meaning</th>
</tr>
</thead>
<tbody><tr>
<td>0x00</td>
<td>MODER</td>
<td>2</td>
<td>00 input, 01 output, 10 alternate function, 11 analog</td>
</tr>
<tr>
<td>0x04</td>
<td>OTYPER</td>
<td>1</td>
<td>0 push-pull, 1 open-drain</td>
</tr>
<tr>
<td>0x08</td>
<td>OSPEEDR</td>
<td>2</td>
<td>edge rate (low to very high)</td>
</tr>
<tr>
<td>0x0C</td>
<td>PUPDR</td>
<td>2</td>
<td>00 none, 01 pull-up, 10 pull-down</td>
</tr>
<tr>
<td>0x10</td>
<td>IDR</td>
<td>1</td>
<td>input level (read-only)</td>
</tr>
<tr>
<td>0x14</td>
<td>ODR</td>
<td>1</td>
<td>output level</td>
</tr>
<tr>
<td>0x18</td>
<td>BSRR</td>
<td>1+1</td>
<td>write 1 to bit <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> to set pin <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span>, to bit <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">16</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> to reset it</td>
</tr>
<tr>
<td>0x20</td>
<td>AFR[0..1]</td>
<td>4</td>
<td>alternate function number</td>
</tr>
</tbody></table></div>
<p>In C you describe the block with a struct whose members are <code>volatile uint32_t</code> in register order, and point it at the base address:</p>
<pre><code class="language-c">#define GPIOA ((GPIO_TypeDef *)0x40020000u)
GPIOA-&gt;ODR |= 1u &lt;&lt; 5;
</code></pre>
<p>Before any of this works, the port’s <strong>clock</strong> must be on. Peripherals are clock-gated after reset to save power, and writes to a gated peripheral are ignored. For GPIOA that’s bit 0 of <code>RCC-&gt;AHB1ENR</code> at 0x4002_3830.</p>
<h2 id="read-modify-write-and-why-bsrr-exists">Read-modify-write, and why BSRR exists</h2>
<p>Setting pin 5 to output means writing 01 into MODER bits 11:10 <em>without touching the other 30 bits</em>, which belong to other pins:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord text"><span class="mord">MODER</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">←</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord text"><span class="mord">MODER</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord">&amp;</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∼</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">3</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≪</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2</span><span class="mord mathnormal">n</span><span class="mclose">))</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mopen">(</span><span class="mord">1</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≪</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2</span><span class="mord mathnormal">n</span><span class="mclose">)</span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5.</span></span></span></span></span></div>
<p>That’s a <strong>read-modify-write</strong> (RMW): load, change, store. It’s fine during init, but <code>ODR ^= 1u &lt;&lt; 5</code> in the main loop is three instructions, and if an interrupt changes another ODR bit between the load and the store, its change is lost (lesson 10). <strong>BSRR</strong> avoids this: a single store of <code>1u &lt;&lt; 5</code> sets pin 5, <code>1u &lt;&lt; (5 + 16)</code> clears it, and bits you write as 0 do nothing. The hardware does the modify step atomically.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="gpioblink" data-args="{}"></div></div><figcaption>PA5 driving an LED. Each step shows the register write and the bits it changes; the logic-analyser trace below records the pin. Switch between ODR toggling and BSRR writes, and inject an interrupt that writes PA6 to see the RMW hazard.</figcaption></figure>
<h2 id="testing-without-a-board">Testing without a board</h2>
<p>The trick that makes register code testable: compile the <em>same</em> driver against a fake. On the host, <code>GPIOA</code> points at an ordinary struct in RAM instead of 0x4002_0000. A tiny model applies what the hardware would do (BSRR writes update ODR, then read back as zero), and a fake millisecond clock lets a simulated logic analyser timestamp every edge. The test then checks that init set exactly the right bits and that the blink period is what you asked for. On the board, the only change is the <code>#define</code>.</p>
<h2 id="worked-example">Worked example</h2>
<p>Blink PA5 at 1 Hz with 50 % duty.</p>
<ol>
<li>Enable the clock: <code>RCC-&gt;AHB1ENR |= 1u &lt;&lt; 0</code>.</li>
<li>MODER: clear bits 11:10 (mask 0xC00), set bit 10 (0x400).</li>
<li>Toggle every 500 ms: set with BSRR = 0x20, clear with BSRR = 0x200000.</li>
<li>A logic analyser should show rising edges 1000 ms apart, high for 500 ms.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">gpio_blink.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span>                   <span class="hljs-comment">/* STM32F4 GPIO register block, offsets 0x00..0x24 */</span>
  <span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR, LCKR, AFR[<span class="hljs-number">2</span>];
} GPIO_TypeDef;
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> pad[<span class="hljs-number">12</span>]; <span class="hljs-keyword">volatile</span> <span class="hljs-type">uint32_t</span> AHB1ENR; } RCC_TypeDef;   <span class="hljs-comment">/* AHB1ENR at 0x30 */</span>

<span class="hljs-meta">#<span class="hljs-keyword">ifdef</span> ON_TARGET</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> GPIOA ((GPIO_TypeDef *)0x40020000u)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> RCC   ((RCC_TypeDef *)0x40023800u)</span>
<span class="hljs-meta">#<span class="hljs-keyword">else</span>                              <span class="hljs-comment">/* host build: the same driver writes ordinary RAM */</span></span>
<span class="hljs-type">static</span> GPIO_TypeDef fake_gpioa;
<span class="hljs-type">static</span> RCC_TypeDef fake_rcc;
<span class="hljs-meta">#<span class="hljs-keyword">define</span> GPIOA (&amp;fake_gpioa)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> RCC   (&amp;fake_rcc)</span>
<span class="hljs-meta">#<span class="hljs-keyword">endif</span></span>

<span class="hljs-comment">/* ---------------- driver: identical on host and target ---------------- */</span>
<span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> MODE_IN = <span class="hljs-number">0</span>, MODE_OUT = <span class="hljs-number">1</span>, MODE_AF = <span class="hljs-number">2</span>, MODE_AN = <span class="hljs-number">3</span> };
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">gpio_mode</span><span class="hljs-params">(GPIO_TypeDef *g, <span class="hljs-type">unsigned</span> pin, <span class="hljs-type">unsigned</span> mode)</span> {
  <span class="hljs-type">uint32_t</span> m = g-&gt;MODER;                         <span class="hljs-comment">/* read   */</span>
  m &amp;= ~(<span class="hljs-number">3u</span> &lt;&lt; (<span class="hljs-number">2</span> * pin));                       <span class="hljs-comment">/* modify */</span>
  m |= (mode &amp; <span class="hljs-number">3u</span>) &lt;&lt; (<span class="hljs-number">2</span> * pin);
  g-&gt;MODER = m;                                  <span class="hljs-comment">/* write  */</span>
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">gpio_set</span><span class="hljs-params">(GPIO_TypeDef *g, <span class="hljs-type">unsigned</span> pin)</span>   { g-&gt;BSRR = <span class="hljs-number">1u</span> &lt;&lt; pin; }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">gpio_clear</span><span class="hljs-params">(GPIO_TypeDef *g, <span class="hljs-type">unsigned</span> pin)</span> { g-&gt;BSRR = <span class="hljs-number">1u</span> &lt;&lt; (pin + <span class="hljs-number">16</span>); }
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">led_init</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  RCC-&gt;AHB1ENR |= <span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">0</span>;                       <span class="hljs-comment">/* GPIOA clock on */</span>
  gpio_mode(GPIOA, <span class="hljs-number">5</span>, MODE_OUT);
  GPIOA-&gt;OTYPER &amp;= ~(<span class="hljs-number">1u</span> &lt;&lt; <span class="hljs-number">5</span>);                   <span class="hljs-comment">/* push-pull */</span>
}

<span class="hljs-comment">/* ---------------- host-side model of the hardware and a logic analyser ---------------- */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> now_ms;
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> edges[<span class="hljs-number">64</span>], n_edges, last_level;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">hw_model</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {                     <span class="hljs-comment">/* what silicon does after a bus write */</span>
  <span class="hljs-type">uint32_t</span> b = GPIOA-&gt;BSRR;
  <span class="hljs-keyword">if</span> (b) { GPIOA-&gt;ODR = (GPIOA-&gt;ODR | (b &amp; <span class="hljs-number">0xFFFFu</span>)) &amp; ~(b &gt;&gt; <span class="hljs-number">16</span>); GPIOA-&gt;BSRR = <span class="hljs-number">0</span>; }   <span class="hljs-comment">/* BSRR reads as 0 */</span>
  <span class="hljs-type">uint32_t</span> level = (GPIOA-&gt;ODR &gt;&gt; <span class="hljs-number">5</span>) &amp; <span class="hljs-number">1u</span>;
  <span class="hljs-keyword">if</span> (level != last_level &amp;&amp; n_edges &lt; <span class="hljs-number">64</span>) edges[n_edges++] = (now_ms &lt;&lt; <span class="hljs-number">1</span>) | level;
  last_level = level;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  GPIOA-&gt;MODER = <span class="hljs-number">0xA8000000u</span>;                    <span class="hljs-comment">/* STM32F4 reset value of GPIOA (debug pins in AF) */</span>
  GPIOA-&gt;PUPDR = <span class="hljs-number">0x64000000u</span>;
  led_init(); hw_model();
  CHECK(RCC-&gt;AHB1ENR &amp; <span class="hljs-number">1u</span>);
  CHECK(((GPIOA-&gt;MODER &gt;&gt; <span class="hljs-number">10</span>) &amp; <span class="hljs-number">3u</span>) == MODE_OUT);
  CHECK((GPIOA-&gt;MODER &amp; ~(<span class="hljs-number">3u</span> &lt;&lt; <span class="hljs-number">10</span>)) == <span class="hljs-number">0xA8000000u</span>);   <span class="hljs-comment">/* the other 15 pins untouched */</span>

  <span class="hljs-comment">/* blink at 1 Hz for 10 s: the main loop polls a millisecond clock */</span>
  <span class="hljs-type">uint32_t</span> next = <span class="hljs-number">0</span>; <span class="hljs-type">int</span> on = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (now_ms = <span class="hljs-number">0</span>; now_ms &lt;= <span class="hljs-number">10000</span>; now_ms++) {
    <span class="hljs-keyword">if</span> (now_ms == next) { on = !on; <span class="hljs-keyword">if</span> (on) gpio_set(GPIOA, <span class="hljs-number">5</span>); <span class="hljs-keyword">else</span> gpio_clear(GPIOA, <span class="hljs-number">5</span>); next += <span class="hljs-number">500</span>; }
    hw_model();
  }
  CHECK(n_edges == <span class="hljs-number">21</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = <span class="hljs-number">0</span>; i + <span class="hljs-number">2</span> &lt; n_edges; i += <span class="hljs-number">2</span>) {
    CHECK((edges[i] &amp; <span class="hljs-number">1u</span>) == <span class="hljs-number">1</span> &amp;&amp; (edges[i + <span class="hljs-number">1</span>] &amp; <span class="hljs-number">1u</span>) == <span class="hljs-number">0</span>);          <span class="hljs-comment">/* rise then fall */</span>
    <span class="hljs-type">uint32_t</span> t_rise = edges[i] &gt;&gt; <span class="hljs-number">1</span>, t_fall = edges[i + <span class="hljs-number">1</span>] &gt;&gt; <span class="hljs-number">1</span>, t_next = edges[i + <span class="hljs-number">2</span>] &gt;&gt; <span class="hljs-number">1</span>;
    CHECK(t_next - t_rise == <span class="hljs-number">1000</span>);                                     <span class="hljs-comment">/* period 1000 ms */</span>
    CHECK(t_fall - t_rise == <span class="hljs-number">500</span>);                                      <span class="hljs-comment">/* 50 % duty */</span>
  }
  CHECK(GPIOA-&gt;BSRR == <span class="hljs-number">0</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;MODER 0x%08X, %u edges, period 1000 ms, high 500 ms\\nPASS\\n&quot;</span>, (<span class="hljs-type">unsigned</span>)GPIOA-&gt;MODER, (<span class="hljs-type">unsigned</span>)n_edges);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Configure PA9 and PA10 as alternate function 7 (USART1) in one write to AFR. Which register and which bits?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Pins 8–15 use <code>AFR[1]</code> (AFRH), 4 bits each, so pin 9 is bits 7:4 and pin 10 is bits 11:8. <code>AFR[1] = (AFR[1] &amp; ~0xFF0u) | (7u &lt;&lt; 4) | (7u &lt;&lt; 8)</code>. Also set both pins’ MODER fields to 10 (alternate function).</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Your LED never lights though the code runs and MODER looks right in the debugger. What’s the first thing to check?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The port clock. If <code>RCC-&gt;AHB1ENR</code> bit 0 isn’t set, register writes to GPIOA are ignored (and may read back as 0). The second thing to check is whether the LED is active-low, i.e. wired from 3.3 V to the pin, so writing 1 turns it off.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l05"></div>

`,i=[{id:`registers-are-addresses`,title:`Registers are addresses`},{id:`read-modify-write-and-why-bsrr-exists`,title:`Read-modify-write, and why BSRR exists`},{id:`testing-without-a-board`,title:`Testing without a board`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l05-q1`,type:`num`,q:`<p>Which MODER bit is the lower bit of pin 7’s field?</p>
`,explain:`<p>Two bits per pin.</p>
`,answer:14,tol:.001,unit:``},{id:`p10-l05-q2`,type:`num`,q:`<p>Value to write to BSRR to clear pin 3 (decimal)?</p>
`,explain:`<p>Reset bits are the upper half.</p>
`,answer:524288,tol:.001,unit:``},{id:`p10-l05-q3`,type:`num`,q:`<p>Address of GPIOC’s ODR (decimal), with ports 0x400 apart from GPIOA at 0x40020000?</p>
`,explain:`<p>0x40020814.</p>
`,answer:1073874964,tol:1e-7,unit:``},{id:`p10-l05-q4`,type:`num`,q:`<p>Mask to clear the MODER field of pin 5 (decimal)?</p>
`,explain:`<p>0xC00.</p>
`,answer:3072,tol:.001,unit:``},{id:`p10-l05-q5`,type:`mc`,q:`<p>Why use BSRR instead of ODR |= bit in the main loop?</p>
`,explain:`<p>No read-modify-write.</p>
`,options:[`it is faster to read`,`a single store sets or clears pins atomically, so an interrupt cannot lose an update`,`ODR is read-only`,`BSRR also enables the clock`],answer:1},{id:`p10-l05-q6`,type:`mc`,q:`<p>You write to a GPIO register but nothing changes. The most common cause is…</p>
`,explain:`<p>Peripherals are clock-gated after reset.</p>
`,options:[`the pin is analog`,`the port’s clock is not enabled in RCC`,`the compiler optimised it away even with volatile`,`BSRR is full`],answer:1}],o=[{file:`gpio_blink.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {                   /* STM32F4 GPIO register block, offsets 0x00..0x24 */
  volatile uint32_t MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR, LCKR, AFR[2];
} GPIO_TypeDef;
typedef struct { volatile uint32_t pad[12]; volatile uint32_t AHB1ENR; } RCC_TypeDef;   /* AHB1ENR at 0x30 */

#ifdef ON_TARGET
#define GPIOA ((GPIO_TypeDef *)0x40020000u)
#define RCC   ((RCC_TypeDef *)0x40023800u)
#else                              /* host build: the same driver writes ordinary RAM */
static GPIO_TypeDef fake_gpioa;
static RCC_TypeDef fake_rcc;
#define GPIOA (&fake_gpioa)
#define RCC   (&fake_rcc)
#endif

/* ---------------- driver: identical on host and target ---------------- */
enum { MODE_IN = 0, MODE_OUT = 1, MODE_AF = 2, MODE_AN = 3 };
static void gpio_mode(GPIO_TypeDef *g, unsigned pin, unsigned mode) {
  uint32_t m = g->MODER;                         /* read   */
  m &= ~(3u << (2 * pin));                       /* modify */
  m |= (mode & 3u) << (2 * pin);
  g->MODER = m;                                  /* write  */
}
static void gpio_set(GPIO_TypeDef *g, unsigned pin)   { g->BSRR = 1u << pin; }
static void gpio_clear(GPIO_TypeDef *g, unsigned pin) { g->BSRR = 1u << (pin + 16); }
static void led_init(void) {
  RCC->AHB1ENR |= 1u << 0;                       /* GPIOA clock on */
  gpio_mode(GPIOA, 5, MODE_OUT);
  GPIOA->OTYPER &= ~(1u << 5);                   /* push-pull */
}

/* ---------------- host-side model of the hardware and a logic analyser ---------------- */
static uint32_t now_ms;
static uint32_t edges[64], n_edges, last_level;
static void hw_model(void) {                     /* what silicon does after a bus write */
  uint32_t b = GPIOA->BSRR;
  if (b) { GPIOA->ODR = (GPIOA->ODR | (b & 0xFFFFu)) & ~(b >> 16); GPIOA->BSRR = 0; }   /* BSRR reads as 0 */
  uint32_t level = (GPIOA->ODR >> 5) & 1u;
  if (level != last_level && n_edges < 64) edges[n_edges++] = (now_ms << 1) | level;
  last_level = level;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  GPIOA->MODER = 0xA8000000u;                    /* STM32F4 reset value of GPIOA (debug pins in AF) */
  GPIOA->PUPDR = 0x64000000u;
  led_init(); hw_model();
  CHECK(RCC->AHB1ENR & 1u);
  CHECK(((GPIOA->MODER >> 10) & 3u) == MODE_OUT);
  CHECK((GPIOA->MODER & ~(3u << 10)) == 0xA8000000u);   /* the other 15 pins untouched */

  /* blink at 1 Hz for 10 s: the main loop polls a millisecond clock */
  uint32_t next = 0; int on = 0;
  for (now_ms = 0; now_ms <= 10000; now_ms++) {
    if (now_ms == next) { on = !on; if (on) gpio_set(GPIOA, 5); else gpio_clear(GPIOA, 5); next += 500; }
    hw_model();
  }
  CHECK(n_edges == 21);
  for (uint32_t i = 0; i + 2 < n_edges; i += 2) {
    CHECK((edges[i] & 1u) == 1 && (edges[i + 1] & 1u) == 0);          /* rise then fall */
    uint32_t t_rise = edges[i] >> 1, t_fall = edges[i + 1] >> 1, t_next = edges[i + 2] >> 1;
    CHECK(t_next - t_rise == 1000);                                     /* period 1000 ms */
    CHECK(t_fall - t_rise == 500);                                      /* 50 % duty */
  }
  CHECK(GPIOA->BSRR == 0);
  printf("MODER 0x%08X, %u edges, period 1000 ms, high 500 ms\\nPASS\\n", (unsigned)GPIOA->MODER, (unsigned)n_edges);
  return 0;
}`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};