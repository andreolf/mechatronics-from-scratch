var e=`p11-l07`,t=40,n=`A sensor driver is mostly a register map, a burst read and some scaling, and it’s testable on a laptop if every bus access goes through a small HAL interface. You derive the scale factors and the burst-read reasoning for an MPU-6050-style IMU, write the driver against a HAL, and test it by replaying recorded register dumps that check both the bytes it decodes and every transaction it makes.`,r=`<h2 id="register-maps">Register maps</h2>
<p>An I2C sensor looks like a small array of 8-bit registers. For the MPU-6050, a common six-axis IMU, the datasheet’s register map gives:</p>
<div class="table-scroll"><table>
<thead>
<tr>
<th>register</th>
<th>address</th>
<th>meaning</th>
</tr>
</thead>
<tbody><tr>
<td>GYRO_CONFIG</td>
<td>0x1B</td>
<td>bits 4:3 select ±250, ±500, ±1000 or ±2000 °/s</td>
</tr>
<tr>
<td>ACCEL_CONFIG</td>
<td>0x1C</td>
<td>bits 4:3 select ±2, ±4, ±8 or ±16 g</td>
</tr>
<tr>
<td>ACCEL_XOUT_H … GYRO_ZOUT_L</td>
<td>0x3B–0x48</td>
<td>14 bytes: accel X, Y, Z, temperature, gyro X, Y, Z, each 16-bit signed, high byte first</td>
</tr>
<tr>
<td>PWR_MGMT_1</td>
<td>0x6B</td>
<td>bit 6 = SLEEP (set at power-up); clock source in bits 2:0</td>
</tr>
<tr>
<td>WHO_AM_I</td>
<td>0x75</td>
<td>reads 0x68</td>
</tr>
</tbody></table></div>
<p>The driver’s job: check WHO_AM_I so a wrong or missing part fails loudly, wake the chip, set the ranges, then read and scale samples.</p>
<h2 id="scaling">Scaling</h2>
<p>A 16-bit signed reading spans ±32 768 counts over the full-scale range, so the sensitivity is</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.2019em;vertical-align:-0.8804em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.3214em;"><span style="top:-2.314em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord text"><span class="mord">range</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.677em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">32768</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.8804em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">:</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">16384</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">LSB/g\xA0at\xA0</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">±</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">2</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mpunct">,</span><span class="mspace" style="margin-right:1em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">131</span><span class="mspace">\xA0</span><span class="mord text"><span class="mord">LSB/(°/s)\xA0at\xA0</span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">±</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">250</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">°/</span><span class="mord mathnormal">s</span><span class="mord">.</span></span></span></span></span></div>
<p>The datasheet rounds some of these (65.5, 32.8, 16.4 for the gyro). The temperature is <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord text"><span class="mord">raw</span></span><span class="mord">/340</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">36.53</span></span></span></span> °C. At rest, the accelerometer measures the reaction to gravity, so roll and pitch follow from it:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">ϕ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mop"><span class="mord mathrm">atan2</span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.044em;">z</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0278em;">θ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.8624em;vertical-align:-0.65em;"></span><span class="mop"><span class="mord mathrm">atan2</span></span><span class="mspace" style="margin-right:-0.1667em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size2">(</span></span><span class="mord">−</span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.2124em;"><span class="svg-align" style="top:-3.8em;"><span class="pstrut" style="height:3.8em;"></span><span class="mord" style="padding-left:1em;"><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.453em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3831em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.453em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.044em;">z</span></span></span><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.1724em;"><span class="pstrut" style="height:3.8em;"></span><span class="hide-tail" style="min-width:1.02em;height:1.88em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.88em" viewBox="0 0 400000 1944" preserveAspectRatio="xMinYMin slice"><path d="M983 90
l0 -0
c4,-6.7,10,-10,18,-10 H400000v40
H1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7
s-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744
c-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30
c26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722
c56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5
c53.7,-170.3,84.5,-266.8,92.5,-289.5z
M1001 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.6276em;"><span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size2">)</span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">.</span></span></span></span></span></div>
<h2 id="why-one-burst-read">Why one burst read</h2>
<p>The chip updates its output registers at the sample rate. If you read ACCEL_XOUT_H, then ACCEL_XOUT_L in a separate transaction, a new sample can land in between and you get the high byte of one sample with the low byte of the next: a torn value that can be off by 255 counts. The chip latches the output registers during a single burst read, so one 14-byte read gives a consistent snapshot of all seven values. It’s also 4× fewer bus transactions.</p>
<h2 id="a-hal-for-testability">A HAL for testability</h2>
<p>The driver never touches the I2C peripheral directly. It calls two functions through a struct, <code>read(reg, buf, n)</code> and <code>write(reg, value)</code>. On the target they call the I2C driver; on a laptop they replay a <strong>recorded register dump</strong>: a script of the exact transactions a real chip produced, captured once with a logic analyser or a debug print. The test then checks the decoded values and that the driver made exactly the expected accesses, in order.</p>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="imuaxes" data-args="{}"></div></div><figcaption>Body axes of the IMU with the measured gravity vector. Tilt the board to see the raw counts, the scaled values in g and the roll and pitch computed from them; change the full-scale range to see the counts per g change.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>A recorded burst at ±8 g gives accel bytes <code>00 00 08 00 0D DB</code> and temperature <code>F0 B0</code>.</p>
<ol>
<li>Sensitivity at ±8 g is 32 768/8 = 4096 LSB/g.</li>
<li><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7167em;vertical-align:-0.2861em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">0800</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">2048</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8389em;vertical-align:-0.1944em;"></span><span class="mord">0.5</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span></span></span></span>, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.5806em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.044em;">z</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord">0</span><span class="mord mathnormal">x</span><span class="mord">0</span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal" style="margin-right:0.0278em;">D</span><span class="mord mathnormal" style="margin-right:0.0502em;">B</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">3547</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">→</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8389em;vertical-align:-0.1944em;"></span><span class="mord">0.866</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span></span></span></span>.</li>
<li>Roll <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8889em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">ϕ</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mop"><span class="mord mathrm">atan2</span></span><span class="mopen">(</span><span class="mord">0.5</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord">0.866</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">30.0°</span></span></span></span>, pitch 0.</li>
<li>Temperature raw 0xF0B0 = −3920, so <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.1389em;">T</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord">−</span><span class="mord">3920/340</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">36.53</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">25.0</span></span></span></span> °C.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">imu.c</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-c"><span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;math.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdint.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdio.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;stdlib.h&gt;</span></span>
<span class="hljs-meta">#<span class="hljs-keyword">include</span> <span class="hljs-string">&lt;string.h&gt;</span></span>

<span class="hljs-comment">/* ---------- the HAL interface the driver depends on ---------- */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span>
  <span class="hljs-type">int</span> (*read)(<span class="hljs-type">void</span> *ctx, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">uint8_t</span> *buf, <span class="hljs-type">int</span> n);   <span class="hljs-comment">/* 0 on success */</span>
  <span class="hljs-type">int</span> (*write)(<span class="hljs-type">void</span> *ctx, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">uint8_t</span> value);
  <span class="hljs-type">void</span> *ctx;
} <span class="hljs-type">imu_hal_t</span>;

<span class="hljs-comment">/* ---------- the driver ---------- */</span>
<span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> REG_GYRO_CONFIG = <span class="hljs-number">0x1B</span>, REG_ACCEL_CONFIG = <span class="hljs-number">0x1C</span>, REG_ACCEL_XOUT_H = <span class="hljs-number">0x3B</span>, REG_PWR_MGMT_1 = <span class="hljs-number">0x6B</span>, REG_WHO_AM_I = <span class="hljs-number">0x75</span> };
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">enum</span> {</span> IMU_OK = <span class="hljs-number">0</span>, IMU_EBUS = <span class="hljs-number">-1</span>, IMU_EID = <span class="hljs-number">-2</span>, IMU_ERANGE = <span class="hljs-number">-3</span> } <span class="hljs-type">imu_err_t</span>;
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">imu_hal_t</span> hal; <span class="hljs-type">float</span> accel_lsb_per_g, gyro_lsb_per_dps; } <span class="hljs-type">imu_t</span>;
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">float</span> ax, ay, az, temp_c, gx, gy, gz; } <span class="hljs-type">imu_sample_t</span>;

<span class="hljs-type">static</span> <span class="hljs-type">imu_err_t</span> <span class="hljs-title function_">imu_init</span><span class="hljs-params">(<span class="hljs-type">imu_t</span> *imu, <span class="hljs-type">imu_hal_t</span> hal, <span class="hljs-type">int</span> accel_g, <span class="hljs-type">int</span> gyro_dps)</span> {
  <span class="hljs-type">static</span> <span class="hljs-type">const</span> <span class="hljs-type">int</span> ag[<span class="hljs-number">4</span>] = {<span class="hljs-number">2</span>, <span class="hljs-number">4</span>, <span class="hljs-number">8</span>, <span class="hljs-number">16</span>}, gd[<span class="hljs-number">4</span>] = {<span class="hljs-number">250</span>, <span class="hljs-number">500</span>, <span class="hljs-number">1000</span>, <span class="hljs-number">2000</span>};
  <span class="hljs-type">int</span> ai = <span class="hljs-number">-1</span>, gi = <span class="hljs-number">-1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">4</span>; i++) { <span class="hljs-keyword">if</span> (ag[i] == accel_g) ai = i; <span class="hljs-keyword">if</span> (gd[i] == gyro_dps) gi = i; }
  <span class="hljs-keyword">if</span> (ai &lt; <span class="hljs-number">0</span> || gi &lt; <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> IMU_ERANGE;
  imu-&gt;hal = hal;
  <span class="hljs-type">uint8_t</span> id;
  <span class="hljs-keyword">if</span> (hal.read(hal.ctx, REG_WHO_AM_I, &amp;id, <span class="hljs-number">1</span>)) <span class="hljs-keyword">return</span> IMU_EBUS;
  <span class="hljs-keyword">if</span> (id != <span class="hljs-number">0x68</span>) <span class="hljs-keyword">return</span> IMU_EID;
  <span class="hljs-keyword">if</span> (hal.write(hal.ctx, REG_PWR_MGMT_1, <span class="hljs-number">0x01</span>)) <span class="hljs-keyword">return</span> IMU_EBUS;        <span class="hljs-comment">/* wake, clock from the X gyro PLL */</span>
  <span class="hljs-keyword">if</span> (hal.write(hal.ctx, REG_ACCEL_CONFIG, (<span class="hljs-type">uint8_t</span>)(ai &lt;&lt; <span class="hljs-number">3</span>))) <span class="hljs-keyword">return</span> IMU_EBUS;
  <span class="hljs-keyword">if</span> (hal.write(hal.ctx, REG_GYRO_CONFIG, (<span class="hljs-type">uint8_t</span>)(gi &lt;&lt; <span class="hljs-number">3</span>))) <span class="hljs-keyword">return</span> IMU_EBUS;
  imu-&gt;accel_lsb_per_g = <span class="hljs-number">32768.0f</span> / (<span class="hljs-type">float</span>)accel_g;
  imu-&gt;gyro_lsb_per_dps = <span class="hljs-number">32768.0f</span> / (<span class="hljs-type">float</span>)gyro_dps;
  <span class="hljs-keyword">return</span> IMU_OK;
}
<span class="hljs-type">static</span> <span class="hljs-type">int16_t</span> <span class="hljs-title function_">be16</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">uint8_t</span> *p)</span> { <span class="hljs-keyword">return</span> (<span class="hljs-type">int16_t</span>)((<span class="hljs-type">uint16_t</span>)p[<span class="hljs-number">0</span>] &lt;&lt; <span class="hljs-number">8</span> | p[<span class="hljs-number">1</span>]); }
<span class="hljs-type">static</span> <span class="hljs-type">imu_err_t</span> <span class="hljs-title function_">imu_read</span><span class="hljs-params">(<span class="hljs-type">imu_t</span> *imu, <span class="hljs-type">imu_sample_t</span> *s)</span> {
  <span class="hljs-type">uint8_t</span> b[<span class="hljs-number">14</span>];
  <span class="hljs-keyword">if</span> (imu-&gt;hal.read(imu-&gt;hal.ctx, REG_ACCEL_XOUT_H, b, <span class="hljs-number">14</span>)) <span class="hljs-keyword">return</span> IMU_EBUS;   <span class="hljs-comment">/* one burst: a consistent snapshot */</span>
  s-&gt;ax = be16(b + <span class="hljs-number">0</span>) / imu-&gt;accel_lsb_per_g; s-&gt;ay = be16(b + <span class="hljs-number">2</span>) / imu-&gt;accel_lsb_per_g; s-&gt;az = be16(b + <span class="hljs-number">4</span>) / imu-&gt;accel_lsb_per_g;
  s-&gt;temp_c = be16(b + <span class="hljs-number">6</span>) / <span class="hljs-number">340.0f</span> + <span class="hljs-number">36.53f</span>;
  s-&gt;gx = be16(b + <span class="hljs-number">8</span>) / imu-&gt;gyro_lsb_per_dps; s-&gt;gy = be16(b + <span class="hljs-number">10</span>) / imu-&gt;gyro_lsb_per_dps; s-&gt;gz = be16(b + <span class="hljs-number">12</span>) / imu-&gt;gyro_lsb_per_dps;
  <span class="hljs-keyword">return</span> IMU_OK;
}
<span class="hljs-type">static</span> <span class="hljs-type">void</span> <span class="hljs-title function_">imu_tilt</span><span class="hljs-params">(<span class="hljs-type">const</span> <span class="hljs-type">imu_sample_t</span> *s, <span class="hljs-type">float</span> *roll_deg, <span class="hljs-type">float</span> *pitch_deg)</span> {
  *roll_deg = atan2f(s-&gt;ay, s-&gt;az) * <span class="hljs-number">57.29578f</span>;
  *pitch_deg = atan2f(-s-&gt;ax, sqrtf(s-&gt;ay * s-&gt;ay + s-&gt;az * s-&gt;az)) * <span class="hljs-number">57.29578f</span>;
}

<span class="hljs-comment">/* ---------- a fake HAL that replays a recorded register dump ----------
   each line: &quot;R reg byte byte ...&quot; (the chip returned these bytes) or &quot;W reg value&quot;, or &quot;R reg NACK&quot; */</span>
<span class="hljs-keyword">typedef</span> <span class="hljs-class"><span class="hljs-keyword">struct</span> {</span> <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> *lines; <span class="hljs-type">int</span> n, pos, failed; <span class="hljs-type">char</span> why[<span class="hljs-number">128</span>]; } <span class="hljs-type">replay_t</span>;
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">replay_read</span><span class="hljs-params">(<span class="hljs-type">void</span> *ctx, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">uint8_t</span> *buf, <span class="hljs-type">int</span> n)</span> {
  <span class="hljs-type">replay_t</span> *r = ctx;
  <span class="hljs-keyword">if</span> (r-&gt;pos &gt;= r-&gt;n) { <span class="hljs-built_in">snprintf</span>(r-&gt;why, <span class="hljs-keyword">sizeof</span> r-&gt;why, <span class="hljs-string">&quot;unexpected read of 0x%02X&quot;</span>, reg); r-&gt;failed = <span class="hljs-number">1</span>; <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *l = r-&gt;lines[r-&gt;pos++];
  <span class="hljs-type">unsigned</span> want_reg; <span class="hljs-type">int</span> off;
  <span class="hljs-keyword">if</span> (<span class="hljs-built_in">sscanf</span>(l, <span class="hljs-string">&quot;R %x%n&quot;</span>, &amp;want_reg, &amp;off) != <span class="hljs-number">1</span> || want_reg != reg) { <span class="hljs-built_in">snprintf</span>(r-&gt;why, <span class="hljs-keyword">sizeof</span> r-&gt;why, <span class="hljs-string">&quot;read 0x%02X, dump has \\&quot;%s\\&quot;&quot;</span>, reg, l); r-&gt;failed = <span class="hljs-number">1</span>; <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
  <span class="hljs-keyword">if</span> (<span class="hljs-built_in">strstr</span>(l, <span class="hljs-string">&quot;NACK&quot;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *p = l + off;
  <span class="hljs-keyword">for</span> (<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) {
    <span class="hljs-type">unsigned</span> v; <span class="hljs-type">int</span> used;
    <span class="hljs-keyword">if</span> (<span class="hljs-built_in">sscanf</span>(p, <span class="hljs-string">&quot;%x%n&quot;</span>, &amp;v, &amp;used) != <span class="hljs-number">1</span>) { <span class="hljs-built_in">snprintf</span>(r-&gt;why, <span class="hljs-keyword">sizeof</span> r-&gt;why, <span class="hljs-string">&quot;read %d bytes, dump has fewer&quot;</span>, n); r-&gt;failed = <span class="hljs-number">1</span>; <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>; }
    buf[i] = (<span class="hljs-type">uint8_t</span>)v; p += used;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">int</span> <span class="hljs-title function_">replay_write</span><span class="hljs-params">(<span class="hljs-type">void</span> *ctx, <span class="hljs-type">uint8_t</span> reg, <span class="hljs-type">uint8_t</span> value)</span> {
  <span class="hljs-type">replay_t</span> *r = ctx;
  <span class="hljs-type">unsigned</span> want_reg, want_val;
  <span class="hljs-keyword">if</span> (r-&gt;pos &gt;= r-&gt;n || <span class="hljs-built_in">sscanf</span>(r-&gt;lines[r-&gt;pos], <span class="hljs-string">&quot;W %x %x&quot;</span>, &amp;want_reg, &amp;want_val) != <span class="hljs-number">2</span> || want_reg != reg || want_val != value) {
    <span class="hljs-built_in">snprintf</span>(r-&gt;why, <span class="hljs-keyword">sizeof</span> r-&gt;why, <span class="hljs-string">&quot;wrote 0x%02X=0x%02X, dump has \\&quot;%s\\&quot;&quot;</span>, reg, value, r-&gt;pos &lt; r-&gt;n ? r-&gt;lines[r-&gt;pos] : <span class="hljs-string">&quot;end&quot;</span>);
    r-&gt;failed = <span class="hljs-number">1</span>; <span class="hljs-keyword">return</span> <span class="hljs-number">-1</span>;
  }
  r-&gt;pos++;
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}
<span class="hljs-type">static</span> <span class="hljs-type">imu_hal_t</span> <span class="hljs-title function_">replay_hal</span><span class="hljs-params">(<span class="hljs-type">replay_t</span> *r)</span> { <span class="hljs-type">imu_hal_t</span> h = {replay_read, replay_write, r}; <span class="hljs-keyword">return</span> h; }
<span class="hljs-meta">#<span class="hljs-keyword">define</span> CHECK(c) do { <span class="hljs-keyword">if</span> (!(c)) { printf(<span class="hljs-string">&quot;FAIL line %d: %s\\n&quot;</span>, __LINE__, #c); exit(1); } } while (0)</span>
<span class="hljs-meta">#<span class="hljs-keyword">define</span> NEAR(a, b, tol) (fabsf((a) - (b)) &lt;= (tol))</span>

<span class="hljs-type">int</span> <span class="hljs-title function_">main</span><span class="hljs-params">(<span class="hljs-type">void</span>)</span> {
  <span class="hljs-type">imu_t</span> imu; <span class="hljs-type">imu_sample_t</span> s; <span class="hljs-type">float</span> roll, pitch;
  <span class="hljs-comment">/* dump 1: flat on the bench, +-2 g, +-250 dps */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> flat[] = {
    <span class="hljs-string">&quot;R 75 68&quot;</span>, <span class="hljs-string">&quot;W 6B 01&quot;</span>, <span class="hljs-string">&quot;W 1C 00&quot;</span>, <span class="hljs-string">&quot;W 1B 00&quot;</span>,
    <span class="hljs-string">&quot;R 3B FF 9C 00 52 40 1C F0 B0 00 0C FF F6 00 03&quot;</span>,
  };
  <span class="hljs-type">replay_t</span> r1 = {flat, <span class="hljs-number">5</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r1), <span class="hljs-number">2</span>, <span class="hljs-number">250</span>) == IMU_OK);
  CHECK(imu_read(&amp;imu, &amp;s) == IMU_OK &amp;&amp; !r1.failed &amp;&amp; r1.pos == r1.n);
  imu_tilt(&amp;s, &amp;roll, &amp;pitch);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;flat:   a = (%.4f, %.4f, %.4f) g, T = %.2f C, w = (%.3f, %.3f, %.3f) dps, roll %.2f pitch %.2f\\n&quot;</span>, s.ax, s.ay, s.az, s.temp_c, s.gx, s.gy, s.gz, roll, pitch);
  CHECK(NEAR(s.az, <span class="hljs-number">1.0017f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.ax, <span class="hljs-number">-0.0061f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.temp_c, <span class="hljs-number">25.0f</span>, <span class="hljs-number">0.01f</span>));
  CHECK(NEAR(s.gx, <span class="hljs-number">12</span> / <span class="hljs-number">131.072f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.gy, <span class="hljs-number">-10</span> / <span class="hljs-number">131.072f</span>, <span class="hljs-number">1e-4</span>f));
  CHECK(fabsf(roll) &lt; <span class="hljs-number">0.5f</span> &amp;&amp; fabsf(pitch) &lt; <span class="hljs-number">0.5f</span>);
  <span class="hljs-comment">/* dump 2: tilted 30 degrees about x, +-8 g, +-1000 dps (the worked example) */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> tilted[] = {
    <span class="hljs-string">&quot;R 75 68&quot;</span>, <span class="hljs-string">&quot;W 6B 01&quot;</span>, <span class="hljs-string">&quot;W 1C 10&quot;</span>, <span class="hljs-string">&quot;W 1B 10&quot;</span>,
    <span class="hljs-string">&quot;R 3B 00 00 08 00 0D DB F0 B0 00 00 00 00 00 00&quot;</span>,
  };
  <span class="hljs-type">replay_t</span> r2 = {tilted, <span class="hljs-number">5</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r2), <span class="hljs-number">8</span>, <span class="hljs-number">1000</span>) == IMU_OK &amp;&amp; imu_read(&amp;imu, &amp;s) == IMU_OK &amp;&amp; !r2.failed);
  imu_tilt(&amp;s, &amp;roll, &amp;pitch);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;tilted: a = (%.4f, %.4f, %.4f) g, roll %.2f pitch %.2f\\n&quot;</span>, s.ax, s.ay, s.az, roll, pitch);
  CHECK(NEAR(s.ay, <span class="hljs-number">0.5f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.az, <span class="hljs-number">0.86597f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(roll, <span class="hljs-number">30.0f</span>, <span class="hljs-number">0.01f</span>) &amp;&amp; NEAR(pitch, <span class="hljs-number">0.0f</span>, <span class="hljs-number">0.01f</span>));
  <span class="hljs-comment">/* dump 3: full-scale negative values decode as signed */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> neg[] = { <span class="hljs-string">&quot;R 75 68&quot;</span>, <span class="hljs-string">&quot;W 6B 01&quot;</span>, <span class="hljs-string">&quot;W 1C 18&quot;</span>, <span class="hljs-string">&quot;W 1B 18&quot;</span>, <span class="hljs-string">&quot;R 3B 80 00 7F FF 00 01 00 00 80 00 7F FF FF FF&quot;</span> };
  <span class="hljs-type">replay_t</span> r3 = {neg, <span class="hljs-number">5</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r3), <span class="hljs-number">16</span>, <span class="hljs-number">2000</span>) == IMU_OK &amp;&amp; imu_read(&amp;imu, &amp;s) == IMU_OK);
  CHECK(NEAR(s.ax, <span class="hljs-number">-16.0f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.ay, <span class="hljs-number">32767</span> / <span class="hljs-number">2048.0f</span>, <span class="hljs-number">1e-4</span>f) &amp;&amp; NEAR(s.gx, <span class="hljs-number">-2000.0f</span>, <span class="hljs-number">1e-3</span>f) &amp;&amp; NEAR(s.gz, <span class="hljs-number">-2000</span> / <span class="hljs-number">32768.0f</span>, <span class="hljs-number">1e-5</span>f));
  <span class="hljs-comment">/* dump 4: the wrong chip; dump 5: nobody answers; bad range: no bus access at all */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> wrong[] = { <span class="hljs-string">&quot;R 75 71&quot;</span> };
  <span class="hljs-type">replay_t</span> r4 = {wrong, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r4), <span class="hljs-number">2</span>, <span class="hljs-number">250</span>) == IMU_EID &amp;&amp; r4.pos == <span class="hljs-number">1</span>);
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> nack[] = { <span class="hljs-string">&quot;R 75 NACK&quot;</span> };
  <span class="hljs-type">replay_t</span> r5 = {nack, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r5), <span class="hljs-number">2</span>, <span class="hljs-number">250</span>) == IMU_EBUS);
  <span class="hljs-type">replay_t</span> r6 = {<span class="hljs-literal">NULL</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r6), <span class="hljs-number">3</span>, <span class="hljs-number">250</span>) == IMU_ERANGE &amp;&amp; r6.pos == <span class="hljs-number">0</span> &amp;&amp; !r6.failed);
  <span class="hljs-comment">/* a driver that configured ranges in the wrong order would be caught by the replay */</span>
  <span class="hljs-type">const</span> <span class="hljs-type">char</span> *<span class="hljs-type">const</span> order[] = { <span class="hljs-string">&quot;R 75 68&quot;</span>, <span class="hljs-string">&quot;W 6B 01&quot;</span>, <span class="hljs-string">&quot;W 1B 00&quot;</span>, <span class="hljs-string">&quot;W 1C 00&quot;</span> };
  <span class="hljs-type">replay_t</span> r7 = {order, <span class="hljs-number">4</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-string">&quot;&quot;</span>};
  CHECK(imu_init(&amp;imu, replay_hal(&amp;r7), <span class="hljs-number">2</span>, <span class="hljs-number">250</span>) == IMU_EBUS &amp;&amp; r7.failed);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;replay caught: %s\\n&quot;</span>, r7.why);
  <span class="hljs-built_in">printf</span>(<span class="hljs-string">&quot;PASS\\n&quot;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
}</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>Your driver works, but every few hundred readings the X acceleration jumps by about 0.016 g at ±2 g for one sample. What’s the likely cause?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>0.016 g at 16 384 LSB/g is about 256 counts: a torn read, with high and low bytes from different samples. Check that the driver reads all 14 bytes in one burst, and that the I2C layer doesn’t split the transfer into several transactions.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does the test check the order of the configuration writes, and when would that be too strict?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>The order matters for some chips: the MPU-6050 ignores configuration writes while asleep, so waking it must come first. Checking the exact sequence catches such regressions. It’s too strict when the order genuinely doesn’t matter, because then a harmless refactor breaks the test; a looser fake can check the final register values instead.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p11-l07"></div>

`,i=[{id:`register-maps`,title:`Register maps`},{id:`scaling`,title:`Scaling`},{id:`why-one-burst-read`,title:`Why one burst read`},{id:`a-hal-for-testability`,title:`A HAL for testability`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p11-l07-q1`,type:`num`,q:`<p>Accelerometer sensitivity in LSB/g at ±4 g?</p>
`,explain:`<p>32 768 counts over the range.</p>
`,answer:8192,tol:0,unit:`LSB/g`},{id:`p11-l07-q2`,type:`num`,q:`<p>Temperature in °C for a raw reading of 0?</p>
`,explain:`<p>The datasheet’s offset.</p>
`,answer:36.53,tol:1e-4,unit:`°C`},{id:`p11-l07-q3`,type:`num`,q:`<p>Roll in degrees for a_y = 0.5 g and a_z = 0.866 g?</p>
`,explain:`<p>atan2(a_y, a_z).</p>
`,answer:30,tol:.001,unit:`°`},{id:`p11-l07-q4`,type:`num`,q:`<p>Rate in °/s for a raw gyro reading of 1000 at ±500 °/s?</p>
`,explain:`<p>65.536 LSB per °/s.</p>
`,answer:15.26,tol:.002,unit:`°/s`},{id:`p11-l07-q5`,type:`mc`,q:`<p>Why read all 14 output bytes in one burst?</p>
`,explain:`<p>Separate reads can tear between samples.</p>
`,options:[`the chip latches them, so all values come from one sample`,`I2C can’t read single bytes`,`it saves flash`,`to avoid clock stretching`],answer:0},{id:`p11-l07-q6`,type:`mc`,q:`<p>What does the recorded-dump test catch that a fake returning fixed values doesn’t?</p>
`,explain:`<p>It checks every transaction against what the real chip saw.</p>
`,options:[`wrong registers, wrong order or extra bus accesses`,`wiring faults`,`timing jitter`,`nothing more`],answer:0}],o=[{file:`imu.c`,lang:`c`,src:`#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- the HAL interface the driver depends on ---------- */
typedef struct {
  int (*read)(void *ctx, uint8_t reg, uint8_t *buf, int n);   /* 0 on success */
  int (*write)(void *ctx, uint8_t reg, uint8_t value);
  void *ctx;
} imu_hal_t;

/* ---------- the driver ---------- */
enum { REG_GYRO_CONFIG = 0x1B, REG_ACCEL_CONFIG = 0x1C, REG_ACCEL_XOUT_H = 0x3B, REG_PWR_MGMT_1 = 0x6B, REG_WHO_AM_I = 0x75 };
typedef enum { IMU_OK = 0, IMU_EBUS = -1, IMU_EID = -2, IMU_ERANGE = -3 } imu_err_t;
typedef struct { imu_hal_t hal; float accel_lsb_per_g, gyro_lsb_per_dps; } imu_t;
typedef struct { float ax, ay, az, temp_c, gx, gy, gz; } imu_sample_t;

static imu_err_t imu_init(imu_t *imu, imu_hal_t hal, int accel_g, int gyro_dps) {
  static const int ag[4] = {2, 4, 8, 16}, gd[4] = {250, 500, 1000, 2000};
  int ai = -1, gi = -1;
  for (int i = 0; i < 4; i++) { if (ag[i] == accel_g) ai = i; if (gd[i] == gyro_dps) gi = i; }
  if (ai < 0 || gi < 0) return IMU_ERANGE;
  imu->hal = hal;
  uint8_t id;
  if (hal.read(hal.ctx, REG_WHO_AM_I, &id, 1)) return IMU_EBUS;
  if (id != 0x68) return IMU_EID;
  if (hal.write(hal.ctx, REG_PWR_MGMT_1, 0x01)) return IMU_EBUS;        /* wake, clock from the X gyro PLL */
  if (hal.write(hal.ctx, REG_ACCEL_CONFIG, (uint8_t)(ai << 3))) return IMU_EBUS;
  if (hal.write(hal.ctx, REG_GYRO_CONFIG, (uint8_t)(gi << 3))) return IMU_EBUS;
  imu->accel_lsb_per_g = 32768.0f / (float)accel_g;
  imu->gyro_lsb_per_dps = 32768.0f / (float)gyro_dps;
  return IMU_OK;
}
static int16_t be16(const uint8_t *p) { return (int16_t)((uint16_t)p[0] << 8 | p[1]); }
static imu_err_t imu_read(imu_t *imu, imu_sample_t *s) {
  uint8_t b[14];
  if (imu->hal.read(imu->hal.ctx, REG_ACCEL_XOUT_H, b, 14)) return IMU_EBUS;   /* one burst: a consistent snapshot */
  s->ax = be16(b + 0) / imu->accel_lsb_per_g; s->ay = be16(b + 2) / imu->accel_lsb_per_g; s->az = be16(b + 4) / imu->accel_lsb_per_g;
  s->temp_c = be16(b + 6) / 340.0f + 36.53f;
  s->gx = be16(b + 8) / imu->gyro_lsb_per_dps; s->gy = be16(b + 10) / imu->gyro_lsb_per_dps; s->gz = be16(b + 12) / imu->gyro_lsb_per_dps;
  return IMU_OK;
}
static void imu_tilt(const imu_sample_t *s, float *roll_deg, float *pitch_deg) {
  *roll_deg = atan2f(s->ay, s->az) * 57.29578f;
  *pitch_deg = atan2f(-s->ax, sqrtf(s->ay * s->ay + s->az * s->az)) * 57.29578f;
}

/* ---------- a fake HAL that replays a recorded register dump ----------
   each line: "R reg byte byte ..." (the chip returned these bytes) or "W reg value", or "R reg NACK" */
typedef struct { const char *const *lines; int n, pos, failed; char why[128]; } replay_t;
static int replay_read(void *ctx, uint8_t reg, uint8_t *buf, int n) {
  replay_t *r = ctx;
  if (r->pos >= r->n) { snprintf(r->why, sizeof r->why, "unexpected read of 0x%02X", reg); r->failed = 1; return -1; }
  const char *l = r->lines[r->pos++];
  unsigned want_reg; int off;
  if (sscanf(l, "R %x%n", &want_reg, &off) != 1 || want_reg != reg) { snprintf(r->why, sizeof r->why, "read 0x%02X, dump has \\"%s\\"", reg, l); r->failed = 1; return -1; }
  if (strstr(l, "NACK")) return -1;
  const char *p = l + off;
  for (int i = 0; i < n; i++) {
    unsigned v; int used;
    if (sscanf(p, "%x%n", &v, &used) != 1) { snprintf(r->why, sizeof r->why, "read %d bytes, dump has fewer", n); r->failed = 1; return -1; }
    buf[i] = (uint8_t)v; p += used;
  }
  return 0;
}
static int replay_write(void *ctx, uint8_t reg, uint8_t value) {
  replay_t *r = ctx;
  unsigned want_reg, want_val;
  if (r->pos >= r->n || sscanf(r->lines[r->pos], "W %x %x", &want_reg, &want_val) != 2 || want_reg != reg || want_val != value) {
    snprintf(r->why, sizeof r->why, "wrote 0x%02X=0x%02X, dump has \\"%s\\"", reg, value, r->pos < r->n ? r->lines[r->pos] : "end");
    r->failed = 1; return -1;
  }
  r->pos++;
  return 0;
}
static imu_hal_t replay_hal(replay_t *r) { imu_hal_t h = {replay_read, replay_write, r}; return h; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\\n", __LINE__, #c); exit(1); } } while (0)
#define NEAR(a, b, tol) (fabsf((a) - (b)) <= (tol))

int main(void) {
  imu_t imu; imu_sample_t s; float roll, pitch;
  /* dump 1: flat on the bench, +-2 g, +-250 dps */
  const char *const flat[] = {
    "R 75 68", "W 6B 01", "W 1C 00", "W 1B 00",
    "R 3B FF 9C 00 52 40 1C F0 B0 00 0C FF F6 00 03",
  };
  replay_t r1 = {flat, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r1), 2, 250) == IMU_OK);
  CHECK(imu_read(&imu, &s) == IMU_OK && !r1.failed && r1.pos == r1.n);
  imu_tilt(&s, &roll, &pitch);
  printf("flat:   a = (%.4f, %.4f, %.4f) g, T = %.2f C, w = (%.3f, %.3f, %.3f) dps, roll %.2f pitch %.2f\\n", s.ax, s.ay, s.az, s.temp_c, s.gx, s.gy, s.gz, roll, pitch);
  CHECK(NEAR(s.az, 1.0017f, 1e-4f) && NEAR(s.ax, -0.0061f, 1e-4f) && NEAR(s.temp_c, 25.0f, 0.01f));
  CHECK(NEAR(s.gx, 12 / 131.072f, 1e-4f) && NEAR(s.gy, -10 / 131.072f, 1e-4f));
  CHECK(fabsf(roll) < 0.5f && fabsf(pitch) < 0.5f);
  /* dump 2: tilted 30 degrees about x, +-8 g, +-1000 dps (the worked example) */
  const char *const tilted[] = {
    "R 75 68", "W 6B 01", "W 1C 10", "W 1B 10",
    "R 3B 00 00 08 00 0D DB F0 B0 00 00 00 00 00 00",
  };
  replay_t r2 = {tilted, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r2), 8, 1000) == IMU_OK && imu_read(&imu, &s) == IMU_OK && !r2.failed);
  imu_tilt(&s, &roll, &pitch);
  printf("tilted: a = (%.4f, %.4f, %.4f) g, roll %.2f pitch %.2f\\n", s.ax, s.ay, s.az, roll, pitch);
  CHECK(NEAR(s.ay, 0.5f, 1e-4f) && NEAR(s.az, 0.86597f, 1e-4f) && NEAR(roll, 30.0f, 0.01f) && NEAR(pitch, 0.0f, 0.01f));
  /* dump 3: full-scale negative values decode as signed */
  const char *const neg[] = { "R 75 68", "W 6B 01", "W 1C 18", "W 1B 18", "R 3B 80 00 7F FF 00 01 00 00 80 00 7F FF FF FF" };
  replay_t r3 = {neg, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r3), 16, 2000) == IMU_OK && imu_read(&imu, &s) == IMU_OK);
  CHECK(NEAR(s.ax, -16.0f, 1e-4f) && NEAR(s.ay, 32767 / 2048.0f, 1e-4f) && NEAR(s.gx, -2000.0f, 1e-3f) && NEAR(s.gz, -2000 / 32768.0f, 1e-5f));
  /* dump 4: the wrong chip; dump 5: nobody answers; bad range: no bus access at all */
  const char *const wrong[] = { "R 75 71" };
  replay_t r4 = {wrong, 1, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r4), 2, 250) == IMU_EID && r4.pos == 1);
  const char *const nack[] = { "R 75 NACK" };
  replay_t r5 = {nack, 1, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r5), 2, 250) == IMU_EBUS);
  replay_t r6 = {NULL, 0, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r6), 3, 250) == IMU_ERANGE && r6.pos == 0 && !r6.failed);
  /* a driver that configured ranges in the wrong order would be caught by the replay */
  const char *const order[] = { "R 75 68", "W 6B 01", "W 1B 00", "W 1C 00" };
  replay_t r7 = {order, 4, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r7), 2, 250) == IMU_EBUS && r7.failed);
  printf("replay caught: %s\\n", r7.why);
  printf("PASS\\n");
  return 0;
}`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};