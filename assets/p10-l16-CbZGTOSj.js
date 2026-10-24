var e=`p10-l16`,t=35,n=`A battery-powered sensor node spends almost all its life asleep, so its battery life is set by the sleep current and by how short and rare the wake-ups are. You derive the average current as a duty-weighted sum, account for wake-up overheads and battery derating, implement an RTC-alarm sleep and wake state machine, and test that a simulated year of operation matches the formula and meets a five-year target.`,r=`<h2 id="average-current-is-a-weighted-sum">Average current is a weighted sum</h2>
<p>A node that measures, transmits and sleeps draws a current profile with a few short, high spikes and a long, low floor. Over one period <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span></span>, each state <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6595em;"></span><span class="mord mathnormal">i</span></span></span></span> lasts <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7651em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span> at current <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span>, so</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8201em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1389em;"><span class="mord">ˉ</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.5991em;vertical-align:-1.2777em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8723em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.2777em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.3277em;vertical-align:-1.2777em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8723em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.2777em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0785em;">I</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0785em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:-0.0278em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.9781em;vertical-align:-0.686em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.2921em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.1389em;">T</span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord"><span class="mord mathnormal">t</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3117em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.686em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord">.</span></span></span></span></span></div>
<p>Battery life is capacity over average current, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal">L</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0701em;vertical-align:-0.25em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0715em;">C</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3361em;"><span style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord text mtight"><span class="mord mtight">usable</span></span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mord">/</span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1389em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span>. Two consequences surprise people:</p>
<ul>
<li>the <strong>sleep current dominates</strong> once wake-ups are rare. A 3 µA floor is 26 mAh per year, whatever the active current;</li>
<li><strong>wake-up overheads</strong> count: oscillator start-up, regulator settling, sensor warm-up and radio calibration can cost more charge than the useful work.</li>
</ul>
<h2 id="low-power-modes-on-a-cortex-m-mcu">Low-power modes on a Cortex-M MCU</h2>
<p>Executing <code>WFI</code> (wait for interrupt) stops the core clock until an interrupt: that’s <strong>Sleep</strong>, saving maybe half the run current. Deeper modes stop more. On an STM32, <strong>Stop</strong> halts all high-speed clocks and keeps RAM and registers, drawing microamps to tens of microamps depending on the part, and <strong>Standby</strong> turns off almost everything, losing RAM, so waking is a reset. The real-time clock (RTC), running from a 32.768 kHz crystal, keeps time in all of them and its <strong>alarm</strong> is the wake-up source. On wake from Stop the system clock is the internal oscillator again, so the firmware must restore the PLL (lesson 07) before using timing-critical peripherals.</p>
<p>The exact currents depend on the part and are in its datasheet. The numbers below are an illustrative budget, not a specific chip’s.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="powerprofile" data-args="{}"></div></div><figcaption>Current over one wake-up cycle on a log scale, with the charge of each phase. Change the reporting interval and the sleep current: the battery-life estimate follows the duty-weighted sum.</figcaption></figure>
<h2 id="usable-capacity">Usable capacity</h2>
<p>The label capacity isn’t all usable. Derate for the cutoff voltage your regulator needs, for temperature (cold batteries deliver less), for self-discharge (a few percent per year for alkaline and lithium primary cells), and for high pulse currents if the radio’s peaks are large compared with what the cell likes. Treat 70–80 % of the nominal capacity as a planning number, then measure.</p>
<h2 id="worked-example">Worked example</h2>
<p>A node wakes every 60 s on an RTC alarm. Budget (illustrative):</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>phase</th>
<th>current</th>
<th>time</th>
</tr>
</thead>
<tbody><tr>
<td>wake-up (clock and regulator start)</td>
<td>3 mA</td>
<td>2 ms</td>
</tr>
<tr>
<td>measure</td>
<td>5 mA</td>
<td>20 ms</td>
</tr>
<tr>
<td>radio transmit (every 10th wake-up)</td>
<td>20 mA</td>
<td>30 ms</td>
</tr>
<tr>
<td>sleep (Stop + RTC)</td>
<td>3 µA</td>
<td>rest</td>
</tr>
</tbody></table></div>
<ol>
<li>Charge per wake-up without radio: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">106</span></span></span></span> µC (mA·ms).</li>
<li>Radio averaged: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">20</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">⋅</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">30/10</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">60</span></span></span></span> µC per wake-up.</li>
<li>Sleep: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8778em;vertical-align:-0.1944em;"></span><span class="mord">3</span><span class="mspace">\xA0</span><span class="mord mathnormal">μ</span><span class="mord text"><span class="mord">A</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">59.978</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">s</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">≈</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">180</span></span></span></span> µC.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8201em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1389em;"><span class="mord">ˉ</span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">(</span><span class="mord">106</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">60</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">180</span><span class="mclose">)</span><span class="mord">/60</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">s</span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">5.76</span></span></span></span> µA.</li>
<li>A 2400 mAh pack derated to 75 % (1800 mAh) lasts <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">1800/0.00576</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">312</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">000</span></span></span></span> h, 35.6 years: the battery’s shelf life, not the electronics, becomes the limit. With a 30 µA sleep current instead, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8201em;"></span><span class="mord katex-accent"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8201em;"><span style="top:-3em;"><span class="pstrut" style="height:3em;"></span><span class="mord mathnormal" style="margin-right:0.0785em;">I</span></span><span style="top:-3.2523em;"><span class="pstrut" style="height:3em;"></span><span class="accent-body" style="left:-0.1389em;"><span class="mord">ˉ</span></span></span></span></span></span></span></span></span></span> = 32.8 µA and the life is 6.3 years.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">low_power.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>

<span class="hljs-comment">/* illustrative budget; replace with your part&#x27;s datasheet and your measurements */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">double</span> i_wake_ma, t_wake_ms, i_meas_ma, t_meas_ms, i_tx_ma, t_tx_ms, i_sleep_ua; <span class="hljs-type">int</span> tx_every; <span class="hljs-type">double</span> period_s; } <span class="hljs-type">budget_t</span>;

<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">avg_current_ua</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">budget_t</span> *b)</span> {                 <span class="hljs-comment">/* the duty-weighted sum */</span>
  <span class="hljs-type">double</span> q_uc = b-&gt;i_wake_ma * b-&gt;t_wake_ms + b-&gt;i_meas_ma * b-&gt;t_meas_ms + b-&gt;i_tx_ma * b-&gt;t_tx_ms / b-&gt;tx_every;
  <span class="hljs-type">double</span> t_awake_ms = b-&gt;t_wake_ms + b-&gt;t_meas_ms + b-&gt;t_tx_ms / b-&gt;tx_every;
  q_uc += b-&gt;i_sleep_ua * (b-&gt;period_s * <span class="hljs-number">1e3</span> - t_awake_ms) / <span class="hljs-number">1e3</span>;
  <span class="hljs-keyword">return</span> q_uc / b-&gt;period_s;
}

<span class="hljs-comment">/* state machine driven by an RTC alarm, integrated in 1 ms steps */</span>
<span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> SLEEP, WAKE, MEASURE, TX };
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">simulate_ua</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">budget_t</span> *b, <span class="hljs-type">double</span> seconds)</span> {
  <span class="hljs-type">int</span> state = SLEEP; <span class="hljs-type">double</span> t_in = <span class="hljs-number">0</span>, charge_uc = <span class="hljs-number">0</span>; <span class="hljs-type">uint64_t</span> wakes = <span class="hljs-number">0</span>;
  <span class="hljs-type">uint64_t</span> steps = (<span class="hljs-type">uint64_t</span>)(seconds * <span class="hljs-number">1000</span>), alarm = (<span class="hljs-type">uint64_t</span>)(b-&gt;period_s * <span class="hljs-number">1000</span>), next_alarm = alarm;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">uint64_t</span> ms = <span class="hljs-number">0</span>; ms &lt; steps; ms++) {
    <span class="hljs-keyword">if</span> (state == SLEEP &amp;&amp; ms == next_alarm) { state = WAKE; t_in = <span class="hljs-number">0</span>; wakes++; next_alarm += alarm; }   <span class="hljs-comment">/* RTC alarm IRQ */</span>
    <span class="hljs-type">double</span> i_ma = state == SLEEP ? b-&gt;i_sleep_ua / <span class="hljs-number">1000</span> : state == WAKE ? b-&gt;i_wake_ma : state == MEASURE ? b-&gt;i_meas_ma : b-&gt;i_tx_ma;
    charge_uc += i_ma;                                          <span class="hljs-comment">/* mA x 1 ms = 1 uC */</span>
    t_in += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (state == WAKE &amp;&amp; t_in &gt;= b-&gt;t_wake_ms) { state = MEASURE; t_in = <span class="hljs-number">0</span>; }
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (state == MEASURE &amp;&amp; t_in &gt;= b-&gt;t_meas_ms) { state = (wakes % b-&gt;tx_every == <span class="hljs-number">0</span>) ? TX : SLEEP; t_in = <span class="hljs-number">0</span>; }
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (state == TX &amp;&amp; t_in &gt;= b-&gt;t_tx_ms) { state = SLEEP; t_in = <span class="hljs-number">0</span>; }   <span class="hljs-comment">/* WFI in Stop mode */</span>
  }
  <span class="hljs-keyword">return</span> charge_uc / seconds;
}
<span class="hljs-type">static</span> <span class="hljs-type">double</span> <span class="hljs-title function_">life_years</span><span class="hljs-params">(<span class="hljs-type">double</span> capacity_mah, <span class="hljs-type">double</span> derate, <span class="hljs-type">double</span> i_ua)</span> { <span class="hljs-keyword">return</span> capacity_mah * derate / (i_ua / <span class="hljs-number">1000</span>) / <span class="hljs-number">8766</span>; }
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">budget_t</span> b = {<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">20</span>, <span class="hljs-number">20</span>, <span class="hljs-number">30</span>, <span class="hljs-number">3</span>, <span class="hljs-number">10</span>, <span class="hljs-number">60</span>};
  <span class="hljs-type">double</span> formula = avg_current_ua(&amp;b), sim = simulate_ua(&amp;b, <span class="hljs-number">86400</span>);   <span class="hljs-comment">/* one day */</span>
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;formula %.3f uA, simulated day %.3f uA\\n&quot;</span>, formula, sim);
  CHECK(<span class="hljs-built_in">fabs</span>(formula - <span class="hljs-number">5.764</span>) &lt; <span class="hljs-number">0.01</span>);
  CHECK(<span class="hljs-built_in">fabs</span>(sim - formula) / formula &lt; <span class="hljs-number">0.01</span>);                 <span class="hljs-comment">/* the state machine agrees with the sum */</span>
  <span class="hljs-type">double</span> years = life_years(<span class="hljs-number">2400</span>, <span class="hljs-number">0.75</span>, formula);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;2400 mAh x 0.75 -&gt; %.1f years\\n&quot;</span>, years);
  CHECK(years &gt;= <span class="hljs-number">5</span>);                                           <span class="hljs-comment">/* target: 5 years */</span>

  <span class="hljs-type">budget_t</span> leaky = b; leaky.i_sleep_ua = <span class="hljs-number">30</span>;                   <span class="hljs-comment">/* a floating pin or a regulator&#x27;s quiescent current */</span>
  <span class="hljs-type">double</span> y2 = life_years(<span class="hljs-number">2400</span>, <span class="hljs-number">0.75</span>, avg_current_ua(&amp;leaky));
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;with 30 uA sleep: %.2f uA, %.1f years\\n&quot;</span>, avg_current_ua(&amp;leaky), y2);
  CHECK(y2 &gt;= <span class="hljs-number">5</span> &amp;&amp; y2 &lt; <span class="hljs-number">7</span>);

  <span class="hljs-type">budget_t</span> chatty = b; chatty.tx_every = <span class="hljs-number">1</span>; chatty.period_s = <span class="hljs-number">5</span>;   <span class="hljs-comment">/* transmit every 5 s */</span>
  <span class="hljs-type">double</span> y3 = life_years(<span class="hljs-number">2400</span>, <span class="hljs-number">0.75</span>, avg_current_ua(&amp;chatty));
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;transmit every 5 s: %.1f uA, %.2f years -&gt; misses the target\\n&quot;</span>, avg_current_ua(&amp;chatty), y3);
  CHECK(y3 &lt; <span class="hljs-number">5</span>);
  <span class="hljs-comment">/* largest reporting rate that still meets 5 years with the base budget */</span>
  <span class="hljs-type">double</span> best = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">double</span> p = <span class="hljs-number">1</span>; p &lt;= <span class="hljs-number">600</span>; p += <span class="hljs-number">1</span>) { <span class="hljs-type">budget_t</span> t = b; t.period_s = p; t.tx_every = <span class="hljs-number">1</span>; <span class="hljs-keyword">if</span> (life_years(<span class="hljs-number">2400</span>, <span class="hljs-number">0.75</span>, avg_current_ua(&amp;t)) &gt;= <span class="hljs-number">5</span>) { best = p; <span class="hljs-keyword">break</span>; } }
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;shortest interval with a transmission every wake-up that meets 5 years: %.0f s\\nPASS\\n&quot;</span>, best);
  CHECK(best &gt; <span class="hljs-number">5</span> &amp;&amp; best &lt; <span class="hljs-number">60</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Measurements show 400 µA in “sleep” instead of 3 µA. Name three likely causes.</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>A GPIO left floating (an input with no pull, toggling with noise, makes its input buffer draw current), a peripheral or its clock left on (an ADC, a debug interface, a timer), and external parts: a sensor not put into power-down, an LED, a pull-up holding a line low, or a linear regulator’s quiescent current. Measure with everything but the MCU disconnected, then add parts back.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the wake-up phase deserve its own line in the budget?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>Waking from Stop means restarting the high-speed oscillator and possibly the PLL, waiting for the regulator, and re-initialising peripherals, all at run current but with no useful work. With frequent wake-ups this overhead can rival the measurement. Batch work into fewer wake-ups when you can.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p10-l16"></div>

`,i=[{id:`average-current-is-a-weighted-sum`,title:`Average current is a weighted sum`},{id:`low-power-modes-on-a-cortex-m-mcu`,title:`Low-power modes on a Cortex-M MCU`},{id:`usable-capacity`,title:`Usable capacity`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p10-l16-q1`,type:`num`,q:`<p>Average current in µA for 5 mA for 20 ms every 60 s, with 3 µA otherwise?</p>
`,explain:`<p>Duty-weighted sum.</p>
`,answer:4.666,tol:.001,unit:`µA`},{id:`p10-l16-q2`,type:`num`,q:`<p>Charge per year in mAh drawn by a 3 µA sleep current?</p>
`,explain:`<p>3 µA × 8766 h.</p>
`,answer:26.3,tol:.002,unit:`mAh`},{id:`p10-l16-q3`,type:`num`,q:`<p>Life in years of 1800 mAh at 32.8 µA?</p>
`,explain:`<p>Capacity over current.</p>
`,answer:6.26,tol:.002,unit:`years`},{id:`p10-l16-q4`,type:`num`,q:`<p>Duty cycle in percent of a 22 ms wake-up every 60 s?</p>
`,explain:`<p>Awake for a tiny fraction of the time.</p>
`,answer:.0367,tol:.002,unit:`%`},{id:`p10-l16-q5`,type:`mc`,q:`<p>When wake-ups are rare, battery life is set mainly by…</p>
`,explain:`<p>The floor is on for almost all of the time.</p>
`,options:[`the run current`,`the sleep current`,`the CPU frequency`,`the flash size`],answer:1},{id:`p10-l16-q6`,type:`mc`,q:`<p>After waking from Stop mode on an STM32, what must the firmware usually redo first?</p>
`,explain:`<p>Stop mode returns on the internal oscillator.</p>
`,options:[`reload the vector table`,`restore the system clock (HSE and PLL)`,`copy .data again`,`erase flash`],answer:1}],o=[{file:`low_power.c`,lang:`c`,src:`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* illustrative budget; replace with your part's datasheet and your measurements */
typedef struct { double i_wake_ma, t_wake_ms, i_meas_ma, t_meas_ms, i_tx_ma, t_tx_ms, i_sleep_ua; int tx_every; double period_s; } budget_t;

static double avg_current_ua(const budget_t *b) {                 /* the duty-weighted sum */
  double q_uc = b->i_wake_ma * b->t_wake_ms + b->i_meas_ma * b->t_meas_ms + b->i_tx_ma * b->t_tx_ms / b->tx_every;
  double t_awake_ms = b->t_wake_ms + b->t_meas_ms + b->t_tx_ms / b->tx_every;
  q_uc += b->i_sleep_ua * (b->period_s * 1e3 - t_awake_ms) / 1e3;
  return q_uc / b->period_s;
}

/* state machine driven by an RTC alarm, integrated in 1 ms steps */
enum { SLEEP, WAKE, MEASURE, TX };
static double simulate_ua(const budget_t *b, double seconds) {
  int state = SLEEP; double t_in = 0, charge_uc = 0; uint64_t wakes = 0;
  uint64_t steps = (uint64_t)(seconds * 1000), alarm = (uint64_t)(b->period_s * 1000), next_alarm = alarm;
  for (uint64_t ms = 0; ms < steps; ms++) {
    if (state == SLEEP && ms == next_alarm) { state = WAKE; t_in = 0; wakes++; next_alarm += alarm; }   /* RTC alarm IRQ */
    double i_ma = state == SLEEP ? b->i_sleep_ua / 1000 : state == WAKE ? b->i_wake_ma : state == MEASURE ? b->i_meas_ma : b->i_tx_ma;
    charge_uc += i_ma;                                          /* mA x 1 ms = 1 uC */
    t_in += 1;
    if (state == WAKE && t_in >= b->t_wake_ms) { state = MEASURE; t_in = 0; }
    else if (state == MEASURE && t_in >= b->t_meas_ms) { state = (wakes % b->tx_every == 0) ? TX : SLEEP; t_in = 0; }
    else if (state == TX && t_in >= b->t_tx_ms) { state = SLEEP; t_in = 0; }   /* WFI in Stop mode */
  }
  return charge_uc / seconds;
}
static double life_years(double capacity_mah, double derate, double i_ua) { return capacity_mah * derate / (i_ua / 1000) / 8766; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  budget_t b = {3, 2, 5, 20, 20, 30, 3, 10, 60};
  double formula = avg_current_ua(&b), sim = simulate_ua(&b, 86400);   /* one day */
  printf("formula %.3f uA, simulated day %.3f uA\\n", formula, sim);
  CHECK(fabs(formula - 5.764) < 0.01);
  CHECK(fabs(sim - formula) / formula < 0.01);                 /* the state machine agrees with the sum */
  double years = life_years(2400, 0.75, formula);
  printf("2400 mAh x 0.75 -> %.1f years\\n", years);
  CHECK(years >= 5);                                           /* target: 5 years */

  budget_t leaky = b; leaky.i_sleep_ua = 30;                   /* a floating pin or a regulator's quiescent current */
  double y2 = life_years(2400, 0.75, avg_current_ua(&leaky));
  printf("with 30 uA sleep: %.2f uA, %.1f years\\n", avg_current_ua(&leaky), y2);
  CHECK(y2 >= 5 && y2 < 7);

  budget_t chatty = b; chatty.tx_every = 1; chatty.period_s = 5;   /* transmit every 5 s */
  double y3 = life_years(2400, 0.75, avg_current_ua(&chatty));
  printf("transmit every 5 s: %.1f uA, %.2f years -> misses the target\\n", avg_current_ua(&chatty), y3);
  CHECK(y3 < 5);
  /* largest reporting rate that still meets 5 years with the base budget */
  double best = 0;
  for (double p = 1; p <= 600; p += 1) { budget_t t = b; t.period_s = p; t.tx_every = 1; if (life_years(2400, 0.75, avg_current_ua(&t)) >= 5) { best = p; break; } }
  printf("shortest interval with a transmission every wake-up that meets 5 years: %.0f s\\nPASS\\n", best);
  CHECK(best > 5 && best < 60);
  return 0;
}`}],s={id:e,minutes:35,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};