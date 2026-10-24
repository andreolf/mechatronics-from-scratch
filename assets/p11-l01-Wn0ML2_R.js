var e=`p11-l01`,t=35,n=`A UART sends each byte as a start bit, eight data bits least significant first, an optional parity bit and a stop bit, with no clock wire, so both ends must agree on the bit rate. You derive the frame, the baud-rate divider and how much rate mismatch a receiver tolerates, write a bit-banged transmitter driven by a 1 µs timer with fractional timing, and test it by decoding its trace like a logic analyser at 115 200 baud.`,r=`<h2 id="the-frame">The frame</h2>
<p>A UART (universal asynchronous receiver-transmitter) line idles <strong>high</strong>. Each character is a frame:</p>
<ol>
<li>a <strong>start bit</strong> (low), which tells the receiver “a byte begins here” and lets it align its timing;</li>
<li>5–9 <strong>data bits</strong>, usually 8, <strong>least significant bit first</strong>;</li>
<li>an optional <strong>parity bit</strong>: even parity makes the number of 1s in data + parity even, odd makes it odd;</li>
<li>one or two <strong>stop bits</strong> (high), which guarantee an idle-to-start falling edge before the next frame.</li>
</ol>
<p>“8N1” is 8 data bits, no parity, 1 stop: 10 bit times per byte, so 115 200 baud carries 11 520 bytes/s. There’s no clock line, which is why it’s <em>asynchronous</em>: the receiver re-times itself on every start bit’s falling edge and then trusts its own clock for the rest of the frame.</p>
<h2 id="how-much-clock-error-is-allowed">How much clock error is allowed</h2>
<p>The receiver samples each bit in the middle. It finds the falling edge of the start bit, waits 1.5 bit times to the middle of bit 0, then one bit time for each next bit. The last sample, the stop bit’s middle, is at <strong>9.5 bit times</strong> after the edge for 8N1. If the two clocks differ by a fraction <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">ε</span></span></span></span>, that sample drifts by <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9.5</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">ε</span></span></span></span> bits, and it must stay within the bit, less than half a bit from the middle:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">9.5</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">∣</span><span class="mord mathnormal">ε</span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0.5</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">⇒</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">∣</span><span class="mord mathnormal">ε</span><span class="mord">∣</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">&lt;</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8056em;vertical-align:-0.0556em;"></span><span class="mord">5.3</span><span class="mspace">\xA0</span><span class="mord">%.</span></span></span></span></span></div>
<p>That’s the total between transmitter and receiver, and edge detection with 16× oversampling eats about 1/16 bit of it, so the usual rule is <strong>under about 2 % on each side</strong>. Parity or 9-bit frames lengthen the frame and shrink the budget.</p>
<h2 id="the-baud-rate-divider">The baud-rate divider</h2>
<p>A hardware UART divides its clock. An STM32 USART with 16× oversampling uses <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord text"><span class="mord">USARTDIV</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">c</span><span class="mord mathnormal mtight" style="margin-right:0.0197em;">l</span><span class="mord mathnormal mtight" style="margin-right:0.0315em;">k</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mopen">(</span><span class="mord">16</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">baud</span></span><span class="mclose">)</span></span></span></span>, stored with 4 fraction bits. At 84 MHz and 115 200 baud, USARTDIV = 45.57, stored as 45 + 9/16 = 45.5625, which gives 115 226 baud, an error of +0.02 %.</p>
<p>A <strong>bit-banged</strong> transmitter toggles a GPIO from a timer. With a 1 µs tick, a bit is 8.68 µs. Rounding every bit to 9 µs is +3.7 % slow, most of the budget. Better: keep the ideal edge times as a running sum and round each one, so each bit is 8 or 9 µs but the error never accumulates beyond half a tick (the same idea as Bresenham’s line algorithm).</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="uarttrace" data-args="{}"></div></div><figcaption>A UART frame on a logic trace with the receiver’s mid-bit sampling points. Change the byte, parity and the transmitter’s clock error: past about 5 % the stop-bit sample lands in the wrong bit and the frame fails.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>Send 0x4B (‘K’) as 8E1 at 115 200 baud.</p>
<ol>
<li>0x4B = 0100 1011; LSB first the data bits are 1, 1, 0, 1, 0, 0, 1, 0.</li>
<li>Four 1s, so even parity is 0.</li>
<li>The line: idle 1, start 0, 1 1 0 1 0 0 1 0, parity 0, stop 1. Eleven bit times, 95.5 µs.</li>
<li>With a 1 µs tick, the ideal edges are at 0, 8.68, 17.36, 26.04, … µs, rounded to 0, 9, 17, 26, …; no edge is more than 0.5 µs (5.8 % of a bit) from its ideal place, and the error doesn’t grow.</li>
<li>Rounding every bit to 9 µs instead puts the stop bit’s middle at <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">10.5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">94.5</span></span></span></span> µs instead of 91.1 µs: 0.39 bit late, close to failing.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">uart_tx.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>

<span class="hljs-comment">/* a logic-analyser trace: the line level changes at these times (ns); idle high before the first edge */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">int64_t</span> t[<span class="hljs-number">64</span>]; <span class="hljs-type">int</span> lvl[<span class="hljs-number">64</span>]; <span class="hljs-type">int</span> n; } <span class="hljs-type">trace_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">emit</span><span class="hljs-params">(<span class="hljs-type">trace_t</span> *tr, <span class="hljs-type">int64_t</span> t, <span class="hljs-type">int</span> level)</span> {
  <span class="hljs-keyword">if</span> (tr-&gt;n &amp;&amp; tr-&gt;lvl[tr-&gt;n - <span class="hljs-number">1</span>] == level) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (!tr-&gt;n &amp;&amp; level == <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
  tr-&gt;t[tr-&gt;n] = t; tr-&gt;lvl[tr-&gt;n] = level; tr-&gt;n++;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">level_at</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">trace_t</span> *tr, <span class="hljs-type">int64_t</span> t)</span> { <span class="hljs-type">int</span> v = <span class="hljs-number">1</span>; <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; tr-&gt;n &amp;&amp; tr-&gt;t[i] &lt;= t; i++) v = tr-&gt;lvl[i]; <span class="hljs-keyword">return</span> v; }

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> PAR_NONE, PAR_EVEN, PAR_ODD } <span class="hljs-type">parity_t</span>;

<span class="hljs-comment">/* bit-banged transmitter: one GPIO write per bit, edges scheduled on a 1 us timer tick.
   exact = 1 keeps a running ideal time and rounds each edge; exact = 0 rounds the bit period once. */</span>
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">uart_tx</span><span class="hljs-params">(<span class="hljs-type">trace_t</span> *tr, <span class="hljs-type">uint8_t</span> byte, <span class="hljs-type">double</span> baud, <span class="hljs-type">parity_t</span> par, <span class="hljs-type">int</span> exact, <span class="hljs-type">double</span> clock_err)</span> {
  <span class="hljs-type">int</span> bits[<span class="hljs-number">11</span>], nb = <span class="hljs-number">0</span>, ones = <span class="hljs-number">0</span>;
  bits[nb++] = <span class="hljs-number">0</span>;                                           <span class="hljs-comment">/* start */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">8</span>; i++) { <span class="hljs-type">int</span> b = (byte &gt;&gt; i) &amp; <span class="hljs-number">1</span>; bits[nb++] = b; ones += b; }   <span class="hljs-comment">/* LSB first */</span>
  <span class="hljs-keyword">if</span> (par != PAR_NONE) bits[nb++] = (par == PAR_EVEN) ? (ones &amp; <span class="hljs-number">1</span>) : !(ones &amp; <span class="hljs-number">1</span>);
  bits[nb++] = <span class="hljs-number">1</span>;                                           <span class="hljs-comment">/* stop */</span>
  <span class="hljs-type">double</span> bit_us = <span class="hljs-number">1e6</span> / baud * (<span class="hljs-number">1</span> + clock_err);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; nb; i++) {
    <span class="hljs-type">double</span> ideal = i * bit_us;
    <span class="hljs-type">int64_t</span> tick = exact ? (<span class="hljs-type">int64_t</span>)llround(ideal) : (<span class="hljs-type">int64_t</span>)i * (<span class="hljs-type">int64_t</span>)llround(bit_us);
    emit(tr, tick * <span class="hljs-number">1000</span>, bits[i]);                         <span class="hljs-comment">/* 1 us = 1000 ns */</span>
  }
}

<span class="hljs-comment">/* an ideal receiver, as a logic analyser decodes: find the falling edge, sample each bit in its middle */</span>
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">uart_decode</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">trace_t</span> *tr, <span class="hljs-type">double</span> baud, <span class="hljs-type">parity_t</span> par, <span class="hljs-type">uint8_t</span> *out)</span> {
  <span class="hljs-keyword">if</span> (!tr-&gt;n || tr-&gt;lvl[<span class="hljs-number">0</span>] != <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;
  <span class="hljs-type">double</span> t0 = tr-&gt;t[<span class="hljs-number">0</span>], bit_ns = <span class="hljs-number">1e9</span> / baud;
  <span class="hljs-type">uint8_t</span> v = <span class="hljs-number">0</span>; <span class="hljs-type">int</span> ones = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">8</span>; i++) { <span class="hljs-type">int</span> b = level_at(tr, (<span class="hljs-type">int64_t</span>)(t0 + (<span class="hljs-number">1.5</span> + i) * bit_ns)); v |= (<span class="hljs-type">uint8_t</span>)(b &lt;&lt; i); ones += b; }
  <span class="hljs-type">int</span> k = <span class="hljs-number">9</span>;
  <span class="hljs-keyword">if</span> (par != PAR_NONE) { <span class="hljs-type">int</span> p = level_at(tr, (<span class="hljs-type">int64_t</span>)(t0 + <span class="hljs-number">9.5</span> * bit_ns)); <span class="hljs-keyword">if</span> (((ones + p) &amp; <span class="hljs-number">1</span>) != (par == PAR_ODD)) <span class="hljs-keyword">return</span> <span class="hljs-number">-2</span>; k = <span class="hljs-number">10</span>; }
  <span class="hljs-keyword">if</span> (level_at(tr, (<span class="hljs-type">int64_t</span>)(t0 + (k + <span class="hljs-number">0.5</span>) * bit_ns)) != <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">-3</span>;    <span class="hljs-comment">/* framing error */</span>
  *out = v; <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">const</span> <span class="hljs-type">double</span> baud = <span class="hljs-number">115200</span>;
  <span class="hljs-comment">/* every byte value, 8N1, 8E1 and 8O1 */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> par = PAR_NONE; par &lt;= PAR_ODD; par++)
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> b = <span class="hljs-number">0</span>; b &lt; <span class="hljs-number">256</span>; b++) {
      <span class="hljs-type">trace_t</span> tr = {{<span class="hljs-number">0</span>}, {<span class="hljs-number">0</span>}, <span class="hljs-number">0</span>}; <span class="hljs-type">uint8_t</span> got;
      uart_tx(&amp;tr, (<span class="hljs-type">uint8_t</span>)b, baud, (<span class="hljs-type">parity_t</span>)par, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>);
      CHECK(uart_decode(&amp;tr, baud, (<span class="hljs-type">parity_t</span>)par, &amp;got) == <span class="hljs-number">0</span> &amp;&amp; got == b);
    }
  <span class="hljs-comment">/* the worked example: &#x27;K&#x27; as 8E1 */</span>
  <span class="hljs-type">trace_t</span> k = {{<span class="hljs-number">0</span>}, {<span class="hljs-number">0</span>}, <span class="hljs-number">0</span>}; uart_tx(&amp;k, <span class="hljs-number">0x4B</span>, baud, PAR_EVEN, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>);
  <span class="hljs-type">const</span> <span class="hljs-type">int</span> expect[<span class="hljs-number">11</span>] = {<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>};
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">11</span>; i++) CHECK(level_at(&amp;k, (<span class="hljs-type">int64_t</span>)((i + <span class="hljs-number">0.5</span>) * <span class="hljs-number">1e9</span> / baud)) == expect[i]);
  <span class="hljs-comment">/* fractional timing keeps every edge within half a tick of ideal; naive rounding drifts */</span>
  <span class="hljs-type">double</span> worst = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt;= <span class="hljs-number">10</span>; i++) { <span class="hljs-type">double</span> ideal = i * <span class="hljs-number">1e6</span> / baud, got = (<span class="hljs-type">double</span>)llround(ideal); <span class="hljs-keyword">if</span> (<span class="hljs-built_in">fabs</span>(got - ideal) &gt; worst) worst = <span class="hljs-built_in">fabs</span>(got - ideal); }
  CHECK(worst &lt;= <span class="hljs-number">0.5</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;8N1/8E1/8O1: all 256 bytes decode at 115200 baud; worst edge error %.2f us with fractional timing\\n&quot;</span>, worst);
  <span class="hljs-comment">/* clock error: the decoder tolerates a few percent, then fails */</span>
  <span class="hljs-type">int</span> ok_at[<span class="hljs-number">2</span>] = {<span class="hljs-number">0</span>, <span class="hljs-number">0</span>};
  <span class="hljs-type">const</span> <span class="hljs-type">double</span> errs[<span class="hljs-number">2</span>] = {<span class="hljs-number">0.03</span>, <span class="hljs-number">0.065</span>};
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> e = <span class="hljs-number">0</span>; e &lt; <span class="hljs-number">2</span>; e++)
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> b = <span class="hljs-number">0</span>; b &lt; <span class="hljs-number">256</span>; b++) { <span class="hljs-type">trace_t</span> tr = {{<span class="hljs-number">0</span>}, {<span class="hljs-number">0</span>}, <span class="hljs-number">0</span>}; <span class="hljs-type">uint8_t</span> got; uart_tx(&amp;tr, (<span class="hljs-type">uint8_t</span>)b, baud, PAR_NONE, <span class="hljs-number">1</span>, errs[e]); ok_at[e] += uart_decode(&amp;tr, baud, PAR_NONE, &amp;got) == <span class="hljs-number">0</span> &amp;&amp; got == b; }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;transmitter 3.0 %% slow: %d/256 bytes ok; 6.5 %% slow: %d/256 ok\\n&quot;</span>, ok_at[<span class="hljs-number">0</span>], ok_at[<span class="hljs-number">1</span>]);
  CHECK(ok_at[<span class="hljs-number">0</span>] == <span class="hljs-number">256</span> &amp;&amp; ok_at[<span class="hljs-number">1</span>] &lt; <span class="hljs-number">256</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A sensor sends 9600 baud from an RC oscillator rated ±2 %, and your MCU’s UART is crystal-accurate. Will it work at 8N1? At 8E2?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>8N1 tolerates about 5 % total (less the oversampling allowance), so ±2 % is fine. 8E2 has the last stop bit at 11.5 bit times, so the limit is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">0.5/11.5</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4.3</span></span></span></span> %, still fine for ±2 %. Two RC-clocked ends at ±2 % each, 4 % in the worst case, would be marginal.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why are the data bits sent LSB first, and does it matter?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>It’s the historical convention of serial lines and shift registers, and both ends must agree. A logic analyser or a decoder written MSB-first reads 0x4B as 0xD2. SPI, by contrast, is usually MSB first (lesson 08), which is a frequent source of confusion.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l01"></div>

`,i=[{id:`the-frame`,title:`The frame`},{id:`how-much-clock-error-is-allowed`,title:`How much clock error is allowed`},{id:`the-baud-rate-divider`,title:`The baud-rate divider`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l01-q1`,type:`num`,q:`<p>Bytes per second at 115 200 baud, 8N1?</p>
`,explain:`<p>Ten bit times per byte.</p>
`,answer:11520,tol:.001,unit:`bytes/s`},{id:`p11-l01-q2`,type:`num`,q:`<p>Maximum total clock mismatch in percent for 8N1 (stop-bit middle at 9.5 bits)?</p>
`,explain:`<p>Half a bit over 9.5 bit times.</p>
`,answer:5.263,tol:.001,unit:`%`},{id:`p11-l01-q3`,type:`num`,q:`<p>Actual baud rate with USARTDIV = 45.5625 at 84 MHz (16× oversampling)?</p>
`,explain:`<p>f/(16·USARTDIV).</p>
`,answer:115226.3,tol:1e-4,unit:`baud`},{id:`p11-l01-q4`,type:`num`,q:`<p>Error in percent of rounding every 115 200-baud bit to 9 µs?</p>
`,explain:`<p>Most of the budget gone.</p>
`,answer:3.68,tol:.002,unit:`%`},{id:`p11-l01-q5`,type:`mc`,q:`<p>What is the even parity bit for data 0x4B?</p>
`,explain:`<p>Four 1s already, so parity 0 keeps the count even.</p>
`,options:[`parity is not defined for 8 bits`,`it depends on the stop bits`,`1`,`0`],answer:3},{id:`p11-l01-q6`,type:`mc`,q:`<p>The UART line when idle is…</p>
`,explain:`<p>The start bit is the falling edge out of idle.</p>
`,options:[`floating`,`low`,`high`,`toggling at the baud rate`],answer:2}],o=[{file:`uart_tx.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* a logic-analyser trace: the line level changes at these times (ns); idle high before the first edge */
typedef struct { int64_t t[64]; int lvl[64]; int n; } trace_t;
static void emit(trace_t *tr, int64_t t, int level) {
  if (tr->n && tr->lvl[tr->n - 1] == level) return;
  if (!tr->n && level == 1) return;
  tr->t[tr->n] = t; tr->lvl[tr->n] = level; tr->n++;
}
static int level_at(const trace_t *tr, int64_t t) { int v = 1; for (int i = 0; i < tr->n && tr->t[i] <= t; i++) v = tr->lvl[i]; return v; }

typedef enum { PAR_NONE, PAR_EVEN, PAR_ODD } parity_t;

/* bit-banged transmitter: one GPIO write per bit, edges scheduled on a 1 us timer tick.
   exact = 1 keeps a running ideal time and rounds each edge; exact = 0 rounds the bit period once. */
static void uart_tx(trace_t *tr, uint8_t byte, double baud, parity_t par, int exact, double clock_err) {
  int bits[11], nb = 0, ones = 0;
  bits[nb++] = 0;                                           /* start */
  for (int i = 0; i < 8; i++) { int b = (byte >> i) & 1; bits[nb++] = b; ones += b; }   /* LSB first */
  if (par != PAR_NONE) bits[nb++] = (par == PAR_EVEN) ? (ones & 1) : !(ones & 1);
  bits[nb++] = 1;                                           /* stop */
  double bit_us = 1e6 / baud * (1 + clock_err);
  for (int i = 0; i < nb; i++) {
    double ideal = i * bit_us;
    int64_t tick = exact ? (int64_t)llround(ideal) : (int64_t)i * (int64_t)llround(bit_us);
    emit(tr, tick * 1000, bits[i]);                         /* 1 us = 1000 ns */
  }
}

/* an ideal receiver, as a logic analyser decodes: find the falling edge, sample each bit in its middle */
static int uart_decode(const trace_t *tr, double baud, parity_t par, uint8_t *out) {
  if (!tr->n || tr->lvl[0] != 0) return -1;
  double t0 = tr->t[0], bit_ns = 1e9 / baud;
  uint8_t v = 0; int ones = 0;
  for (int i = 0; i < 8; i++) { int b = level_at(tr, (int64_t)(t0 + (1.5 + i) * bit_ns)); v |= (uint8_t)(b << i); ones += b; }
  int k = 9;
  if (par != PAR_NONE) { int p = level_at(tr, (int64_t)(t0 + 9.5 * bit_ns)); if (((ones + p) & 1) != (par == PAR_ODD)) return -2; k = 10; }
  if (level_at(tr, (int64_t)(t0 + (k + 0.5) * bit_ns)) != 1) return -3;    /* framing error */
  *out = v; return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double baud = 115200;
  /* every byte value, 8N1, 8E1 and 8O1 */
  for (int par = PAR_NONE; par <= PAR_ODD; par++)
    for (int b = 0; b < 256; b++) {
      trace_t tr = {{0}, {0}, 0}; uint8_t got;
      uart_tx(&tr, (uint8_t)b, baud, (parity_t)par, 1, 0);
      CHECK(uart_decode(&tr, baud, (parity_t)par, &got) == 0 && got == b);
    }
  /* the worked example: 'K' as 8E1 */
  trace_t k = {{0}, {0}, 0}; uart_tx(&k, 0x4B, baud, PAR_EVEN, 1, 0);
  const int expect[11] = {0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1};
  for (int i = 0; i < 11; i++) CHECK(level_at(&k, (int64_t)((i + 0.5) * 1e9 / baud)) == expect[i]);
  /* fractional timing keeps every edge within half a tick of ideal; naive rounding drifts */
  double worst = 0;
  for (int i = 0; i <= 10; i++) { double ideal = i * 1e6 / baud, got = (double)llround(ideal); if (fabs(got - ideal) > worst) worst = fabs(got - ideal); }
  CHECK(worst <= 0.5);
  printf("8N1/8E1/8O1: all 256 bytes decode at 115200 baud; worst edge error %.2f us with fractional timing\\n", worst);
  /* clock error: the decoder tolerates a few percent, then fails */
  int ok_at[2] = {0, 0};
  const double errs[2] = {0.03, 0.065};
  for (int e = 0; e < 2; e++)
    for (int b = 0; b < 256; b++) { trace_t tr = {{0}, {0}, 0}; uint8_t got; uart_tx(&tr, (uint8_t)b, baud, PAR_NONE, 1, errs[e]); ok_at[e] += uart_decode(&tr, baud, PAR_NONE, &got) == 0 && got == b; }
  printf("transmitter 3.0 %% slow: %d/256 bytes ok; 6.5 %% slow: %d/256 ok\\n", ok_at[0], ok_at[1]);
  CHECK(ok_at[0] == 256 && ok_at[1] < 256);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};