var e=`p10-l13`,t=40,n=`A timer can trigger the ADC and the DMA controller can move every result into RAM, so sensors are sampled at an exact rate with no CPU time spent. You derive conversion time and the maximum scan rate, set up a circular DMA buffer with half- and full-transfer interrupts so the CPU always processes the half that isn’t being written, and test a cycle-level model for the sample rate, channel order and overrun detection.`,r=`<h2 id="conversion-time">Conversion time</h2>
<p>The STM32F4’s 12-bit successive-approximation ADC (Phase 06) runs from its own clock, APB2 divided by 2, 4, 6 or 8, at most 36 MHz. Each conversion costs a programmable <strong>sampling time</strong> (3, 15, 28, 56, 84, 112, 144 or 480 ADC clocks), during which the sample-and-hold capacitor charges through the source impedance, plus 12 clocks for the 12-bit approximation:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">conv</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.2019em;vertical-align:-0.8804em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">ADC</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">samp</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord">12</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>A high source impedance needs a longer sampling time, or the capacitor doesn’t settle and the reading is low. In <strong>scan mode</strong> the ADC converts a list of channels back to back, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span> channels take <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">conv</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, and the fastest trigger rate is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1/</span><span class="mopen">(</span><span class="mord mathnormal">n</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">conv</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span>.</p>
<h2 id="triggers-and-dma">Triggers and DMA</h2>
<p>Software-started conversions jitter with the code that starts them. Instead, let a <strong>timer’s update event</strong> (lesson 08) start each scan: the sample instants are then as regular as the crystal. Each finished conversion raises a DMA request, and the DMA controller copies the data register into the next slot of a buffer in RAM. Nothing runs on the CPU.</p>
<p>In <strong>circular mode</strong> the DMA wraps back to the start of the buffer by itself, forever. It raises a <strong>half-transfer</strong> (HT) interrupt when it fills the first half and a <strong>transfer-complete</strong> (TC) interrupt at the end. That’s double buffering for free: on HT, process the first half while the DMA fills the second, and vice versa. Processing one half must finish before the DMA comes back to it, so the time budget is half the buffer’s duration.</p>
<p>If a new trigger arrives before the scan finishes, the ADC flags an <strong>overrun</strong> (OVR) and data is lost. Always check for it.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="adcring" data-args="{}"></div></div><figcaption>A circular DMA buffer of 4 channels × 8 scans as a ring. The write pointer advances with each conversion; the half being processed by the CPU is highlighted at each HT and TC interrupt.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>APB2 = 84 MHz, ADC prescaler /4, 15-cycle sampling, 4 channels, TIM2 trigger at 10 kHz, buffer of 64 scans.</p>
<ol>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">ADC</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> = 21 MHz; <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">conv</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">27/21</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">MHz</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.286</span></span></span></span> µs.</li>
<li>A scan takes <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">1.286</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5.14</span></span></span></span> µs, so the fastest trigger is 194 kHz. At 10 kHz the ADC is busy 5.1 % of the time.</li>
<li>The buffer holds <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">64</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">4</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">256</span></span></span></span> samples, 6.4 ms of data; an HT or TC interrupt comes every 3.2 ms.</li>
<li>Triggering at 250 kHz (every 4 µs) is shorter than a scan: overrun.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>
<p>The model counts ADC clock cycles. A timer issues a trigger every <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3283em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">ADC</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3175em;"><span style="top:-2.55em;margin-left:-0.1076em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">trig</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span></span></span></span> cycles; the ADC converts each channel in turn and the DMA writes each result into a circular buffer, firing HT and TC. The “CPU” handler averages the half it was given and checks the DMA isn’t writing into it.</p>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">adc_dma.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>

<span class="hljs-meta">#<span class="hljs-keyword">define</span> PI 3.14159265358979323846</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NCH 4</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> SCANS 64</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NBUF (NCH * SCANS)</span>

<span class="hljs-type">static</span> <span class="hljs-type">uint16_t</span> buf[NBUF];
<span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> dma_idx;                                   <span class="hljs-comment">/* next slot the DMA will write */</span>
<span class="hljs-type">static</span> <span class="hljs-type">uint64_t</span> ch0_times[<span class="hljs-number">4096</span>]; <span class="hljs-type">static</span> <span class="hljs-type">uint32_t</span> n_ch0;
<span class="hljs-type">static</span> <span class="hljs-type">int</span> halves_done, half_violation;
<span class="hljs-type">static</span> <span class="hljs-type">double</span> avg[NCH];

<span class="hljs-type">static</span> <span class="hljs-type">uint16_t</span> <span class="hljs-title function_">sensor</span><span class="hljs-params">(<span class="hljs-type">int</span> ch, <span class="hljs-type">double</span> t)</span> {                  <span class="hljs-comment">/* four test signals, 12-bit */</span>
  <span class="hljs-keyword">if</span> (ch == <span class="hljs-number">3</span>) <span class="hljs-keyword">return</span> (<span class="hljs-type">uint16_t</span>)lround(<span class="hljs-number">0.25</span> * <span class="hljs-number">4095</span>);       <span class="hljs-comment">/* channel 3: a constant reference */</span>
  <span class="hljs-keyword">return</span> (<span class="hljs-type">uint16_t</span>)lround((<span class="hljs-number">0.5</span> + <span class="hljs-number">0.4</span> * <span class="hljs-built_in">sin</span>(<span class="hljs-number">2</span> * PI * <span class="hljs-number">50.0</span> * (ch + <span class="hljs-number">1</span>) * t)) * <span class="hljs-number">4095</span>);
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">process_half</span><span class="hljs-params">(<span class="hljs-type">int</span> which)</span> {                       <span class="hljs-comment">/* runs on HT (which = 0) or TC (which = 1) */</span>
  <span class="hljs-type">uint32_t</span> lo = which * NBUF / <span class="hljs-number">2</span>, hi = lo + NBUF / <span class="hljs-number">2</span>;
  <span class="hljs-keyword">if</span> (dma_idx &gt;= lo &amp;&amp; dma_idx &lt; hi) half_violation = <span class="hljs-number">1</span>;    <span class="hljs-comment">/* DMA must be in the other half */</span>
  <span class="hljs-type">double</span> s[NCH] = {<span class="hljs-number">0</span>};
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = lo; i &lt; hi; i++) s[i % NCH] += buf[i];
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> c = <span class="hljs-number">0</span>; c &lt; NCH; c++) avg[c] = s[c] / (SCANS / <span class="hljs-number">2</span>);
  halves_done++;
}

<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">uint64_t</span> triggers, overruns; } <span class="hljs-type">run_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">run_t</span> <span class="hljs-title function_">run</span><span class="hljs-params">(<span class="hljs-type">double</span> f_adc, <span class="hljs-type">double</span> f_trig, <span class="hljs-type">int</span> samp_cycles, <span class="hljs-type">double</span> seconds)</span> {
  <span class="hljs-type">run_t</span> r = {<span class="hljs-number">0</span>, <span class="hljs-number">0</span>}; dma_idx = <span class="hljs-number">0</span>; n_ch0 = <span class="hljs-number">0</span>; halves_done = <span class="hljs-number">0</span>; half_violation = <span class="hljs-number">0</span>;
  <span class="hljs-type">uint64_t</span> period = (<span class="hljs-type">uint64_t</span>)llround(f_adc / f_trig), conv = (<span class="hljs-type">uint64_t</span>)samp_cycles + <span class="hljs-number">12</span>;
  <span class="hljs-type">uint64_t</span> end = (<span class="hljs-type">uint64_t</span>)(seconds * f_adc), busy_until = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint64_t</span> t = <span class="hljs-number">0</span>; t &lt; end; t += period) {              <span class="hljs-comment">/* each timer update event */</span>
    r.triggers++;
    <span class="hljs-keyword">if</span> (t &lt; busy_until) { r.overruns++; <span class="hljs-keyword">continue</span>; }          <span class="hljs-comment">/* previous scan still running: OVR */</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> ch = <span class="hljs-number">0</span>; ch &lt; NCH; ch++) {
      <span class="hljs-type">uint64_t</span> done = t + (ch + <span class="hljs-number">1</span>) * conv;                   <span class="hljs-comment">/* end of this channel&#x27;s conversion */</span>
      <span class="hljs-keyword">if</span> (ch == <span class="hljs-number">0</span> &amp;&amp; n_ch0 &lt; <span class="hljs-number">4096</span>) ch0_times[n_ch0++] = done;
      buf[dma_idx] = sensor(ch, (t + ch * conv) / f_adc);    <span class="hljs-comment">/* sampled at the start of its window */</span>
      dma_idx++;
      <span class="hljs-keyword">if</span> (dma_idx == NBUF / <span class="hljs-number">2</span>) process_half(<span class="hljs-number">0</span>);              <span class="hljs-comment">/* half-transfer interrupt */</span>
      <span class="hljs-keyword">if</span> (dma_idx == NBUF) { dma_idx = <span class="hljs-number">0</span>; process_half(<span class="hljs-number">1</span>); } <span class="hljs-comment">/* transfer complete, circular wrap */</span>
    }
    busy_until = t + NCH * conv;
  }
  <span class="hljs-keyword">return</span> r;
}
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">const</span> <span class="hljs-type">double</span> f_adc = <span class="hljs-number">84e6</span> / <span class="hljs-number">4</span>;                            <span class="hljs-comment">/* 21 MHz */</span>
  <span class="hljs-type">double</span> t_conv = (<span class="hljs-number">15</span> + <span class="hljs-number">12</span>) / f_adc;
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;t_conv %.3f us, scan %.3f us, max trigger %.1f kHz\\n&quot;</span>, t_conv * <span class="hljs-number">1e6</span>, NCH * t_conv * <span class="hljs-number">1e6</span>, <span class="hljs-number">1</span> / (NCH * t_conv) / <span class="hljs-number">1e3</span>);
  CHECK(<span class="hljs-built_in">fabs</span>(t_conv * <span class="hljs-number">1e6</span> - <span class="hljs-number">1.2857</span>) &lt; <span class="hljs-number">1e-3</span>);

  <span class="hljs-type">run_t</span> r = run(f_adc, <span class="hljs-number">10e3</span>, <span class="hljs-number">15</span>, <span class="hljs-number">0.1</span>);
  CHECK(r.triggers == <span class="hljs-number">1000</span> &amp;&amp; r.overruns == <span class="hljs-number">0</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> k = <span class="hljs-number">1</span>; k &lt; n_ch0; k++) CHECK(ch0_times[k] - ch0_times[k - <span class="hljs-number">1</span>] == <span class="hljs-number">2100</span>);   <span class="hljs-comment">/* exactly 10 kHz */</span>
  <span class="hljs-type">double</span> rate = (n_ch0 - <span class="hljs-number">1</span>) / ((ch0_times[n_ch0 - <span class="hljs-number">1</span>] - ch0_times[<span class="hljs-number">0</span>]) / f_adc);
  CHECK(<span class="hljs-built_in">fabs</span>(rate - <span class="hljs-number">10e3</span>) / <span class="hljs-number">10e3</span> &lt; <span class="hljs-number">1e-9</span>);
  CHECK(halves_done == <span class="hljs-number">1000</span> * NCH / (NBUF / <span class="hljs-number">2</span>) &amp;&amp; !half_violation);
  <span class="hljs-comment">/* channel order in the buffer: slot i holds channel i % 4; channel 3 is a constant 0.25 */</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint32_t</span> i = <span class="hljs-number">3</span>; i &lt; NBUF; i += NCH) CHECK(buf[i] == (<span class="hljs-type">uint16_t</span>)lround(<span class="hljs-number">0.25</span> * <span class="hljs-number">4095</span>));
  CHECK(<span class="hljs-built_in">fabs</span>(avg[<span class="hljs-number">3</span>] - <span class="hljs-number">0.25</span> * <span class="hljs-number">4095</span>) &lt; <span class="hljs-number">0.5</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;10 kHz trigger: %llu scans, sample rate %.3f Hz, %d half-buffers processed, no overrun\\n&quot;</span>,
         (<span class="hljs-type">unsigned</span> <span class="hljs-type">long</span> <span class="hljs-type">long</span>)r.triggers, rate, halves_done);

  <span class="hljs-type">run_t</span> bad = run(f_adc, <span class="hljs-number">250e3</span>, <span class="hljs-number">15</span>, <span class="hljs-number">0.01</span>);                   <span class="hljs-comment">/* trigger every 4 us &lt; 5.14 us scan */</span>
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;250 kHz trigger: %llu of %llu triggers overran\\n&quot;</span>, (<span class="hljs-type">unsigned</span> <span class="hljs-type">long</span> <span class="hljs-type">long</span>)bad.overruns, (<span class="hljs-type">unsigned</span> <span class="hljs-type">long</span> <span class="hljs-type">long</span>)bad.triggers);
  CHECK(bad.overruns &gt; <span class="hljs-number">0</span>);
  <span class="hljs-type">run_t</span> ok = run(f_adc, <span class="hljs-number">150e3</span>, <span class="hljs-number">15</span>, <span class="hljs-number">0.01</span>);
  CHECK(ok.overruns == <span class="hljs-number">0</span>);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>A thermistor divider has a 47 kΩ source impedance and readings are a few percent low with 3-cycle sampling. What do you change and why?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Increase the sampling time (for example to 144 or 480 cycles). The ADC’s sample capacitor (a few pF) charges through the source resistance with time constant <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0077em;">R</span><span class="mord mathnormal" style="margin-right:0.0715em;">C</span></span></span></span>; 12-bit accuracy needs about <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0641em;vertical-align:-0.25em;"></span><span class="mop">ln</span><span class="mopen">(</span><span class="mord"><span class="mord">2</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">13</span></span></span></span></span></span></span></span></span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">9</span></span></span></span> time constants. Alternatively, add a capacitor of around 100 nF at the pin so the charge comes from it, not through the 47 kΩ.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Your HT handler takes 4 ms and the half-buffer lasts 3.2 ms. What happens?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The DMA wraps into the half you’re still reading and overwrites it, so you process a mix of old and new samples, silently. Make the buffer bigger, make the processing faster, or move it out of the interrupt into a task with a deadline. The model’s <code>half_violation</code> check catches this.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l13"></div>

`,i=[{id:`conversion-time`,title:`Conversion time`},{id:`triggers-and-dma`,title:`Triggers and DMA`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l13-q1`,type:`num`,q:`<p>Conversion time in µs with 15-cycle sampling at 21 MHz?</p>
`,explain:`<p>(t_samp + 12)/f_ADC.</p>
`,answer:1.2857,tol:.001,unit:`µs`},{id:`p10-l13-q2`,type:`num`,q:`<p>Fastest trigger rate for a 4-channel scan with that timing, in kHz?</p>
`,explain:`<p>One scan per trigger.</p>
`,answer:194.44,tol:.001,unit:`kHz`},{id:`p10-l13-q3`,type:`num`,q:`<p>A 256-sample circular buffer at 4 channels and 10 kHz. Time between HT and TC interrupts, in ms?</p>
`,explain:`<p>Half the buffer is 32 scans.</p>
`,answer:3.2,tol:.001,unit:`ms`},{id:`p10-l13-q4`,type:`num`,q:`<p>Conversion time in µs with 480-cycle sampling at 21 MHz?</p>
`,explain:`<p>For high-impedance sources.</p>
`,answer:23.43,tol:.001,unit:`µs`},{id:`p10-l13-q5`,type:`mc`,q:`<p>Why trigger the ADC from a timer instead of starting conversions in software?</p>
`,explain:`<p>DSP assumes uniform sampling.</p>
`,options:[`it uses fewer pins`,`the sample instants are as regular as the timer clock, with no software jitter`,`it increases resolution`,`DMA requires it`],answer:1},{id:`p10-l13-q6`,type:`mc`,q:`<p>On a half-transfer interrupt, which part of the buffer should the CPU process?</p>
`,explain:`<p>Double buffering.</p>
`,options:[`the second half`,`the first half, while the DMA fills the second`,`the whole buffer`,`nothing until TC`],answer:1}],o=[{file:`adc_dma.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14159265358979323846
#define NCH 4
#define SCANS 64
#define NBUF (NCH * SCANS)

static uint16_t buf[NBUF];
static uint32_t dma_idx;                                   /* next slot the DMA will write */
static uint64_t ch0_times[4096]; static uint32_t n_ch0;
static int halves_done, half_violation;
static double avg[NCH];

static uint16_t sensor(int ch, double t) {                  /* four test signals, 12-bit */
  if (ch == 3) return (uint16_t)lround(0.25 * 4095);       /* channel 3: a constant reference */
  return (uint16_t)lround((0.5 + 0.4 * sin(2 * PI * 50.0 * (ch + 1) * t)) * 4095);
}
static void process_half(int which) {                       /* runs on HT (which = 0) or TC (which = 1) */
  uint32_t lo = which * NBUF / 2, hi = lo + NBUF / 2;
  if (dma_idx >= lo && dma_idx < hi) half_violation = 1;    /* DMA must be in the other half */
  double s[NCH] = {0};
  for (uint32_t i = lo; i < hi; i++) s[i % NCH] += buf[i];
  for (int c = 0; c < NCH; c++) avg[c] = s[c] / (SCANS / 2);
  halves_done++;
}

typedef struct { uint64_t triggers, overruns; } run_t;
static run_t run(double f_adc, double f_trig, int samp_cycles, double seconds) {
  run_t r = {0, 0}; dma_idx = 0; n_ch0 = 0; halves_done = 0; half_violation = 0;
  uint64_t period = (uint64_t)llround(f_adc / f_trig), conv = (uint64_t)samp_cycles + 12;
  uint64_t end = (uint64_t)(seconds * f_adc), busy_until = 0;
  for (uint64_t t = 0; t < end; t += period) {              /* each timer update event */
    r.triggers++;
    if (t < busy_until) { r.overruns++; continue; }          /* previous scan still running: OVR */
    for (int ch = 0; ch < NCH; ch++) {
      uint64_t done = t + (ch + 1) * conv;                   /* end of this channel's conversion */
      if (ch == 0 && n_ch0 < 4096) ch0_times[n_ch0++] = done;
      buf[dma_idx] = sensor(ch, (t + ch * conv) / f_adc);    /* sampled at the start of its window */
      dma_idx++;
      if (dma_idx == NBUF / 2) process_half(0);              /* half-transfer interrupt */
      if (dma_idx == NBUF) { dma_idx = 0; process_half(1); } /* transfer complete, circular wrap */
    }
    busy_until = t + NCH * conv;
  }
  return r;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double f_adc = 84e6 / 4;                            /* 21 MHz */
  double t_conv = (15 + 12) / f_adc;
  printf("t_conv %.3f us, scan %.3f us, max trigger %.1f kHz\\n", t_conv * 1e6, NCH * t_conv * 1e6, 1 / (NCH * t_conv) / 1e3);
  CHECK(fabs(t_conv * 1e6 - 1.2857) < 1e-3);

  run_t r = run(f_adc, 10e3, 15, 0.1);
  CHECK(r.triggers == 1000 && r.overruns == 0);
  for (uint32_t k = 1; k < n_ch0; k++) CHECK(ch0_times[k] - ch0_times[k - 1] == 2100);   /* exactly 10 kHz */
  double rate = (n_ch0 - 1) / ((ch0_times[n_ch0 - 1] - ch0_times[0]) / f_adc);
  CHECK(fabs(rate - 10e3) / 10e3 < 1e-9);
  CHECK(halves_done == 1000 * NCH / (NBUF / 2) && !half_violation);
  /* channel order in the buffer: slot i holds channel i % 4; channel 3 is a constant 0.25 */
  for (uint32_t i = 3; i < NBUF; i += NCH) CHECK(buf[i] == (uint16_t)lround(0.25 * 4095));
  CHECK(fabs(avg[3] - 0.25 * 4095) < 0.5);
  printf("10 kHz trigger: %llu scans, sample rate %.3f Hz, %d half-buffers processed, no overrun\\n",
         (unsigned long long)r.triggers, rate, halves_done);

  run_t bad = run(f_adc, 250e3, 15, 0.01);                   /* trigger every 4 us < 5.14 us scan */
  printf("250 kHz trigger: %llu of %llu triggers overran\\n", (unsigned long long)bad.overruns, (unsigned long long)bad.triggers);
  CHECK(bad.overruns > 0);
  run_t ok = run(f_adc, 150e3, 15, 0.01);
  CHECK(ok.overruns == 0);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};